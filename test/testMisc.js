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

assert.equal(emutils.getCdmPropertyName("foo"), "foo");
assert.equal(emutils.getCdmPropertyName("targetType"), "targetType$");
assert.equal(emutils.getCdmPropertyName("cdmqueryname"), "cdmqueryname$");