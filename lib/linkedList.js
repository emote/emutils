"use strict";

exports.LinkedList = LinkedList;

/**
 A collection of Emotive-specific utility functions

 @module linkedList
 **/

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
