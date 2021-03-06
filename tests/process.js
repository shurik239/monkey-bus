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
        it("should not throw exception if __baseAppDir is set global & fsm ist found under this dir", function(){
            global.__baseAppDir = __dirname + '/fixture/';
            assert.doesNotThrow(function() {
                bus.process('dummyfsm');
            });
            delete global.__baseAppDir;
        });
        it("process should return to different objects", function(){
            var process1 = bus.process(existedFSM);
            var process2 = bus.process(existedFSM);

            assert.notStrictEqual(process1, process2);
        });
        it("client can subscribe only on events of this process", function(done){
            var process1 = bus.process(existedFSM);
            var process2 = bus.process(existedFSM);

            var testCommand = 'somecommand2'

            var doneAlreadyCalled = false;

            process2.on('transition', function(message){
                assert.equal(message.payload.commandName, testCommand);
                if (!doneAlreadyCalled) {
                    setTimeout(done, 500);
                    doneAlreadyCalled = true;
                }
            }).then(function(cons){
                process1.start({
                    commandName: 'somecommand1'
                });
                process2.start({
                    commandName: testCommand
                });
            });
        });
    });

});