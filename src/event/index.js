"use strict";

var logger = require("../logging")("bus-event");
var util = require('util');
var filter = require('../filter');
var createCustomerOrProducerPromise = require('../factory');

const entityType = "event";

var producerClass = 'Publisher';
var consumerClass = 'Subscriber';

function EventClass(entityName, rabbitPromise, consumerId) {

    var producerPromise, consumerPromise;

    var fullPath = [entityType, entityName].join('.');

    var getProducerPromise = function(){
        if (!producerPromise) {
            var options = {
                exchange: fullPath,
                routingKey: fullPath,
                messageType: fullPath
            };
            producerPromise = createCustomerOrProducerPromise(
                rabbitPromise,
                entityName,
                producerClass,
                options,
                entityType
            );
        }

        return producerPromise;
    };

    var getConsumerPromise = function(){
        if (!consumerPromise) {
            var options = {
                exchange: fullPath,
                queue: {
                    name: [fullPath, consumerId].join('.'),
                    autoDelete: false
                },
                routingKey: fullPath,
                messageType: fullPath
            };
            consumerPromise = createCustomerOrProducerPromise(
                rabbitPromise,
                entityName,
                consumerClass,
                options,
                entityType
            );
        }

        return consumerPromise;
    };

    this.publish = function(message, properties) {
        properties = properties || {};

        return getProducerPromise().then(function(producer){
            producer.publish(message, properties);
            return producer;
        });
    };

    this.subscribe = function(callback, correlationId) {
        return getConsumerPromise().then(function(consumer){
            consumer.subscribe(function(message, properties, actions, next){
                actions.ack();
                if (correlationId && properties.correlationId !== correlationId) {
                    return;
                }
                callback(message);
            });
            return consumer;
        });
    };

    logger.debug(entityType+ ' ' + entityName + ' created');
}

module.exports = function(eventName, rabbitPromis, consumerId) {
    return new EventClass(filter.string(eventName), rabbitPromis, consumerId);
};
