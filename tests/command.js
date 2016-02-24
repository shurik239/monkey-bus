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

describe("command", function () {

    var Rabbit = require("wascally");

    var config = require('./config.json');
    var pro = Promise
        .resolve(Rabbit.configure(config))
        .then(function(){
            return Rabbit;
        });
    var commandSUT = require('../src/command');
    var bus = require('../src/bus')(config);

    after(function(){
        Rabbit.closeAll();
    });

    describe('#constructor', function() {

        it("should throw exception if command name is not a string", function(){
            assert.throws(function() {
                commandSUT({}, pro, 'test')
            }, Error);
        });

        it("should throw exception if command name is empty string", function(){
            assert.throws(function() {
                commandSUT('', pro, 'test')
            }, Error);
        });

        it("should return object with method send", function () {
            assert.isFunction(commandSUT('test', pro, 'test').send);
        });

        it("should return object with method receive", function () {
            assert.isFunction(commandSUT('test', pro, 'test').receive);
        });

    });

    describe('send/receive should handle message', function() {

        const commandName = 'test.command.name';

        it("command should produce event done", function(done) {
            bus.event(['command', commandName, 'done'].join('.')).subscribe(function(message){
                setTimeout(done, 250);
            });
        });

        it("publish should produce message", function(done) {
            var producedMessage = {
                foo: 'bar'
            };

            var command = bus.command(commandName);

            command.receive(function (consumedMessage) {
                assert.deepEqual(consumedMessage, producedMessage);
                setTimeout(done, 250);
            }).then(function(subscriber){
                subscriber.on("ready", function(){
                    command.send(producedMessage);
                });
            });
        });
    });
});