"use strict";

var subModules =
    [
        "bufferFunctions",
        "emotiveFunctions",
        "ioFunctions",
        "miscFunctions",
        "nodeFunctions",
        "typeFunctions",
        "cache",
        "linkedList"
    ];

subModules.forEach(function(name) {
    var module = require("./" + name + ".js");
    for (var memberName in module) {
        var member = module[memberName];
        if (typeof member == 'function') {
            exports[memberName] = member;
        }
    }
});

/**
A collection of Utility functions

@module emutils
**/

/**
@class emutils
**/

