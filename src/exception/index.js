"use strict";

var Promise = require('bluebird');

var logger = require("../logging")("bus-exception");
var util = require('util');
var filter = require('../filter');
var createCustomerOrProducerPromise = require('../factory');

const entityType = "exception";
const entityExchangeName = entityType + ".exchange";

var producerClass = 'Publisher';
var consumerClass = 'Subscriber';

function ExceptionClass(entityName, rabbitPromise, consumerId, bus, exception) {

    var producerPromise, consumerPromise;

    var fullPath = [entityType, entityName].join('.');

    var getProducerPromise = function(){
        if (!producerPromise) {
            var options = {
                exchange: entityExchangeName,
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
                exchange: entityExchangeName,
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

    this.throw = function(properties) {
        properties = properties || {};
        return getProducerPromise().then(function(producer){
            producer.publish({
                message: exception.message
            }, properties);
            return producer;
        });
    };

    this.catch = function(callback) {
        return new Promise(function (resolve, reject) {
            return getConsumerPromise().then(function(consumer){
                consumer.subscribe(function(message, properties, actions, next){
                    Promise
                        .try(callback.bind(null, message, properties))
                        .catch(function(error){
                            logger.error(error);
                        });
                    actions.ack();
                });
                return consumer;
            }).then(function(consumer) {
                consumer.once("ready", function(){
                    resolve(consumer);
                })
            });
        });
    };

    logger.debug(entityType + ' ' + entityName + ' created');
}

module.exports = function(exception, rabbitPromise, consumerId, bus) {
    var exceptionName = (exception instanceof Error) ? exception.message : exception;

    return new ExceptionClass(
        filter.string(exceptionName).replace(/[^a-z0-9_]/ig, '_'),
        rabbitPromise,
        consumerId,
        bus,
        exception
    );
};
