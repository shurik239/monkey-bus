var machina = require('machina');

module.exports = machina.BehavioralFsm.extend({


    finalState: 'done',

    initialState: "uninitialized",

    start: function(client ) {
        this.handle( client, "start" );
    },

    commandExceptionListener: function(exception, properties) {
        if (properties.correlationId) {
            var process = this.processesWaitingForCommandDoneEvent[properties.correlationId];

            if (process) {
                this.handle(process, 'exceptionComing', exception);
            }
        }
    },

    states: {
        success: {
            _onEnter: function (process) {
                this.transition(process, 'done');
            }
        },
        exception: {
            _onEnter: function (process) {
                this.transition(process, 'done');
            }
        },
        done: {
            _onEnter: function (process) {
                delete this.processesWaitingForCommandDoneEvent[process.id];
            }
        }
    }

});
