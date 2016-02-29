"use strict";

var logger = require("../logging")("bus-command");
var util = require('util');
var filter = require('../filter');
var createCustomerOrProducerPromise = require('../factory');

const entityType = "command";
const entityExchangeName = entityType + ".exchange";

var producerClass = 'Sender';
var consumerClass = 'Receiver';

function CommandClass(entityName, rabbitPromise, consumerId, bus) {

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

    this.send = function(message, properties) {
        var properties = properties || {};
        var message = message || {};
        return getProducerPromise().then(function(producer){
            producer.send(message, properties);
            return producer;
        });
    };

    this.receive = function(callback) {
        return getConsumerPromise().then(function(consumer){
            consumer.receive(function(message, properties, actions, next){
                actions.ack();
                var commandResult = callback(message);
                var props = {};
                if (properties.correlationId) {
                    props.correlationId = properties.correlationId;
                }
                bus.event([entityType, entityName, 'done'].join('.')).publish(commandResult, props);
            });
            return consumer;
        });
    };

    logger.debug(entityType + ' ' + entityName + ' created');
}

module.exports = function(commandName, rabbitPromis, consumerId, bus) {
    return new CommandClass(filter.string(commandName), rabbitPromis, consumerId, bus);
};

