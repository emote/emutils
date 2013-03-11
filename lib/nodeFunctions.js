"use strict";

var domain = require('domain');
var path = require('path');

var typeFunctions = require("./typeFunctions.js");

exports.delay = delay;
exports.runTests = runTests;

/**
 A collection of node.js-specific utility functions

 @module nodeFunctions
 **/

// A domain that does not handle errors.
var noHandleDomain = domain.createDomain();

/**
 Call the specified callback with the specified args at the next tick,
 with any errors handled by the specified domain.
 @method delay
 @static
 @param domain {Domain}  The Domain to handle any errors from the callback.  May be null.
 @param args {Array} Arguments to pass to the callback.
 @param cb {Function(err, args)} the callback.
 **/
function delay(domain, args, cb) {
    var d = domain ? domain : noHandleDomain;
    process.nextTick(function() {
        d.run(function() {
            cb.apply(null, args);
        });
    });
}

/**
 unit test driver
 @method runTests
 @params directory the directory containing the scripts
 @params {Array} test scripts to run
 @params {Boolean} whether to establish an exit handler that prints test results
 **/
function runTests(directory, scripts, createExitHandler) {
    var errors = 0;
    if (createExitHandler) {

        process.on('exit', function () {
            console.log('Done.');
            if (errors > 0) {
                console.log(errors + " error(s) occurred.");
                process.exit(-1)
            }
        });
    }

    scripts.forEach(function(script) {
        console.log("Running " + script + " ...");
        delay(createTestDomain(script), null, function() {
            require(directory + path.sep + script);
        });
    });

    function createTestDomain(test) {
        var d = new domain.Domain();
        d.on("error", function(err) {
            errors++;
            console.log();
            console.log("Error in " + test + ":");
            console.log(err.toString());
            console.log();
        });
        return d;
    }
}
