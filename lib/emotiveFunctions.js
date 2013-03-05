"use strict";

exports.checkCredentials = checkCredentials;
exports.generateCredentialsError = generateCredentialsError;
exports.isReservedTypeName =  isReservedTypeName;
exports.isReservedPropertyName =  isReservedPropertyName;
exports.getCdmTypeName = getCdmTypeName;
exports.getCdmPropertyName = getCdmPropertyName;

/**
 A linked list implementation
 @module emotiveFunctions
 **/

/**
 @class emotiveFunctions
 **/

/**
 Generate an "invalid credentials" error
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
 Check whether the type name is reserved (starts with "cdm", case-insensitively), or is the escaped form or a reserved name
 @method isReservedTypeName
 @param {String} name
 @param {Boolean} strict if true, don't check for escaped forms
 @return {Boolean} whether it's reserved
 **/
var typeCheck = new RegExp("^_*cdm", "i");
var strictTypeCheck = new RegExp("^cdm", "i");
function isReservedTypeName(name, strict) {
    return (strict ? strictTypeCheck : typeCheck).test(name);
}

/**
 Check whether the property name is reserved (matches the list of reserved names, case-insensitively),
 or is the escaped form or a reserved name
 @method isReservedPropertyName
 @param {String} name
 @param {Boolean} strict if true, don't check for escaped forms
 @return {Boolean} whether it's reserved
 **/
var reservedPropNames =
    [
        'id',
        'version',
        'targettype',
        'tenantId',
        'createdat',
        'createdby',
        'lastmodifiedat',
        'lastmodifiedby',
        'cdmqueryname',
        'cdmentryowner',
        'storagelocation',
        'externalid',
        'externaltimestamp'];

var propCheck = new RegExp("^(" + reservedPropNames.join('|') + ")\\$*$", "i");
var strictPropCheck = new RegExp("^(" + reservedPropNames.join('|') + ")$", "i");
var prefixPropCheck = new RegExp("^CDM", "i");

function isReservedPropertyName(name, strict) {
    return prefixPropCheck.test(name) || (strict ? strictPropCheck : propCheck).test(name);
}


/**
 Get the CDM type name for a string, escaping it if need be by prepending "_"
 @method getCdmTypeName
 @param {String} name
 @return {String} the CDM type name
 **/
function getCdmTypeName(name) {
    return isReservedTypeName(name) ? "_" + name : name;
}

/**
 Get the CDM property name for a string, escaping it if need be by appending "$"
 @method getCdmPropertyName
 @param {String} name
 @return {String} the CDM type name
 **/
function getCdmPropertyName(name) {
    return isReservedPropertyName(name) ? name  + "$" : name;
}

