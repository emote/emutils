"use strict"

var emutils = require('../lib/emutils');
var assert = require('assert');

var c = new emutils.Cache(10, 3000, makeObj);

var cb1 = {count : 0};
var cb2 = {count : 0};
var creations = {count : 0};

testIt();

setTimeout(function() {
    assert.equal(cb1.count, 40);
    assert.equal(cb2.count, 40);
    assert.equal(creations.count, 20);
    assert.equal(c.size(), 10);
}, 2000);

setTimeout(function() {
    testIt();
}, 6000);

setTimeout(function() {
    assert.equal(cb1.count, 40);
    assert.equal(cb2.count, 40);
    assert.equal(creations.count, 20);
    assert.equal(c.size(), 10);
}, 8000);

var c2 = new emutils.Cache(10, 3000, makeObj2);

c2.get({key : "foo", value : "bar"}, function(err, value) {
    assert.ifError(err);
    assert.equal(value, "bar_value");
});


setTimeout(function() {
    c2.get({key : "foo", value : "baz"}, function(err, value) {
        assert.ifError(err);
        assert.equal(value, "bar_value");
    });
}, 10);

setTimeout(function() {
    c2.remove("foo");
    c2.get({key : "foo", value : "baz"}, function(err, value) {
        assert.ifError(err);
        assert.equal(value, "baz_value");
    });
}, 20);


function testIt() {
    cb1.count = cb2.count = creations.count = 0;

    for (var j = 0; j < 2; j++) {
        for (var i = 0; i < 20; i++) {
            get(i, cb1);
        }
    }
    for (var j = 0; j < 2; j++) {
        for (var i = 0; i < 20; i++) {
            get(i, cb2);
        }
    }
}


function get(i, counter) {
    var key = "foo" + i;
    c.get(key, function (err, data) {
        assert.ifError(err);
        assert.equal(data, key + "_value");
        counter.count++;
    });
}

function makeObj(key, cb) {
    setTimeout(function() {
        creations.count++;
        cb(null, key + "_value");
    }, 1000);
}

function makeObj2(key, cb) {
    cb(null, key.value + "_value");
}


