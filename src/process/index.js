var filter = require('../filter');
var logger = require("../logging")("bus-process");
var uuid = require("node-uuid");

const processNS = "process";

var snapshot = function(data) {
    var cache = [];
    var str = JSON.stringify(data, function(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (key === "timer") {
                return
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

var registeredProcesses = {};

function ProcessClass(fsm, bus, fsmName) {

    this.id = uuid.v4();

    this.client = {
        id: this.id
    };

    this.start = function(payload) {
        this.client.payload = payload;
        fsm.start(this.client);
        var client = snapshot( this.client );
        bus.event([processNS, fsmName, 'started'].join('.')).publish(client, {
            correlationId: this.id
        });
    };

    this.on = function(eventName, callback){
        return bus.event([processNS, fsmName, eventName].join('.')).subscribe(callback, this.id);
    };

    fsm.on("*", function (event, payload){
        if (payload.client.id === this.id) {
            bus.event([processNS, fsmName, event].join('.')).publish(payload, {
                correlationId: this.id
            });
        }
    }.bind(this));

}

var registeredFSMs = {};

function fsmFactory(fsmName, bus) {
    var fsm = require('./fsm/' + fsmName );
    fsm.namespace = fsmName;
    return fsm;
}

function getFsm(fsmName, bus) {
    if (!registeredFSMs[fsmName]) {
        registeredFSMs[fsmName] = fsmFactory(fsmName, bus);
        logger.debug('fsm "' + fsmName + '" created');
    }
    return registeredFSMs[fsmName];
}

module.exports = function(_fsmName, bus) {
    var fsmName = filter.string(_fsmName)
    var fsm = getFsm(fsmName, bus);
    var instance = new ProcessClass(fsm, bus, fsmName);
    registeredProcesses[instance.id] = instance;
    return instance;
};