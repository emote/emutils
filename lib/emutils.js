"use strict";

var util = require('util');
var domain = require('domain');
var path = require('path');

exports.toArray = toArray;
exports.merge = merge;
exports.match = match;
exports.clone = clone;
exports.cloneArray = clone_array;
exports.Cache = Cache;
exports.LinkedList = LinkedList;
exports.delay = delay;
exports.retry = retry;
exports.makeBuffer = makeBuffer;
exports.makeString = makeString;
exports.arrayToObject = arrayToObject;
exports.type = type;
exports.hasValue = hasValue;
exports.checkCredentials = checkCredentials;
exports.generateCredentialsError = generateCredentialsError;
exports.runTests = runTests;

/**
A collection of Utility functions

@module emutils
**/

/**
@class emutils
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
    else if (util.isArray(jsObj))	{
        return jsObj;
    }
    else	{
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
Convert a String that contaons btes to a node.js Buffer
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
Constuct an object from the rows of an array, using one peoperty of each 
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

var TYPES =
{
    'undefined'        : 'undefined',
    'number'           : 'number',
    'boolean'          : 'boolean',
    'string'           : 'string',
    '[object Function]': 'function',
    '[object RegExp]'  : 'regexp',
    '[object Array]'   : 'array',
    '[object Date]'    : 'date',
    '[object Number]'  : 'number',
    '[object Boolean]' : 'boolean',
    '[object String]'  : 'string'
};
var TOSTRING = Object.prototype.toString;

/**
Return the type of a value`
@method type
@static
@param o {Any}
@return {String} the type
**/
function type(o) {
    return TYPES[TOSTRING.call(o)] || TYPES[typeof o] ||  (o ? 'object' : 'null');
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
Generate an "invalid credetials" error
@method generateCredentialsError
@static
@param message {String} text error message
@param code {String}error code
@return {RestResponse} error response
**/
function generateCredentialsError(message, code) {
    var restResult = new Object();
    restResult.targetType = 'RestResult';
    restResult.status = 'ERROR';
    restResult.errors =
        [
            {
                targetType:'CdmError',
                errorCode: code,
                errorMessage:message
            }
        ];
    return restResult;
}

/**
Check whether credentials have been specified
@method checkCredentials
@static
@param restRequest {RestRequest} request to check
@param callback {Function(err, data)} callback to call on error
@return {boolean} whether credentials were specified
**/
function checkCredentials(restRequest, callback) {
    var credsExist = true;
    try {
        if (!restRequest.options.credentials.username) {
            credsExist = false;
        }
    }
    catch (ex) {
        credsExist = false;
    }
    if (!credsExist) {
        var restResult = generateCredentialsError("No credentials have been entered", 'integration.login.fail.nocredentials');
        callback(null, restResult);
        return false;
    }
    return true;
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
An in-memory cache
@class Cache
@constructor
@param size {Number} maximum number of items in the cache
@param ttl  {Number} time to live (in milliseconds) for cache entries (0 if they never expire)
@param fetch  {Function(key, function(err, value))} the function used to fetch items on cache misses
**/
function Cache(size, ttl, fetch) {
    this.maxSize = size;
    if (ttl > 0) {
        this.ttl = ttl;
    }
    this.fetch = fetch;
    this.list = new LinkedList();
    this.contents = new Object();
}
Cache.prototype.get = cache_get;
Cache.prototype.remove = cache_remove;
Cache.prototype.size = cache_size;

/**
Get an item from the cache
@method get
@param key {Object} the cache key
"key" must be either a string or an object with a string-valued field named "key"
@param cb  {Function(err, value)} called back with the result
**/
function cache_get(key, cb) {
    var done = false;
    var lookup = key.key ? key.key : key;
    var entry = this.contents[lookup];
    if (entry) {
        if (entry.pending) {
            entry.callbacks.push(cb);
            done = true;
        }
        else {
            var now = new Date().getTime();
            if (this.ttl && (now - entry.time < this.ttl)) {
                entry.processHit();
                process.nextTick(function() {
                    cb(null, entry.data);
                });
                done = true;
            }
            else {
                entry.remove();
            }
        }
    }
    if (!done) {
        entry = cache_make_pending_entry(this, lookup, cb);
        try
        {
            this.fetch(key, function(err, data){
                entry.resolvePending(err, data);
            });
        }
        catch (ex) {
            entry.resolvePending(ex);
        }
    }
}

/**
Remove an entry from the cache (presumably because it's invalid and needs to be refetched)
@method remove
@param key {Object} the cache key
"key" must be either a string or an object with a string-valued field named "key"
**/
function cache_remove(key) {
    var entry = this.contents[key];
    if (entry && !entry.pending) {
        entry.remove();
    }
}

/**
Return the number of items currently in the cache
@method size
@return {Number} size of the cache
**/
function cache_size() {
    return this.list.size();
}

function cache_make_pending_entry(cache, key, cb) {
    var entry = new Object();
    entry.key = key;
    entry.pending = true;
    entry.callbacks = [cb];
    entry.cache = cache;
    cache.contents[entry.key] = entry;

    entry.remove = entry_remove;
    entry.insert = entry_insert;
    entry.resolvePending = entry_resolve_pending;
    entry.processHit = entry_process_hit;

    return entry;
}

function entry_remove() {
    this.cache.list.remove(this);
    delete this.cache.contents[this.key];
}

function entry_insert() {
    var cache = this.cache;
    var list = cache.list;
    while (list.size() >= cache.maxSize) {
        list.peekFirst().remove();
    }
    list.addLast(this);
    this.time = new Date().getTime();
    cache.contents[this.key] = this;
}

function entry_resolve_pending(err, data) {
    if (err) {
        delete this.cache.contents[this.key];
    }
    else {
        delete this.pending;
        this.data = data;
        this.insert();
    }
    for (var i = 0; i < this.callbacks.length; i++) {
        delay(process.domain, [err, data], this.callbacks[i]);
    }
    delete this.callbacks;
}

function entry_process_hit() {
    this.cache.list.remove(this);
    this.cache.list.addLast(this);
}

/**
Create a linked list.  This is an intrusive list (i.e. the objects in the list 
are modified).  Accordingly, an object can only be in one list at a tine.  
Currently, only objects can be members of lists (no autoboxing)
@class LinkedList
@constructor
**/
function LinkedList() {
    this._ll_prev = this;
    this._ll_next = this;
    this.currentSize = 0;
}

LinkedList.prototype.addFirst = linkedList_addFirst;
LinkedList.prototype.addLast = linkedList_addLast;
LinkedList.prototype.peekFirst = linkedList_peekFirst;
LinkedList.prototype.peekLast = linkedList_peekLast;
LinkedList.prototype.removeFirst = linkedList_removeFirst;
LinkedList.prototype.removeLast = linkedList_removeLast;
LinkedList.prototype.remove = linkedList_remove;
LinkedList.prototype.size = linkedList_size;
/**
Add an object to the front of the list
@method addFirst
@param obj {Object} object to add
**/
function linkedList_addFirst(obj) {
    linkedList_checkNotInList(obj);
    var first = this._ll_next;
    first._ll_prev = obj;
    obj._ll_next = first;
    this._ll_next = obj;
    obj._ll_prev = this;
    obj._ll_parent = this;
    this.currentSize++;
}

/**
Add an object to the end of the list
@method addLast
@param obj {Object} object to add
**/
function linkedList_addLast(obj) {
    linkedList_checkNotInList(obj);
    var last = this._ll_prev;
    last._ll_next = obj;
    obj._ll_prev = last;
    this._ll_prev = obj;
    obj._ll_next = this;
    obj._ll_parent = this;
    this.currentSize++;
}

/**
Return the object at the front of the list without removing it
@method peekFirst
@return {Object} object returned
**/
function linkedList_peekFirst() {
    var first = this._ll_next;
    return first === this ? null : first;
}

/**
Return the object at the end of the list without removing it
@method peekLast
@return {Object} object returned
**/
function linkedList_peekLast() {
    var last = this._ll_prev;
    return last === this ? null : last;
}

/**
Remove the object at the front of the list and return it
@method removeFirst
@return {Object} object returned
**/
function linkedList_removeFirst() {
    var first = this._ll_next;
    if (first == this) {
        return null;
    }
    this._ll_next = first._ll_next;
    this._ll_next._ll_prev = this;
    delete first._ll_next;
    delete first._ll_prev;
    delete first._ll_parent;
    this.currentSize--;
    return first;
}

/**
Remove the object at the end of the list and return it
@method removeLast
@return {Object} object returned
**/
function linkedList_removeLast() {
    var last = this._ll_prev;
    if (last == this) {
        return null;
    }
    this._ll_prev = last._ll_prev;
    this._ll_prev._ll_next = this;
    delete last._ll_next;
    delete last._ll_prev;
    delete last._ll_parent;
    this.currentSize--;
    return last;
}

/**
Remove the specified object from the list
@method remove
@param obj object to remove
**/
function linkedList_remove(obj) {
    linkedList_checkInList(this, obj);
    obj._ll_prev._ll_next = obj._ll_next;
    obj._ll_next._ll_prev = obj._ll_prev;
    delete obj._ll_next;
    delete obj._ll_prev;
    delete obj._ll_parent;
    this.currentSize--;
}

/**
return the number of items in the list
@method size
@return {Number} size of list
**/
function linkedList_size() {
    return this.currentSize;
}

function linkedList_checkNotInList(obj) {
    if (obj._ll_parent) {
        throw new Error("The object is already a member of a linked list");
    }
}

function linkedList_checkInList(list, obj) {
    if (list !== obj._ll_parent) {
        throw new Error("The object is not a member of the linked list");
    }
}

/**
 unit test driver
 @method runTests
 @params directory the directory contaning the scripts
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