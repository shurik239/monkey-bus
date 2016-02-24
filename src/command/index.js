"use strict";

var Rabbus = require("rabbus");
var logger = require("../logging")("bus-command");
var util = require('util');
var filter = require('../filter');

const commandExchangeName = "command.exchange";

function CommandClass(commandName, rabbitPromise, consumerId, bus) {

    var producerPromise, consumerPromise;

    var getProducerPromise = function(){
        if (!producerPromise) {
            producerPromise = rabbitPromise.then(function(rabbit) {
                var fullPath = ['command', commandName].join('.');

                var producer = new Rabbus.Sender(rabbit, {
                    exchange: commandExchangeName,
                    routingKey: fullPath,
                    messageType: fullPath
                });
                producer.use(function(err, message, properties, actions, next){
                    logger.error(err.message, err.stackTrace);
                    throw err;
                });
                logger.debug('created producer for command ' + commandName);
                return producer;
            });
        }

        return producerPromise;
    };

    var getConsumerPromise = function(){
        if (!consumerPromise) {
            consumerPromise = rabbitPromise.then(function(rabbit) {
                var fullPath = ['command', commandName].join('.');
                var consumer = new Rabbus.Receiver(rabbit, {
                    exchange: commandExchangeName,
                    queue: [fullPath, consumerId].join('.'),
                    routingKey: fullPath,
                    messageType: fullPath
                });
                consumer.use(function(err, message, properties, actions, next){
                    logger.error(err.message, err.stack);
                    throw err;
                });
                logger.debug('created consumer ' + consumerId + ' for command ' + commandName);
                return consumer;
            });
        }

        return consumerPromise;
    };

    this.send = function(message) {
        return getProducerPromise().then(function(producer){
            producer.send(message);
            return producer;
        });
    };

    this.receive = function(callback) {
        return getConsumerPromise().then(function(consumer){
            consumer.receive(function(message, properties, actions, next){
                actions.ack();
                callback(message);
                bus.event(['command', commandName, 'done'].join('.')).publish({});
            });
            return consumer;
        });
    };

    logger.debug('command ' + commandName + ' created');
}

module.exports = function(commandName, rabbitPromis, consumerId, bus) {
    return new CommandClass(filter.string(commandName), rabbitPromis, consumerId, bus);
};

