"use strict";

var Promise = require('bluebird');

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
            var producedMessage = {
                foo: 'bar'
            };

            var commandDoneMessage = {
                bar: 'foo'
            };

            bus.event(['command', commandName, 'done'].join('.')).subscribe(function(message){
                assert.deepEqual(message, commandDoneMessage);
                setTimeout(done, 250);
            });

            var command = bus.command(commandName);

            command.receive(function (consumedMessage) {
                assert.deepEqual(consumedMessage, producedMessage);
                return commandDoneMessage;
            }).then(function(subscriber){
                subscriber.on("ready", function(){
                    command.send(producedMessage);
                });
            });
        });

        it("command has to handle empty arguments", function () {
            assert.doesNotThrow(function () {
                bus.command('somecommand').send();
            });
        });

    });

    describe('command receiver can response with promise', function() {

        const commandName = 'test.command.name2';

        it("command should produce event done", function(done) {
            var producedMessage = {
                foo: 'bar'
            };

            var commandDoneMessage = {
                bar: 'foo'
            };

            bus.event(['command', commandName, 'done'].join('.')).subscribe(function(message){
                assert.deepEqual(message, commandDoneMessage);
                setTimeout(done, 250);
            }).then(function(){
                var command = bus.command(commandName);

                command.receive(function (consumedMessage) {
                    assert.deepEqual(consumedMessage, producedMessage);
                    return Promise.delay(1).then(function() {
                        return commandDoneMessage;
                    });
                }).then(function(subscriber){
                    subscriber.on("ready", function(){
                        command.send(producedMessage);
                    });
                });

            });
        });

    });

});