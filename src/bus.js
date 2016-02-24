"use strict";

var Rabbit = require("wascally");
var Promise = require("bluebird");
var logger = require("./logging")();
var _event = require('./event');

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

module.exports = function(config){

     _event.setConsumerId(config.consumerId ? config.consumerId : uuid.v4());

    if (!rabbitPromise) {
        rabbitPromise = Promise
            .resolve(Rabbit.configure(config))
            .then(function(){
                return Rabbit;
            });
        _event.init(rabbitPromise);
    }

    return {
        event: _event.factory
    }
};
