var Rabbus = require("rabbus");
var logger = require("../logging")("bus-factory");

module.exports = function createCustomerOrProducerPromise(rabbitPromise, entityName, _class, options, _entityType) {
    return rabbitPromise.then(function (rabbit) {
        var customerOrProducer = new Rabbus[_class](rabbit, options);
        customerOrProducer.use(function (err, message, properties, actions, next) {
            logger.error(err.message, err.stackTrace);
            throw err;
        });
        logger.debug('created ' + _class +  ' for ' + _entityType + ' ' + entityName);
        return customerOrProducer;
    });
};