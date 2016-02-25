var machina = require('machina');

const GREEN = "green";
const YELLOW = "yellow";

var vehicleSignal = new machina.BehavioralFsm( {

    initialize: function( options ) {
        console.log("bin hier", options);
    },

    initialState: "uninitialized",

    states: {
        uninitialized: {
            "*": function( client ) {
                this.deferUntilTransition( client );
                this.transition( client, "green" );
            }
        },
        green: {
            _onEnter: function( client ) {
                client.timer = setTimeout( function() {
                    this.handle(  client, "timeout" );
                }.bind( this ), 30000 );
                this.emit( "vehicles", { client: client, status: GREEN } );
            },
            timeout: "green-interruptible",
            pedestrianWaiting: function( client ) {
                this.deferUntilTransition(  client, "green-interruptible" );
            },
            _onExit: function( client ) {
                clearTimeout( client.timer );
            }
        },
        "green-interruptible": {
            pedestrianWaiting: "yellow"
        },
        yellow: {
            _onEnter: function( client ) {
                client.timer = setTimeout( function() {
                    this.handle( client, "timeout" );
                }.bind( this ), 5000 );
                this.emit( "vehicles", { client: client, status: YELLOW } );
            },
            timeout: "red",
            _onExit: function( client ) {
                clearTimeout( client.timer );
            }
        },
        red: {
            _onEnter: function( client ) {
                client.timer = setTimeout( function() {
                    this.handle( client, "timeout" );
                }.bind( this ), 1000 );
            },
            _reset: "green",
            _onExit: function( client ) {
                clearTimeout( client.timer );
            }
        }
    },

    reset: function( client ) {
        this.handle(  client, "_reset" );
    },

    pedestrianWaiting: function( client ) {
        this.handle( client, "pedestrianWaiting" );
    }
} );

module.exports = vehicleSignal;