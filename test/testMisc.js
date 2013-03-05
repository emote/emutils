"use strict"

var emutils = require('../lib/emutils');
var assert = require('assert');

// test the mergeIntoBuffer function
var buf = emutils.mergeIntoBuffer("abc", new Buffer("def"), "ghi");
assert.equal(buf.toString(), "abcdefghi");
assert.ok(Object.getPrototypeOf(buf).writeInt8);  // buf is a Buffer

// test the reserved name functions
assert.ok(emutils.isReservedTypeName("CDMType"));
assert.ok(emutils.isReservedTypeName("CdMType"));
assert.ok(emutils.isReservedTypeName("CdmType"));
assert.ok(emutils.isReservedTypeName("CDMType", true));
assert.ok(emutils.isReservedTypeName("CdMType", true));
assert.ok(emutils.isReservedTypeName("CdmType", true));
assert.ok(emutils.isReservedTypeName("_CDMType"));
assert.ok(emutils.isReservedTypeName("__CdMType"));
assert.ok(emutils.isReservedTypeName("___CdmType"));
assert.ok(!emutils.isReservedTypeName("_CDMType", true));
assert.ok(!emutils.isReservedTypeName("__CdMType", true));
assert.ok(!emutils.isReservedTypeName("___CdmType", true));

assert.equal(emutils.getCdmTypeName("foo"), "foo");
assert.equal(emutils.getCdmTypeName("CdmType"), "_CdmType");
assert.equal(emutils.getCdmTypeName("_CdmType"), "__CdmType");

assert.ok(emutils.isReservedPropertyName("Id"));
assert.ok(emutils.isReservedPropertyName("VerSioN"));
assert.ok(emutils.isReservedPropertyName("TargetType"));
assert.ok(emutils.isReservedPropertyName("Id", true));
assert.ok(emutils.isReservedPropertyName("VerSioN", true));
assert.ok(emutils.isReservedPropertyName("TargetType", true));
assert.ok(emutils.isReservedPropertyName("Id$"));
assert.ok(emutils.isReservedPropertyName("VerSioN$$"));
assert.ok(emutils.isReservedPropertyName("TargetType$$$"));
assert.ok(!emutils.isReservedPropertyName("Id$", true));
assert.ok(!emutils.isReservedPropertyName("VerSioN$$", true));
assert.ok(!emutils.isReservedPropertyName("TargetType$$$", true));
assert.ok(emutils.isReservedPropertyName("CdMfoo"));
assert.ok(emutils.isReservedPropertyName("CDMfoo"));
assert.ok(emutils.isReservedPropertyName("CdMfoo$"));
assert.ok(emutils.isReservedPropertyName("CDMfoo$$"));
assert.ok(!emutils.isReservedPropertyName("ACDMfoo"));


assert.equal(emutils.getCdmPropertyName("foo"), "foo");
assert.equal(emutils.getCdmPropertyName("targetType"), "targetType$");
assert.equal(emutils.getCdmPropertyName("cdmqueryname"), "cdmqueryname$");
assert.equal(emutils.getCdmPropertyName("CDMfoo"), "CDMfoo$");
assert.equal(emutils.getCdmPropertyName("ACDMfoo"), "ACDMfoo");

var obj = {}
obj.b = 12;
obj.a = 14;

var values = [];
var keys = [];
emutils.forEach(obj, function(value, key)  {
    values.push(value);
    keys.push(key);
});

assert.equal(12, values[0]);
assert.equal(14, values[1]);
assert.equal('b', keys[0]);
assert.equal('a', keys[1]);

values = [];
keys = [];
emutils.forEach(obj, function(value, key)  {
    values.push(value);
    keys.push(key);
}, true);

assert.equal(14, values[0]);
assert.equal(12, values[1]);
assert.equal('a', keys[0]);
assert.equal('b', keys[1]);
