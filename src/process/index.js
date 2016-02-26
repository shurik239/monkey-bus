var filter = require('../filter');
var logger = require("../logging")("bus-process");
var uuid = require("node-uuid");

const processNS = "process";

var snapshot = function(data) {
    var cache = [];
    return JSON.stringify(data, function(key, value) {
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
};

function ProcessClass(fsm, bus, fsmName) {

    this.id = uuid.v4();

    this.client = {
        id: this.id
    }

    this.start = function(payload) {
        this.client.payload = payload;
        fsm.start(this.client);
        var client = snapshot( this.client );
        bus.event([processNS, fsmName, 'started'].join('.')).publish(client);
    }
}

var registeredFSMs = {};

function fsmFactory(fsmName) {
    var fsm = require('./fsm/' + fsmName );
    fsm.namespace = fsmName;
    fsm.on("*", function (){
        logger.debug('received from fsm ' + fsmName, arguments);
    });
    return fsm;
}

function getFsm(fsmName) {
    if (!registeredFSMs[fsmName]) {
        registeredFSMs[fsmName] = fsmFactory(fsmName);
    }
    logger.debug('fsm "' + fsmName + '" created');
    return registeredFSMs[fsmName];
}

module.exports = function(_fsmName, bus) {
    var fsmName = filter.string(_fsmName)
    var fsm = getFsm(fsmName);
    return new ProcessClass(fsm, bus, fsmName);
};