"use strict"

var emutils = require('../lib/emutils');
var assert = require('assert');

var list = new emutils.LinkedList();
assert.equal(list.size(), 0);

list.addFirst({name: "a"});
list.addFirst({name : "b"});
list.addFirst({name : "c"});
assert.equal(list.peekFirst().name, "c");
assert.equal(list.peekLast().name, "a");
assert.equal(list.size(), 3);
assert.equal(list.removeFirst().name, "c");
assert.equal(list.removeFirst().name, "b");
assert.equal(list.removeFirst().name, "a");
assert.equal(list.removeFirst(), null);
assert.equal(list.size(), 0);
assert.equal(list.peekFirst(), null);
assert.equal(list.peekLast(), null);

list.addLast({name: "a"});
list.addLast({name : "b"});
list.addLast({name : "c"});
assert.equal(list.peekFirst().name, "a");
assert.equal(list.peekLast().name, "c");
assert.equal(list.size(), 3);
assert.equal(list.removeLast().name, "c");
assert.equal(list.removeLast().name, "b");
assert.equal(list.removeLast().name, "a");
assert.equal(list.removeLast(), null);
assert.equal(list.size(), 0);
assert.equal(list.peekFirst(), null);
assert.equal(list.peekLast(), null);

var list2 = new emutils.LinkedList();

var obj = {name: "a"};
list.addFirst(obj);
assert.throws(function() {
    list.addFirst(obj);
});
assert.throws(function() {
    list2.addFirst(obj);
});

assert.equal(list.size(), 1);
assert.throws(function() {
    list.remove(new Object());
});
assert.throws(function() {
    list2.remove(obj);
});
list.remove(obj);
assert.equal(list.size(), 0);
