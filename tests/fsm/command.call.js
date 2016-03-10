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
        process.on(
            'transition',
            function(data) {
                assert.deepEqual(data.payload.commandDone, commandDoneData);
                setTimeout(done, 500);
            },
            {
                toState: "done"
            }
        ).then(function () {
            process.start({
                commandName: 'test.command',
                commandArgs: commandArguments
            });
        });
    });
    it('promise syntax should work', function (done) {
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
        process.start({
            commandName: 'test.command',
            commandArgs: commandArguments
        }).then(function(data) {
            assert.deepEqual(data.payload.commandDone, commandDoneData);
            setTimeout(done, 500);
        });
    });
    it('exception in command should be propagate to process start promise', function (done) {
        var commandArguments = {
            foo: "bar"
        };

        var testCommand = 'test.command.promise.catch';
        var exceptionMessage = 'exception message trace';

        bus.command(testCommand).receive(function(data){
            throw new Error(exceptionMessage);
        });

        var process = bus.process('command.call');
        process.start({
            commandName: testCommand,
            commandArgs: commandArguments
        }).catch(function(data) {
            assert.equal(data.payload.exception.message, exceptionMessage);
            setTimeout(done, 500);
        });
    });
});