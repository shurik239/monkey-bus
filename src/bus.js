"use strict";

var Rabbit = require("wascally");
var Promise = require("bluebird");
var logger = require("./logging")();
var Event = require('./event');
var Command = require('./command');
var Request = require('./request');
var Process = require('./process');
var Exception = require('./exception');
const util = require('util');
const filter = require('./filter');

var fs = Promise.promisifyAll(require("fs"));

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
            registered.events[eventNameFiltered] = Event(eventNameFiltered, rabbitPromise, consumerId, this);
        }

        return registered.events[eventNameFiltered];
    };

    this.command = function(commandName) {
        return Command(commandName, rabbitPromise, consumerId, this);
    };

    this.request = function(requestName) {
        return Request(requestName, rabbitPromise, consumerId);
    };

    this.process = function(fsmName) {
        return Process(fsmName, this);
    };

    this.exception = function(exceptionName) {
        return Exception(exceptionName, rabbitPromise, consumerId, this);
    };

    this.init = function() {
        var proms = {};

        var mapping = {
            command: 'receive',
            request: 'handle',
            event: 'subscribe'
        };

        for (var entity in mapping) {
            proms[entity] = fs.readdirAsync(global.__baseAppDir + 'consume/' + entity + '/')
                .map(function cutExtension(fileName){
                    return fileName.slice(0, -3);
                })
                .each(function registerConsumer(ent, entityName){
                    var consumer = require(global.__baseAppDir + 'consume/' + ent + '/' + entityName);
                    return this[ent](entityName)[mapping[ent]](consumer);
                }.bind(this, entity))
                .catch(function(e){
                    if (e.code !== "ENOENT") throw e;
                });
        }

        return Promise.props(proms);

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
