var filter = require('../filter');

function ProcessClass(name, consumerId, bus) {

}

function findFSM(fsmName) {
    throw new Error("cannot find fsm '" + fsmName + "'");
}

module.exports = function(_fsmName, rabbitPromis, consumerId, bus) {
    var fsm = findFSM(filter.string(_fsmName));
    return new ProcessClass(fsm, rabbitPromis, consumerId, bus);
};