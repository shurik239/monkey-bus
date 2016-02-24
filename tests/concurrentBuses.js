"use strict";

var chai = require("chai");
var assert = chai.assert;
var config = require('./config.json');

var Bus = require("../src/bus");

describe("two concurrent buses", function () {

    describe("with same name", function() {

        var bus1, bus2;

        before(function(){
            bus1 = Bus(config);
            bus2 = Bus(config);
        });

        it("should be the same object", function(){
            assert.strictEqual(bus1, bus2);
        });
    });

    describe("with different names", function() {

        var bus1, bus2;

        before(function(){
            var cfg = JSON.parse(JSON.stringify(config));
            delete cfg.consumerId;
            bus1 = Bus(cfg);
            bus2 = Bus(cfg);
        });

        it("should be two different object", function(){
            assert.notStrictEqual(bus1, bus2);
        });
    });

});
