var postal = require("postal");
var whistlepunk = require("whistlepunk");

var config =  {
    adapters: {
        stdOut: {
            level: 4
        }
    }
};

var loggerFactory = whistlepunk(postal, config);

function logger(ns){
    ns = ns || "bus";
    var l = loggerFactory(ns);
    return l;
}

module.exports = logger;