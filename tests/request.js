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

describe("request", function () {

    var Rabbit = require("wascally");

    var config = require('./config.json');
    var pro = Promise
        .resolve(Rabbit.configure(config))
        .then(function(){
            return Rabbit;
        });
    var requestSUT = require('../src/request');
    var bus = require('../src/bus')(config);

    describe('#constructor', function() {

        it("should throw exception if request name is not a string", function(){
            assert.throws(function() {
                requestSUT({}, pro, 'test')
            }, Error);
        });

        it("should throw exception if request name is empty string", function(){
            assert.throws(function() {
                requestSUT('', pro, 'test')
            }, Error);
        });

        it("should return object with method request", function () {
            assert.isFunction(requestSUT('test', pro, 'test').request);
        });

        it("should return object with method handle", function () {
            assert.isFunction(requestSUT('test', pro, 'test').handle);
        });

    });

    describe('send/receive should handle message', function() {

        const requestName = 'test.request.name';

        it("request should be able to call callback with response", function(done) {
            var producedMessage = {
                foo: 'bar'
            };

            var requestDoneMessage = {
                bar: 'foo'
            };

            var request = bus.request(requestName);

            request.handle(function (consumedMessage) {
                assert.deepEqual(consumedMessage, producedMessage);
                return requestDoneMessage;
            }).then(function(subscriber){
                subscriber.on("ready", function(){
                    request.request(producedMessage).then(function(message){
                        assert.deepEqual(message, requestDoneMessage);
                        setTimeout(done, 500);
                    });
                });
            });
        });
    });
    describe('receiver can response with promise', function() {

        const requestName = 'test.request.name';

        it("request should be able to call callback with response", function(done) {
            var producedMessage = {
                foo: 'bar'
            };

            var requestDoneMessage = {
                bar: 'foo'
            };

            var request = bus.request(requestName);

            request.handle(function (consumedMessage) {
                assert.deepEqual(consumedMessage, producedMessage);
                return Promise.delay(1000, function(){
                    return requestDoneMessage;
                });
            }).then(function(subscriber){
                subscriber.on("ready", function(){
                    request.request(producedMessage).then(function(message){
                        assert.deepEqual(message, requestDoneMessage);
                        setTimeout(done, 500);
                    });
                });
            });
        });
    });
});