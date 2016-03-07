"use strict";

var chai = require("chai");
var assert = chai.assert;
var Promise = require('bluebird');

function reportErr(err){
    setImmediate(function(){
        console.log(err.stack);
        throw err;
    });
}

var config = require('./config.json');
var bus = require('../src/bus')(config);

describe('exception', function () {

    describe('throwing exception in subscriber', function(){
        it("synchron exception", function(done) {
            const eventName = 'test.event.throwing-exception-synchron';

            var event = bus.event(eventName);

            event.subscribe(function () {
                setTimeout(done, 250);
                throw new Error('test exception');
            }).then(function(){
                event.publish();
            });
        });

        it("one should be able to subscribe to exception", function (done) {
            var exceptionMessage = 'some exception';

            var event = bus.event('throwing-exception-asynchron');

            bus.exception(exceptionMessage).catch(function(exception){
                assert.equal(exception.message, exceptionMessage);
                setTimeout(done, 500);
            }).then(function() {
                return event.subscribe(function () {
                    return Promise.delay(10).then(function () {
                        throw new Error(exceptionMessage);
                    });
                });
            }).then(function () {
                event.publish();
            });
        });
    });

});

