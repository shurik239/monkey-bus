var machina = require('machina');

const GREEN = "green";
const YELLOW = "yellow";

var vehicleSignal = new machina.BehavioralFsm( {

    initialize: function( options ) {
    },

    initialState: "uninitialized",

    states: {
        uninitialized: {
            "*": function( client ) {

            }
        }
    },

    start: function(client ) {
        this.handle( client, "start" );
    }
} );

module.exports = vehicleSignal;