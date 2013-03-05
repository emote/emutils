"use strict";

var linkedList = require("./linkedList.js");
var nodeFunctions = require("./nodeFunctions.js");

exports.Cache = Cache;

/**
 An in-memory cache

 @module cache
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
    this.list = new linkedList.LinkedList();
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
        nodeFunctions.delay(process.domain, [err, data], this.callbacks[i]);
    }
    delete this.callbacks;
}

function entry_process_hit() {
    this.cache.list.remove(this);
    this.cache.list.addLast(this);
}
