"use strict";

var Rabbus = require("rabbus");
var logger = require("../logging")("bus-request");
var util = require('util');
var filter = require('../filter');

const requestExchangeName = "request.exchange";

function RequestClass(requestName, rabbitPromise, consumerId, bus) {

    var producerPromise, consumerPromise;

    var getProducerPromise = function(){
        if (!producerPromise) {
            producerPromise = rabbitPromise.then(function(rabbit) {
                var fullPath = ['request', requestName].join('.');

                var producer = new Rabbus.Requester(rabbit, {
                    exchange: {
                        name: requestExchangeName,
                        type: "topic"
                    },
                    routingKey: fullPath,
                    messageType: fullPath
                });
                producer.use(function(err, message, properties, actions, next){
                    logger.error(err.message, err.stackTrace);
                    throw err;
                });
                logger.debug('created producer for request ' + requestName);
                return producer;
            });
        }

        return producerPromise;
    };

    var getConsumerPromise = function(){
        if (!consumerPromise) {
            consumerPromise = rabbitPromise.then(function(rabbit) {
                var fullPath = ['request', requestName].join('.');
                var consumer = new Rabbus.Responder(rabbit, {
                    exchange: {
                        name: requestExchangeName,
                        type: "topic"
                    },
                    queue: {
                        name: [fullPath, consumerId].join('.'),
                        limit: 1
                    },
                    routingKey: fullPath,
                    messageType: fullPath
                });
                consumer.use(function(err, message, properties, actions, next){
                    logger.error(err.message, err.stack);
                    throw err;
                });
                logger.debug('created consumer ' + consumerId + ' for request ' + requestName);
                return consumer;
            });
        }

        return consumerPromise;
    };

    this.request = function(message) {
        return getProducerPromise().then(function(producer){
            return new Promise(function(resolve){
                producer.request(message, resolve);
                return producer;
            });
        });
    };

    this.handle = function(callback) {
        return getConsumerPromise().then(function(consumer){
            consumer.handle(function(message, properties, actions, next){
                var requestResponse = callback(message);
                actions.reply(requestResponse);
            });
            return consumer;
        });
    };

    logger.debug('request ' + requestName + ' created');
}

module.exports = function(requestName, rabbitPromis, consumerId, bus) {
    return new RequestClass(filter.string(requestName), rabbitPromis, consumerId, bus);
};

