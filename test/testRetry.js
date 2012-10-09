"use strict"

var emutils = require('../lib/emutils');
var assert = require('assert');


var arg = {value : 4, count : 0};
emutils.retry(failUnless3, null, [arg], null, 5, null, function(err, data) {
    assert.ok(err);
    assert.equal(arg.count, 6);
});


var arg2 = {value : 0, count : 0};
emutils.retry(failUnless3, null, [arg2], {canRetry : never}, 5, null, function(err, data) {
    assert.ok(err);
    assert.equal(arg2.count, 1);
});

var arg3 = {value : 0, count : 0};
emutils.retry(failUnless3, null, [arg3], {canRetry : always, processRetry: inc}, 5, null, function(err, data) {
    assert.ifError(err);
    assert.equal(arg3.count, 4);
});

var arg4 = {value : 0, count : 0};
emutils.retry(failUnless3, null, [arg4], {canRetry : always, prepareRetry : return3, processRetry: setArg}, 5, [3], function(err, data) {
    assert.ifError(err);
    assert.equal(arg4.count, 2);
});

function always() {
    return true;
}

function never() {
    return false;
}

function inc(args) {
    args[0].value++;
}

function setArg(args, data) {
    args[0].value = data;
}

function return3(arg, cb) {
    assert.equal(arg, 3);
    cb(null, 3);
}

function failUnless3(arg, cb) {
    arg.count++;
    if (arg.value == 3) {
        cb(null, true);
    }
    else {
        cb(new Error());
    }
}