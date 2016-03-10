"use strict";

var filter = require('../filter');
var logger = require("../logging")("bus-process");
var uuid = require("node-uuid");

const processNS = "process";

var snapshot = function(data) {
    var cache = [];
    var str = JSON.stringify(data, function(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (key === "timer") {
                return;
            }

            if (cache.indexOf(value) !== -1) {
                return JSON.parse(JSON.stringify(value));
            }
            cache.push(value);
        }
        return value;
    });
    return JSON.parse(str);
};

function ProcessClass(bus, fsmName) {
    this.id = uuid.v4();
    this.bus = bus;
    this.payload = null;
    this.fsmName = fsmName;
}

var processListeners = {

};

var mainListener = function (eventName, eventPayload) {

    if (
        processListeners[eventPayload.client.id] &&
        processListeners[eventPayload.client.id][eventName]
    ) {
        var eventListeners = processListeners[eventPayload.client.id][eventName];
        var size = processListeners[eventPayload.client.id][eventName].length;
        var i = 0;

        for (; i < size; i += 1) {
            var properties = eventListeners[i].props;
            var eventPayloadHasNeededProperties = true;
            for (var prop in properties) {
                if (!eventPayload[prop] || eventPayload[prop] !== properties[prop]) {
                    eventPayloadHasNeededProperties = false;
                    break;
                }
            }
            if (eventPayloadHasNeededProperties) {
                eventListeners[i].callback(eventPayload.client);
            }
        }
    }
    if (eventName === 'transition') {
        var fsm = registeredFSMs[eventPayload.client.fsmName];
        if (fsm.finalState && fsm.finalState === eventPayload.toState) {
            delete processListeners[eventPayload.client.id];
        }
    }

    if (eventName === 'exception') {
        delete processListeners[eventPayload.client.id];
    }

};

var fsmListeners = {};

ProcessClass.prototype = (function () {

    var promiseResolve = null;
    var promiseReject = null;

    return {
        start: function(payload) {
            this.payload = payload;
            return new Promise((resolve, reject) => {
                promiseResolve = resolve;
                promiseReject = reject;
                Promise.all([
                    this.on(
                        'transition',
                        function(data) {
                            promiseResolve(data);
                        },
                        {
                            toState: 'success'
                        }
                    ),
                    this.on(
                        'transition',
                        function(data) {
                            promiseReject(data);
                        },
                        {
                            toState: 'exception'
                        }
                    )
                ]).then(() => {
                    registeredFSMs[this.fsmName].start(this);
                });
            });
        },
        on: function(eventName, cb, properties){
            properties = properties || {};

            if (!processListeners[this.id]) {
                processListeners[this.id] = {};
            }

            if (!processListeners[this.id][eventName]) {
                processListeners[this.id][eventName] = [];
            }

            processListeners[this.id][eventName].push({
                props: properties,
                callback: cb
            });

            if (!fsmListeners[this.fsmName][eventName]) {
                fsmListeners[this.fsmName][eventName] =
                    this.bus.event([processNS, this.fsmName, eventName].join('.'))
                        .subscribe(mainListener.bind(null, eventName));
            }

            return fsmListeners[this.fsmName][eventName];
        }
    }
}());

var registeredFSMs = {};

function fsmFactory(fsmName, bus) {
    var fsm;
    try {
        fsm = require('./fsm/' + fsmName);
    } catch (exception) {
        if (global.__baseAppDir) {
            fsm = require(global.__baseAppDir + 'fsm/' + fsmName);
        } else {
            throw exception;
        }
    }
    fsm.namespace = fsmName;

    fsm.on("*", function (event, data){
        bus.event([processNS, fsmName, event].join('.')).publish(data, {
            correlationId: data.client.id
        });
    });

    fsmListeners[fsmName] = {};

    return fsm;
}

function registerFsm(fsmName, bus) {
    if (!registeredFSMs[fsmName]) {
        registeredFSMs[fsmName] = fsmFactory(fsmName, bus);
        logger.debug('fsm "' + fsmName + '" created');
    }
    return registeredFSMs[fsmName];
}

module.exports = function(_fsmName, bus) {
    var fsmName = filter.string(_fsmName)
    registerFsm(fsmName, bus);
    return new ProcessClass(bus, fsmName);
};