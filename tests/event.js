"use strict";

var chai = require("chai");
var assert = chai.assert;
var Promise = require('bluebird');

var Rabbit = require("wascally");

function reportErr(err){
    setImmediate(function(){
        console.log(err.stack);
        throw err;
    });
}

process.on("unhandledException", reportErr);
process.on("unhandledRejection", reportErr);

after(function(){
    Rabbit.closeAll();
});

describe("event", function () {

    var config = require('./config.json');
    var pro = Promise
        .resolve(Rabbit.configure(config))
        .then(function(){
            return Rabbit;
        });
    var eventSUT = require('../src/event');

    describe('#constructor', function() {

        it("should throw exception if event name is not a string", function(){
            assert.throws(function() {
                eventSUT({}, pro, 'test')
            }, Error);
        });

        it("should throw exception if event name is empty string", function(){
            assert.throws(function() {
                eventSUT('', pro, 'test')
            }, Error);
        });

        it("should return object with method publish", function () {
            assert.isFunction(eventSUT('test', pro, 'test').publish);
        });

        it("should return object with method subscribe", function () {
            assert.isFunction(eventSUT('test', pro, 'test').subscribe);
        });

    });

    describe('subscriber should produce message', function() {

        it("publish should produce message", function(done) {

            const eventName = 'test.event.name';

            var producedMessage = {
                foo: 'bar'
            };

            var event = eventSUT(eventName, pro, 'test');

            event.subscribe(function (consumedMessage) {
                assert.deepEqual(consumedMessage, producedMessage);
                setTimeout(done, 250);
            }).then(function(subscriber){
                event.publish(producedMessage);
            });
        });
    });

});