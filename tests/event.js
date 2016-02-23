"use strict";

var chai = require("chai");
var sinon = require("sinon");
var assert = chai.assert;
sinon.assert.expose(assert, { prefix: "" });

function reportErr(err){
    setImmediate(function(){
        console.log(err.stack);
        throw err;
    });
}

process.on("unhandledException", reportErr);
process.on("unhandledRejection", reportErr);

describe("event", function () {

    var Rabbit = require("wascally");

    var config = require('./config.json');
    var pro = Rabbit.configure(config);
    var eventSUT = require('../src/event');

    eventSUT.init(pro);

    after(function(){
        Rabbit.closeAll();
    });

    it("should have method factory", function () {
        assert.isFunction(eventSUT.factory);
    });

    it("should have method init", function () {
        assert.isFunction(eventSUT.init);
    });

    describe('#factory', function() {

        it("should throw exception if event name is not a string", function(){
            assert.throws(function() {
                eventSUT.factory({})
            }, Error);
        });

        it("should throw exception if event name is empty string", function(){
            assert.throws(function() {
                eventSUT.factory('   ')
            }, Error);
        });

        it("should return object with method publish", function () {
            assert.isFunction(eventSUT.factory('test').publish);
        });

        it("should return object with method subscribe", function () {
            assert.isFunction(eventSUT.factory('test').subscribe);
        });

    });

    describe('publish/subscribe should produce message', function() {

        it("publish should produce message", function(done) {

            const eventName = 'test.event.name';

            var producedMessage = {
                foo: 'bar'
            };

            eventSUT.factory(eventName).subscribe(function (consumedMessage) {
                setTimeout(done, 100);
                assert.equal(consumedMessage, producedMessage);
            }).then(function(subscriber){
                subscriber.on("ready", function(){
                    eventSUT.factory(eventName).publish(producedMessage);
                });
            });
        });
    });
});