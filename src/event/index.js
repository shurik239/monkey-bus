"use strict";

var Rabbus = require("rabbus");
var logger = require("../logging")("bus-event");
var util = require('util');
var filter = require('../filter');

function EventClass(eventName, rabbitPromise, consumerId) {

    var producerPromise, consumerPromise;

    var getProducerPromise = function(){
        if (!producerPromise) {
            producerPromise = rabbitPromise.then(function(rabbit) {
                var fullPath = ['event', eventName].join('.');
                var producer = new Rabbus.Publisher(rabbit, {
                    exchange: fullPath,
                    routingKey: fullPath,
                    messageType: fullPath
                });
                producer.use(function(err, message, properties, actions, next){
                    logger.error(err.message, err.stackTrace);
                    throw err;
                });
                logger.debug('created producer for event ' + eventName);
                return producer;
            });
        }

        return producerPromise;
    };

    var getConsumerPromise = function(){
        if (!consumerPromise) {
            consumerPromise = rabbitPromise.then(function(rabbit) {
                var fullPath = ['event', eventName].join('.');
                var consumer = new Rabbus.Subscriber(rabbit, {
                    exchange: fullPath,
                    queue: [fullPath, consumerId].join('.'),
                    routingKey: fullPath,
                    messageType: fullPath
                });
                consumer.use(function(err, message, properties, actions, next){
                    logger.error(err.message, err.stack);
                    throw err;
                });
                logger.debug('created consumer ' + consumerId + ' for event ' + eventName);
                return consumer;
            });
        }

        return consumerPromise;
    };

    this.publish = function(message) {
        return getProducerPromise().then(function(producer){
            producer.publish(message);
            return producer;
        });
    };

    this.subscribe = function(callback) {
        return getConsumerPromise().then(function(consumer){
            consumer.subscribe(function(message, properties, actions, next){
                actions.ack();
                callback(message);
            });
            return consumer;
        });
    };

    logger.debug('event ' + eventName + ' created');
}

module.exports = function(eventName, rabbitPromis, consumerId) {
    return new EventClass(filter.string(eventName), rabbitPromis, consumerId);
};
