"use strict";

var util = require('util');
var domain = require('domain');

exports.toArray = toArray;
exports.merge = merge;
exports.match = match;
exports.loop = loop;
exports.clone = clone;
exports.cloneArray = clone_array;
exports.Session = Session;
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

/**
 * Convert jsonObj to an Array
 */
function toArray(jsonObj) {
    if (!jsonObj) {
        return [];
    }
    else if (util.isArray(jsonObj))	{
        return jsonObj;
    }
    else	{
        return [jsonObj];
    }
}

/**
 * Clone the input object
 */
function clone(source) {
    return merge(source, new Object());
}

/**
 * Clone the input array
 */
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
 * Find the first row in the array that matches the given fields
 */
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
 *   A closure-safe loop.  All parameters are functions that implement a classic for-loop, plus a JavaScript-style
 *   completion routine
 *
 * @param context --  A context object that will be passed to the functions that implement the loop
 * @param check -- boolean check(ctx).  Loop condition. If not specified, it's assumed that the context contains members named
 *                 index and limit, and the check is that index is less than limit.
 * @param increment -- void increment(ctx).  Loop increment. If not specified, it's assumed that the context contains a member named
 *                 index, which should be incremented.
 * @param body -- void body(ctx, callback(err)).  Loop body.   This should call the callback. If an error is passed, this terminates the loop.
 *                An exception which escapes the body also terminates the loop.  The body MUST either throw an excretion or
 *                call the callback.
 * @param callback -- void callback(err, ctx).  Guaranteed to be called on either normal or abnormal loop termination.
 */
function loop(context, check, increment, body, callback) {
    if (!increment) {
        increment = default_inc;
    }
    if (!check) {
        check = default_check;
    }

    var loopDomain = domain.createDomain();
    var loopCtx =
    {
        ctx: context, check: check, inc: increment, body: body, cb: callback,
        parentDomain: process.domain, loopDomain: loopDomain
    };
    loopDomain.on('error', function(err) {
        delay(loopCtx.parentDomain, null, function() {
            callback(err, context);
        });
    });

    doLoop(loopCtx);
}

function doLoop(loop) {

    if (loop.check(loop.ctx)) {
        delay(loop.loopDomain, null, function() {
            loop.body(loop.ctx, function(err) {
                if (err) {
                    delay(loop.parentDomain, null, function() {
                        loop.cb(err, loop.ctx);
                    });
                    return;
                }
                else {
                    loop.inc(loop.ctx);
                    doLoop(loop);
                }
            });
        });
    }
    else {
        delay(loop.parentDomain, null, function() {
            loop.cb(null, loop.ctx);
        });
    }
}

function default_inc(ctx) {
    ctx.index++;
}

function default_check(ctx) {
    return ctx.index < ctx.limit;
}

var session_ids = 0;
/**
 * Create a session object that can be used to run multiple operations in parallel
 */
function Session() {
    this.id = (++session_ids).toString();
    this.completed = 0;
    this.started = 0;
    this.closed = false;
    this.results = new Array();
    this.errors = new Array();
    this.parentDomain = process.domain;
    this.sessionDomain = domain.createDomain();

    var theSession = this;
    theSession.sessionDomain.on('error', function(err) {
        theSession.errors.push(err);
        theSession.completed++;
        session_check_complete(theSession);
    });
}

Session.prototype.addOperation = session_add_operation;
Session.prototype.close = session_close;
Session.prototype.createChildSession = session_create_child;

/**
 * Call session.add[operation_arg0, [operation_arg1[, ...]]], operation)
 * the operation will be called as operation([operation_arg0 ...], session_callback),
 * where session_callback MUST be called, with the calling sequence cb([result], [error])
 * @param arguments
 */
function session_add_operation() {
    if (this.closed) {
        throw new Error("Attempt made to add an operation to a closed session.")
    }
    var numArgs = arguments.length;
    var operation = arguments[numArgs-1];
    var args = new Array();
    for (var i = 0; i < numArgs - 1; i++) {
        args.push(arguments[i]);
    }
    var session = this;
    args.push(function(result, error) {
        if (result) {
            session.results.push(result);
        }
        if (error) {
            session.errors.push(error);
        }
        session.completed++;
        session_check_complete(session);
    })
    this.started++;
    delay(this.sessionDomain, args, operation);
}

/**
 * Create a child session.  This can be used exactly like any other session, except that no callback can be specified
 * when it is closed.  A session does not complete until all of its descendant sessions complete .
 */
function session_create_child() {
    if (this.closed) {
        throw new Error("Attempt made to create a child of a closed session.")
    }
    var child = new Session();
    child.id = this.id + "-" + child.id;
    child.parent = this;
    child.callback = function() {
        for (var i = 0; i < child.errors.length; i++) {
            child.parent.errors.push(child.errors[i]);
        }
        for (var i = 0; i < child.results.length; i++) {
            child.parent.results.push(child.results[i]);
        }
        child.parent.completed++;
        session_check_complete(child.parent);
    };
    this.started++;
    return child;
}


/**
 * Closes the session, so no more operations can be added.  When all are complete, the callback will be called as
 * callback(errors, results).
 * Note: a callback cannot be specified for a child session.
 */
function session_close(callback) {
    if (this.closed) {
        throw new Error("Attempt made to close a closed session.")
    }
    if (callback && this.parent) {
        throw new Error("Attempt made to specify a call back for a child session.")
    }
    this.closed = true;
    if (callback) {
        this.callback = callback;
    }
    session_check_complete(this);
}

function session_check_complete(session) {
    if (session.closed && (session.started == session.completed)) {
        if (session.callback) {
            delay(
                session.parentDomain,
                [session.errors,       session.results],
                session.callback);
        }
    }
}


/**
 *
 * Create an in-memory cache
 *
 * @param size -- maximum number of items in the cache
 * @param ttl  -- time to live (in milliseconds) for cache entries (0 if they never expire)
 * @param fetch  -- the function used to fetch items on cache misses: fetch(key, function(err, value)).
 *
 */
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
 * Get an item from the cache
 * @param key -- the cache key
 * "key" must be either a string or an object with a string-valued field named "key"
 * @param cb  -- called back with the result: cb(err, value)
 */
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
 * Remove an entry from the cache (presumably because it's invalid and needs to be refetched)
 *  * @param key -- the cache key (a string)
 */
function cache_remove(key) {
    var entry = this.contents[key];
    if (entry && !entry.pending) {
        entry.remove();
    }
}

/**
 *
 * @return the number of items currently in the cache
 */
function cache_size() {
    return this.list.size();
}

// A domain that does not handle errors.
var noHandleDomain = domain.createDomain();

/**
 * Call the specified callback with the specified args at the next tick, with any errors
 * handled by the specified domain.
 */
function delay(domain, args, cb) {
    var d = domain ? domain : noHandleDomain;
    d.run(function() {
        process.nextTick(function() {
            cb.apply(null, args);
        });
    });
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
 * Create a linked list.  This is an intrusive list (i.e. the objects in the list are modified).  Accordingly, an object
 * can only be in one list at a tine.  Currently, only objects can be members of lists (no autoboxing)
 */
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
 * Add an object to the front of the list
 */
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
 * Add an object to the end of the list
 */
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
 * Return the object at the front of the list without removing it
 */
function linkedList_peekFirst() {
    var first = this._ll_next;
    return first === this ? null : first;
}

/**
 * Return the object at the end of the list without removing it
 */
function linkedList_peekLast() {
    var last = this._ll_prev;
    return last === this ? null : last;
}

/**
 * Remove the object at the front of the list and return it
 */
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
 * Remove the object at the end of the list and return it
 */
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
 * Remove the specified object from the list
 */
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
 *
 * @return the number of items in the list
 */
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
 * Call a function, and retry it up to N times until it succeeds
 * @param func -- the function to call: func(arg1, arg2, ... function cb(err, data));
 * @param tthis -- "this" when calling func
 * @param args  -- arguments for func
 * @param handler -- retry handler, which has 3 members.  May be null, as may any or all of the members
 *                      canRetry(err) -- returns true if the error is retryable (by dfaul, all are retryable)
 *                      prepareRetry(retryArgs, cb(err, data)) -- function that prepares for the retry
 *                          (By default, a no-op)
 *                      processRetry(args, data_returned_from_processRetry) -- function that modifies args before the retry
 *                          (By default, a no-op)
 * @param retryCount -- maximum number of retries
 * @param retryArgs  -- arguments for prepareRetry
 * @param cb         -- called after the final call to func
 */
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
 * Make a String that contains bytes from a node,js Buffer
 * @param buffer
 * @return {*}
 */
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
 * make a node.js Buffer from a string that contains bytes
 */
function makeBuffer(str) {
    var buf = new Buffer(str.length);
    for (var i = 0; i < str.length ; i++) {
        buf[i] = str.charCodeAt(i);
    }
    return buf;
}

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

function type(o) {
    return TYPES[TOSTRING.call(o)] || TYPES[typeof o] ||  (o ? 'object' : 'null');
}

function hasValue(o) {
    return o != null && o != undefined;
}

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


