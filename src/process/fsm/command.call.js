var baseFSM = require('../fsm');

var vehicleSignal = new baseFSM( {
    states: {
        uninitialized: {
            "start": function( process ) {
                process.bus.event(['command', process.payload.commandName, 'done'].join('.'))
                    .subscribe(
                        function(doneData){
                            process.payload.commandDone = doneData;
                            this.transition(process, 'doneEventConsumed')
                        }.bind(this),
                        process.id
                    ).then(
                        function () {
                            this.transition(process, 'doneEventSubscribed')
                        }.bind(this)
                    );
            }
        },
        doneEventSubscribed: {
            _onEnter: function (process) {
                process.bus.command(process.payload.commandName).send(process.payload.commandArgs, {
                    correlationId: process.id
                });
            }
        },
        doneEventConsumed: {
            _onEnter: function (process) {
                this.emit('command.done', {
                    client: process
                });
            }
        }
    }
} );

module.exports = vehicleSignal;