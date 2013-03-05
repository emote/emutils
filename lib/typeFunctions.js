"use strict";

var miscFunctions = require("./miscFunctions.js");

exports.type = type;
exports.isArray = isArray;
exports.coerce = coerce;
exports.introspect = introspect;

/**
 A collection of type-related utility functions

 @module typeFunctions
 **/

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
 Return true if the argument is an array
 @method isArray
 @static
 @param o ({Any}
 @return whether the parameter is an array
**/
function isArray(o) {
    return type(o) == "array";
}

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
 Coerce an object to match a set of type definitions.  A best-case effort it made to convert fields of incorrect types.
 attributes not found in the type definition are dropped.  An error is generated only if the named type does not exist.
 Otherwise in the worst case, an empty object is returned.
 If the object passed is an array, each row is coerced.
 @method coerce
 @param (Object) obj Object to coerce
 @param {String} typeName name of type to coerce to
 @param (Object) types collection of types
 @return {Object} object after coercion
 **/
function coerce(obj, typeName, types) {

    var result = doCoerce(obj, typeName);
    return result == null ? {} : result;

    function doCoerce(obj, typeName) {
        var typedef = types[typeName];
        if (!typedef) {
            throw new Error("The type " + typeName  + " is unknown.");
        }
        var objType = type(obj);
        switch(objType) {

            case "array":
                var result = [];
                obj.forEach(function(row) {
                    var resultRow = doCoerce(row, typeName);
                    if (resultRow != null) {
                        result.push(resultRow);
                    }
                });
                return result;

            case "object":
                var result = {};
                typedef.content.forEach(function (fieldDesc)
                {
                    var fieldVal = obj[fieldDesc.name];
                    if (miscFunctions.hasValue(fieldVal)) {
                        var coercedVal;
                        if (fieldDesc.jsonType) {
                            coercedVal = coerceToJson(fieldVal, fieldDesc.jsonType);
                        }
                        else {
                            coercedVal = doCoerce(fieldVal, fieldDesc.type);
                        }
                        if (coercedVal != null) {
                            if (!fieldDesc.maxOccurs || fieldDesc.maxOccurs == 1) {
                                if (isArray(coercedVal)) {
                                    coercedVal = coercedVal[0];
                                }
                            }
                            else {
                                coercedVal = miscFunctions.toArray(coercedVal);
                            }
                            result[fieldDesc.name] = coercedVal;
                        }
                    }
                });
                return result;

            default:
                return null;
        }
    }

    function coerceToJson(obj, jsonType) {
        var objType = type(obj);
        if (objType == "array") {
            var result = [];
            obj.forEach(function(row) {
                var resultRow = coerceToJson(row, jsonType);
                if (resultRow != null) {
                    result.push(resultRow);
                }
            });
            return result;

        }

        switch(jsonType) {
            case "string":
                switch(objType) {
                    case "string":
                        return obj;

                    case "number":
                    case "boolean":
                    case "date":
                        return obj.toString();

                    default:
                        return null;
                }
                return object.toString();

            case "number":
                switch(objType) {
                    case "number":
                        return obj;

                    case "string":
                        var num = Number(obj);
                        return num == NaN ? null : num;

                    case "date":
                        return obj.getTime();

                    default:
                        return null;
                }

            case "boolean":
                switch(objType) {
                    case "boolean":
                        return obj;

                    case "string":
                        var lower = obj.toLowerCase();
                        switch (lower) {
                            case "false":
                                return false;
                            case "true":
                                return true;
                            default:
                                return null;
                        }

                    default:
                        return null;
                }

            case "date":
                switch(objType) {
                    case "date":
                        return obj;

                    case "number":
                    case "string":
                        return new Date(obj);

                    default:
                        return null;
                }
                return object.toString();

            default:
                return null;
        }
    }
}

/**
 Create a collection of types by introspection on a JavaScript object.
 @method introspect
 @param (Object) obj Object to introspect
 @return {Object} collection of type descriptions
 **/
function introspect(obj) {
    function updateType(ttype, object) {
        var properties = miscFunctions.arrayToObject('content');
    }

    function addProperty(ttype, object) {

    }

    function getPropertyType(name) {
        if (!miscFunctions.hasValue(object)) {
            return null;
        }
        var ttype = type(object);
        switch(ttype) {
            case "number":
            case "boolean":
            case "string":
            case "date":
            case 'object':
                return {type: ttype};

            case "regexp":
                return {type: "string"};

            case "array":
                if (obj.length == 0) {
                    return null;
                }
                var rowType = getRowType(obj);
                return {type : rowType, maxOccurs : -1};
        }
    }

    function promoteType(type1, type2) {
        if (type1 == type2) {
            return type1;
        }
        else if (isScalar(type1) && isScalar(type2)) {
            return "string";
        }
        else if (isScalar(type1)) {
            return type2;
        }
        else if (isScalar(type2)) {
            return type1;
        }
        else {
            return "array";
        }
    }

    function isScalar(type) {
        switch (type) {
            case "number":
            case "boolean":
            case "string":
            case "date":
                return true;

            default:
                return false;
        }
    }
}




