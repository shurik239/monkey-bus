"use strict";

var Rabbit = require("wascally");
var Promise = require("bluebird");
var logger = require("./logging")();
var Event = require('./event');
var Command = require('./command');
const util = require('util');
const filter = require('./filter');

var uuid = require("node-uuid");

function exit(){
    logger.warn("");
    logger.warn("shutting down ...");
    Rabbit.closeAll().then(function(){
        process.exit();
    });
}

process.once("SIGINT", function(){
    exit();
});

function errorHandler(err) {
    setImmediate(function () {
        logger.error(err, err.stack);
        exit();
    });
}

process.on("unhandledException", errorHandler);
process.on("unhandledRejection", errorHandler);

var rabbitPromise;

var registeredBuses = {};

function Bus (config, consumerId) {

    var registered = {
        events: {},
        commands: {}
    };

    if (!rabbitPromise) {
        rabbitPromise = Promise
            .resolve(Rabbit.configure(config))
            .then(function(){
                return Rabbit;
            });
    }

    this.event = function(eventName) {
        var eventNameFiltered = filter.string(eventName);

        if (!registered.events[eventNameFiltered]) {
            registered.events[eventNameFiltered] = Event(eventNameFiltered, rabbitPromise, consumerId);
        }

        return registered.events[eventNameFiltered];
    };

    this.command = function(commandName) {
        return Command(commandName, rabbitPromise, consumerId, this);
    };

    this.request = function(requestName) {

    };

    logger.debug("bus created, with configs", config);
}

module.exports = function(config){
    var consumerId = config.consumerId ? config.consumerId : uuid.v4();

    consumerId = filter.string(consumerId);

    if (!registeredBuses[consumerId]) {
        registeredBuses[consumerId] = new Bus(config, consumerId);
    }

    return registeredBuses[consumerId];
};
