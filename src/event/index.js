"use strict";

var logger = require("../logging")("bus-event");
var util = require('util');
var filter = require('../filter');
var createCustomerOrProducerPromise = require('../factory');
var Promise = require('bluebird');

const entityType = "event";

var producerClass = 'Publisher';
var consumerClass = 'Subscriber';

function EventClass(entityName, rabbitPromise, consumerId, bus) {

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
        message = message || {};
        return getProducerPromise().then(function(producer){
            producer.publish(message, properties);
            return producer;
        }).then(function(producer){
            logger.info('Event ' + entityName + ' published');
            logger.debug(message);
            return producer;
        });
    };

    this.subscribe = function(callback) {
        return new Promise(function (resolve, reject) {
            return getConsumerPromise().then(function(consumer){
                consumer.subscribe(function(message, properties, actions, next){
                    var props = {};
                    if (properties.correlationId) {
                        props.correlationId = properties.correlationId;
                    }
                    Promise
                        .try(callback.bind(null, message, properties))
                        .catch(function(error){
                            bus.exception(error).throw(props);
                        }).finally(function(){
                            actions.ack();
                        });
                });
                return consumer;
            }).then(function(consumer) {
                consumer.once("ready", function(){
                    resolve(consumer);
                })
            });
        });
    };

    logger.debug(entityType+ ' ' + entityName + ' created');
}

module.exports = function(eventName, rabbitPromis, consumerId, bus) {
    return new EventClass(filter.string(eventName), rabbitPromis, consumerId, bus);
};
