"use strict";

var Rabbus = require("rabbus");
var hash = require('object-hash');

var registered = {};

var rabbitPromise;

function EventClass(eventName) {

    var producerPromise, consumerPromise;

    var getProducerPromise = function(){
        if (!producerPromise) {
            producerPromise = rabbitPromise.then(function(rabbit) {
                var fullPath = ['event', eventName].join('.');
                return new Rabbus.Publisher(rabbit, {
                    exchange: fullPath,
                    routingKey: fullPath,
                    messageType: fullPath
                });
            });
        }

        return producerPromise;
    };

    var getConsumerPromise = function(consumerId){
        if (!consumerPromise) {
            consumerPromise = rabbitPromise.then(function(rabbit) {
                var fullPath = ['event', eventName].join('.');
                return new Rabbus.Subscriber(rabbit, {
                    exchange: fullPath,
                    queue: [fullPath, consumerId].join('.'),
                    routingKey: fullPath,
                    messageType: fullPath
                });
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
        return getConsumerPromise(hash(callback)).then(function(consumer){
            consumer.subscribe(function(message, properties, actions, next){
                actions.ack();
                callback(message);
            });
            return consumer;
        });
    };
}

module.exports = {

    init: function(rabbit) {
        if (!rabbitPromise) {
            rabbitPromise = rabbit;
        }
    },

    factory: function(eventName) {
        if (typeof eventName !== "string") {
            throw new Error("event name should be string");
        }

        eventName = eventName.trim();

        if (eventName === '') {
            throw new Error("event name is empty");
        }

        if (!registered[eventName]) {
            registered[eventName] = new EventClass(eventName);
        }
        return registered[eventName];
    }
};