"use strict";


exports.makeString = makeString;
exports.makeBuffer = makeBuffer;
exports.mergeIntoBuffer = mergeIntoBuffer;

/**
 A collection of Buffer-related utility functions

 @module bufferFunctions
 **/


/**
 convert a node.js Buffer to a String
 @method makeString
 @static
 @param {Buffer} buffer to convert
 @return {String}
 **/
var maxStringLen = 64000;
function makeString(buffer) {
    var start = 0;
    var strings = new Array();
    var buffLen = buffer.length;
    while (true) {
        var end = start + maxStringLen;
        var arr = new Array();
        for (var i = start; i < end && i < buffLen; i++) {
            arr.push(buffer[i]);
        }
        strings.push(String.fromCharCode.apply(null, arr));
        if (end >= buffLen) {
            break;
        }
        start = end;
    }
    switch (strings.length) {
        case 0:
            return "";

        case 1:
            return strings[0];

        default:
            return String.prototype.concat.apply("", strings);
    }
}

/**
 Convert a String that contains bytes to a node.js Buffer
 @method makeBuffer
 @static
 @param str {String} String to convert
 @return {Buffer}
 **/
function makeBuffer(str) {
    var buf = new Buffer(str.length);
    for (var i = 0; i < str.length ; i++) {
        buf[i] = str.charCodeAt(i);
    }
    return buf;
}

/**
 create a buffer that contains all the data from the buffers and/or strings provided.  Strings are converted using utf-8
 @method mergeIntoBuffer
 @return {Buffer} the merged buffer
 **/
function mergeIntoBuffer() {
    var bufArray = [];
    for(var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        if(typeof arg === 'string') {
            bufArray.push(new Buffer(arg, 'utf8'));
        } else {
            bufArray.push(arg);
        }
    }
    return Buffer.concat(bufArray);
}

