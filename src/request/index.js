"use strict";

var logger = require("../logging")("bus-request");
var util = require('util');
var filter = require('../filter');
var createCustomerOrProducerPromise = require('../factory');

const entityType = "request";
const entityExchangeName = entityType + ".exchange";

var producerClass = 'Requester';
var consumerClass = 'Responder';

function RequestClass(entityName, rabbitPromise, consumerId, bus) {

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
                    limit: 1,
                    autoDelete: true
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

    this.request = function(message) {
        message = message || {};
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

    logger.debug(entityType + ' ' + entityName + ' created');
}

module.exports = function(requestName, rabbitPromis, consumerId, bus) {
    return new RequestClass(filter.string(requestName), rabbitPromis, consumerId, bus);
};

