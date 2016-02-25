"use strict";

var chai = require("chai");
var assert = chai.assert;

function reportErr(err){
    setImmediate(function(){
        console.log(err.stack);
        throw err;
    });
}

process.on("unhandledException", reportErr);
process.on("unhandledRejection", reportErr);

var config = require('./config.json');
var bus = require('../src/bus')(config);

describe("process", function () {

    var existedFSM = 'command.call';

    describe('#constructor', function() {
        it("should throw exception if fsm not found", function(){
            assert.throws(function() {
                bus.process('not existed fsm');
            }, Error);
        });
        it("should not throw exception if fsm found", function(){
            assert.doesNotThrow(function() {
                bus.process(existedFSM);
            });
        });
        it("process should return to different objects", function(){
            var process1 = bus.process('command.call');
            var process2 = bus.process('command.call');

            assert.notStrictEqual(process1, process2);
        });
        it("process should publish event created", function(done){
            bus.event('process.' + existedFSM + '.created').subscribe(function(){
                done();
            });
        });
    });

    describe('send/receive should handle message', function() {

    });
});