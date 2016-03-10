var baseFSM = require('../fsm');
var Promise = require('bluebird');

var fsm = new baseFSM( {

    commandDoneSubscriberPromises: {},

    processesWaitingForCommandDoneEvent: {},

    commandDoneEventListener: function(doneEventPayload, properties) {
        if (properties.correlationId) {
            var process = this.processesWaitingForCommandDoneEvent[properties.correlationId];

            if (process) {
                this.handle(process, 'doneEventComing', doneEventPayload);
            }
        }

    },

    states: {
        uninitialized: {
            "start": function( process ) {
                this.processesWaitingForCommandDoneEvent[process.id] = process;

                if (!this.commandDoneSubscriberPromises[process.payload.commandName]) {
                    this.commandDoneSubscriberPromises[process.payload.commandName] = [
                            process.bus.event(['command', process.payload.commandName, 'done'].join('.'))
                                .subscribe(this.commandDoneEventListener.bind(this)),
                            process.bus.exception('#')
                                .catch(this.commandExceptionListener.bind(this))
                        ];

                }
                Promise.all(this.commandDoneSubscriberPromises[process.payload.commandName])
                    .then(this.transition.bind(this, process, 'doneEventSubscribed').bind(this));
            }
        },
        doneEventSubscribed: {
            _onEnter: function (process) {
                process.bus.command(process.payload.commandName).send(process.payload.commandArgs, {
                    correlationId: process.id
                });
            },
            doneEventComing: function(process, doneData) {
                process.payload.commandDone = doneData;
                this.transition(process, 'success');
            },
            exceptionComing: function(process, exception) {
                process.payload.exception = exception;
                this.transition(process, 'exception');
            }
        }
    }
});

module.exports = fsm;