var filter = require('../filter');
var logger = require("../logging")("bus-process");
var uuid = require("node-uuid");

const processNS = "process";

function ProcessClass(fsm, bus) {

    this.id = uuid.v4();

    this.client = {
        id: this.id
    }

    this.start = function(payload) {
        this.client.payload = payload;
        fsm.start(this.client);
//        bus.event(processNS)
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
    return new ProcessClass(fsm, bus);
};