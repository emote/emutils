"use strict"

var emutils = require('../lib/emutils');

// Run all unit tests
var scripts =
    [
        "testCache.js",
        "testList.js",
        "testRetry.js",
        "testTypes.js"
    ];

emutils.runTests(__dirname, scripts, true);