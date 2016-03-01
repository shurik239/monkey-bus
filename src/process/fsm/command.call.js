var baseFSM = require('../fsm');

var fsm = new baseFSM( {
    states: {
        uninitialized: {
            "start": function( process ) {
                process.bus.event(['command', process.payload.commandName, 'done'].join('.'))
                    .subscribe(
                        this.handle.bind(this, process, 'doneEventComing'),
                        process.id
                    ).then(
                        this.transition.bind(this, process, 'doneEventSubscribed')
                    );
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
        }
    }
} );

module.exports = fsm;