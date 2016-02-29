var machina = require('machina');

module.exports = machina.BehavioralFsm.extend({

    initialState: "uninitialized",

    start: function(client ) {
        this.handle( client, "start" );
    }

});
