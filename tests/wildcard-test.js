var util = require("util");
var Rabbus = require("rabbus");
var wascally = require("wascally");

wascally.configure({
    "connection": {
        "server": "localhost",
        "vhost": "/",
        "user": "guest",
        "pass": "guest"
    },
    "consumerId": "test"
}).then(function () {

    var c1 = new Rabbus.Subscriber(wascally, {
        exchange: {
            name: 'pub-sub.exchange',
            type: 'topic'
        },
        routingKey: "pub-sub.key",
        queue: "foo1"
    });

    c1.subscribe(function(msg, props, actions){
        console.log("c1 got it!");
        actions.ack();
    });

    var c2 = new Rabbus.Subscriber(wascally, {
        exchange: {
            name: 'pub-sub.exchange',
            type: 'topic'
        },
        routingKey: "#",
        queue: "foo2"
    });

    c2.subscribe(function(msg, props, actions){
        console.log("c2 got it!");
        actions.ack();
    });

    setTimeout(function () {
        function SomePublisher(){
            Rabbus.Publisher.call(this, wascally, {
                exchange: {
                    name: 'pub-sub.exchange',
                    type: 'topic'
                },
                routingKey: "pub-sub.key",
                messageType: "#"
            });
        }

        util.inherits(SomePublisher, Rabbus.Publisher);
        var publisher = new SomePublisher();

        var message = {
            place: "world"
        };

        publisher.publish(message, function(){
            console.log("published a message");
        });
    }, 250);

});

