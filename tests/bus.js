"use strict";

var chai = require("chai");
var sinon = require("sinon");
var assert = chai.assert;

var config = require('./config.json');

var busSUT = require('../src/bus')(config);

describe("bus", function () {
    it("should has event method", function () {
        assert.isFunction(busSUT.event);
    });
});