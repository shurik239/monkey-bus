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
            var process1 = bus.process(existedFSM);
            var process2 = bus.process(existedFSM);

            assert.notStrictEqual(process1, process2);
        });
        it("process start should publish event created", function(done){
            var consumer;

            var doneAllreadySent = false;

            bus.event('process.' + existedFSM + '.started').subscribe(function(message){
                if (doneAllreadySent) return;
                setTimeout(done, 250);
                doneAllreadySent = true;
            })
            .then(function(cons){
                consumer = cons;
                bus.process(existedFSM).start();
            });
        });
        //it("client can subscribe only on events of this process", function(done){
        //    var process1 = bus.process(existedFSM);
        //    var process2 = bus.process(existedFSM);
        //
        //    process2.on('started', function(message){
        //        console.log('her');
        //        assert.deepEqual(message.payload, {
        //            test: '2'
        //        });
        //        setTimeout(done, 500);
        //    }).then(function(cons){
        //        cons.on("ready", function(){
        //            process1.start({
        //                test: '1'
        //            });
        //            process2.start({
        //                test: '2'
        //            });
        //        });
        //    });
        //});
    });

});