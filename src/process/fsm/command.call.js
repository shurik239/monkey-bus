var baseFSM = require('../fsm');

var fsm = new baseFSM( {

    finalState: 'doneEventConsumed',

    commandDoneSubscriberPromises: {},

    processesWaitingForCommandDoneEvent: {},

    commandEventListener: function(doneEventPayload, properties) {
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
                    this.commandDoneSubscriberPromises[process.payload.commandName] =
                        process.bus.event(['command', process.payload.commandName, 'done'].join('.'))
                        .subscribe(this.commandEventListener.bind(this));
                }
                this.commandDoneSubscriberPromises[process.payload.commandName].then(
                    this.transition.bind(this, process, 'doneEventSubscribed').bind(this));
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
                this.transition(process, 'doneEventConsumed');
            }
        },
        doneEventConsumed: {
            _onEnter: function(process) {
                delete this.processesWaitingForCommandDoneEvent[process.id];
            }
        }
    }
} );

module.exports = fsm;