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

    describe('#constructor', function() {
        it("should throw exception if fsm not found", function(){
            assert.throws(function() {
                bus.process('not existed fsm');
            }, Error);
        });
    });

    describe('send/receive should handle message', function() {

    });
});