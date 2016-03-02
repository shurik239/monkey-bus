"use strict";

var chai = require("chai");
var assert = chai.assert;

var fs = require('fs');

var config = require('./config.json');

var Bus = require('../src/bus');

describe("bus", function () {

    describe("method exists", function(){

        var busSUT;

        before(function createBus(){
            busSUT = Bus(config);
        });

        it("event method", function () {
            assert.isFunction(busSUT.event);
        });

        it("command method", function () {
            assert.isFunction(busSUT.command);
        });

        it("request method", function () {
            assert.isFunction(busSUT.request);
        });

        it("process method", function () {
            assert.isFunction(busSUT.process);
        });

    });

    describe("#constructor", function(){

        var cfg;

        beforeEach(function(){
           cfg =  JSON.parse(JSON.stringify(config));
        });

        it("should throw exception if consumerId is not string", function () {
            cfg.consumerId = {};
            assert.throws(function(){
                Bus(cfg)
            }, Error);
        });
        it("should throw exception if consumerId is empty string", function () {
            cfg.consumerId = '   ';
            assert.throws(function(){
                Bus(cfg)
            }, Error);
        });
        it("should accept empty consumerId", function () {
            delete cfg.consumerId;
            assert.doesNotThrow(function(){
                Bus(cfg)
            });
        });

        it("events with same event name should be tha same object", function(){
            var event1 = Bus(config).event('test');
            var event2 = Bus(config).event('test');
            assert.strictEqual(event1, event2);
        });

        it("events with different event names should be different objects", function(){
            var event1 = Bus(config).event('test1');
            var event2 = Bus(config).event('test2');
            assert.notStrictEqual(event1, event2);
        });

    });

    describe("#init", function() {
        it("should be able to load topology from global.__baseAppDir directory", function (done) {
            global.__baseAppDir = __dirname + '/fixture/';
            assert.doesNotThrow(function() {
                Bus(config).init().then(function(){
                    delete global.__baseAppDir;
                    done();
                });
            });
        });
        it("throws no exceptions if global.__baseAppDir is empty directory", function (done) {
            var tempFolder = __dirname + '/fixture2/';
            global.__baseAppDir = tempFolder;
            fs.mkdirSync(tempFolder);
            fs.mkdirSync(tempFolder + 'consume/');
            assert.doesNotThrow(function() {
                Bus(config).init().then(function(){
                    delete global.__baseAppDir;
                    fs.rmdirSync(tempFolder + 'consume/');
                    fs.rmdirSync(tempFolder);
                    done();
                });
            });
        });
    });
});