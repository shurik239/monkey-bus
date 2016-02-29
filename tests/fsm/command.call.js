var chai = require("chai");
var assert = chai.assert;

function reportErr(err){
    setImmediate(function(){
        console.log(err.stack);
        throw err;
    });
}

process.on("unhandledException", reportErr);
process.on("unhandledRejection", reportErr);

var config = require('../config.json');
var bus = require('../../src/bus')(config);

describe('command.call fsm', function () {
    it('should emit event when command emitted done event', function (done) {
        var commandArguments = {
            foo: "bar"
        };

        var commandDoneData = {
            bar: "foo"
        };

        bus.command('test.command').receive(function(data){
            assert.deepEqual(data, commandArguments);
            return commandDoneData;
        });

        var process = bus.process('command.call');
        process.on('command.done', function(data) {
            assert.deepEqual(data.commandDone, commandDoneData);
            setTimeout(done, 500);
        }).then(function () {
            process.start({
                commandName: 'test.command',
                commandArgs: commandArguments
            });
        });
    })
});