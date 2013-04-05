"use strict";

var typeFunctions = require("./typeFunctions.js");

exports.toArray = toArray;
exports.clone = clone;
exports.cloneArray = clone_array;
exports.merge = merge;
exports.match = match;
exports.retry = retry;
exports.arrayToObject = arrayToObject;
exports.hasValue = hasValue;
exports.forEach = forEach;
exports.assertEquals = assertEquals;

/**
 A collection of miscellaneous utility functions

 @module miscFunctions
 **/

/**
 Convert a javascript object to an array
 @method toArray
 @static
 @param {Object} jsObj the object to convert
 @return {Array}  jsObj converted to an Array
 **/
function toArray(jsObj) {
    if (!jsObj) {
        return [];
    }
    else if (typeFunctions.isArray(jsObj)) {
        return jsObj;
    }
    else {
        return [jsObj];
    }
}

/**
 clone an object
 @method clone
 @static
 @param {Object} source
 @return {Object} a clone of the input object
 **/
function clone(source) {
    return merge(source, new Object());
}

/**
 Clone an array

 @method clone_array
 @static
 @param {Object} source
 @return {Object} a clone of the input array
 **/
function clone_array(source) {
    var target = [];
    if (source) {
        for (var i = 0; i < source.length; i++) {
            target.push(source[i]);
        }
    }

    return target;
}

/**
 Merge one object's properties into another

 @method merge
 @static
 @param {Object} source {Object} An object containing propertes to copy
 @param {Object} target {Object} The object to copy properties into
 @param {Object} [override=false] {boolean} Whether to override properties that already exist in the target
 @return {Object} the target
 **/
/*
 * Merge the properties of source into target
 */
function merge(source, target, override) {
    for (var name in source) {
        if (override || !target[name]) {
            target[name] = source[name];
        }
    }
    return target;
}

/**
 Find the first row in the array that matches the given fields
 @method match
 @static
 @param {Array} array the array to search
 @param {Object} toMatch an object contaoning the properites to match
 @return {Object} the first row (if any) that matches
 **/
function match(array, toMatch) {
    var retval;
    array.forEach(function(row) {
        var matches = true;
        for (var name in toMatch) {
            if (toMatch[name] !== row[name]) {
                matches = false;
            }
        }
        if (matches) {
            retval = row;
            return false;
        }
    });
    return retval;
}


/**
 Call a function, and retry it up to N times until it succeeds
 @method retry
 @static
 @param func {Function(arg1, arg2, ... function cb(err, data))} the function to call
 @param tthis {Object} "this" when calling func
 @param args  {Array} arguments for func
 @param handler {RetryHandler} retry handler.
 @param retryCount {Number} maximum number of retries
 @param retryArgs  {Array} arguments for prepareRetry
 @param cb {Function(err, data)} called after the final call to func
 **/
function retry(func, tthis, args, handler, retryCount, retryArgs, cb) {
    var hhandler = clone(default_handler);
    merge(handler, hhandler, true);
    var fargs = clone_array(args);
    fargs.push(function(err, data) {
        var shouldRetry = false;
        if (err) {
            if (retryCount > 0 && hhandler.canRetry(err)) {
                shouldRetry = true;
                var fretryArgs = clone_array(retryArgs);
                fretryArgs.push(
                    function(err, data) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            hhandler.processRetry(args, data);
                            retry(func, tthis, args, hhandler, retryCount-1, retryArgs, cb);
                        }
                    });
                hhandler.prepareRetry.apply(null, fretryArgs);
            }
        }
        if (!shouldRetry) {
            cb(err, data);
        }
    });
    func.apply(tthis, fargs);
}

var default_handler = {
    canRetry :          function() {return true;},
    prepareRetry :      function() {
        var cb = arguments[arguments.length-1];
        process.nextTick(function() {
            cb();
        });
    },
    processRetry :      function() {}
};

/**
 Constuct an object from the rows of an array, using one property of each
 row as the object's property name.
 @method arrayToObject
 @static
 @param arr {Array} array to convert
 @param fieldName {String} row property to index on
 @return {Object}
 **/
function arrayToObject(arr, fieldName) {
    var obj =  {};
    for (var i = 0; i < arr.length; i++) {
        var row = arr[i];
        obj[row[fieldName]] = row;
        delete row.fieldName;
    }
    return obj;
}

/**
 Return whether a value is present
 @method hasValue
 @static
 @param o {Any}
 @return {Boolean} true unless the value is null or undefined
 **/
function hasValue(o) {
    return o != null && o != undefined;
}

/**
 Retry handler used by retry()
 @class RetryHandler
 **/

/**
 Determines whether an error is retryable.  If this is omitted, all errors
 are retryable.
 @property canRetry
 @type Function(err)
 **/

/**
 Function that prepares for a retry.  If omitted, no preparation is done
 before the retry occurs.
 @property prepareRetry
 @type Function(retryArgs, cb(err, data))
 **/

/**
 Function that modifies the aguments used for a retry.  If omitted,
 the argsuments are not modified.
 @property canRetry
 @type Function(args, data_returned_from_processRetry))
 **/

/**
 Iterate over object properties
 @method forEach
 @params obj the object whose properties to iterate
 @params sort if true, process the properties in alphabetical order
 @params {Function}  cb callback function called cb(value, name)
 **/
function forEach(obj, cb, sort) {
    var keys = Object.keys(obj);
    if (sort) {
        keys.sort();
    }
    keys.forEach(function(key) {
        cb(obj[key], key);
    });
}

/**
 Assert that two objects are equal. If not, an exception describing the difference is thrown
 @method assertEquals
 @params obj1 first object to compare
 @params objj2 second object to compare
 */
function assertEquals(obj1, obj2) {
    checkEquals(obj1, obj2, "(top)");

    function checkEquals(obj1, obj2, objName) {
        var t1 = typeFunctions.type(obj1);
        var t2 = typeFunctions.type(obj2);

        if (t1 != t2)  {
            throw new Exception("at " + objName + " " + t1 + " .vs. " + t2);
        }
        switch (t1) {
            case "object":
                for (var name in obj1) {
                    if (hasValue(obj1[name]) && !hasValue(obj2[name])) {
                        throw new Exception(name + "." + namet1 + " .is missing");
                    }
                }
                for (var name in obj2) {
                    if (hasValue(obj2[name]) && !hasValue(obj1[name])) {
                        throw new Exception(name + "." + namet1 + " .is missing");
                    }
                    checkEquals(obj1[name], obj2[name], objName + "." + name);
                }
                break;

            case 'array':
                if (obj1.length != obj2.length) {
                    throw new Exception("different array lengths at " + objName);
                }
                obj1.forEach(function(row, index) {
                    checkEquals(row, obj2[index], objName + "[" + index + "]");
                })
                break;

            default:
                if (obj1 != obj2) {
                    throw new Exception("at " + objName + " " + obj1 + " .vs. " + obj2);
                }
                break;
        }
    }
}

