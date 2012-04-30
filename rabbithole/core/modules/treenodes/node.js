/*\
title: $:/core/treenodes/node.js
type: application/javascript
module-type: treenode

Base class for all other tree nodes

\*/
(function(){

/*jshint node: true, browser: true */
"use strict";

/*
The virtual base class for all types of renderer nodes. It keeps track of child nodes but otherwise contains no functionality
*/
var Node = function() {
	if(this instanceof Node) {
	} else {
		return new Node();
	}
};

/*
Makes a copy of a node, or returns the node itself if it doesn't need cloning because it doesn't have any state
*/
Node.prototype.clone = function() {
	// By default we don't actually clone nodes, we just re-use them (we do clone macros and elements)
	return this;
};

/*
Fire an event at a node which is also broadcast to any child nodes
*/
Node.prototype.broadcastEvent = function(event) {
	return true; // true means that the event wasn't handled by this node
};

/*
Execute a node and derive its child nodes
	parents: array of titles of each transcluded parent tiddler (used for detecting recursion)
	tiddlerTitle: title of the context tiddler within which this node is being executed
*/
Node.prototype.execute = function(parents,tiddlerTitle) {
};

/*
Render a node and its children to a particular MIME type
	type: Content type to which the node should be rendered
*/
Node.prototype.render = function(type) {
};

/*
Render a node and its children into the DOM
	parentDomNode: node that should become the parent of the rendered node
	insertBefore: optional node that the node should be inserted before
*/
Node.prototype.renderInDom = function(parentDomNode,insertBefore) {
};

/*
Re-execute a node if it is impacted by a set of tiddler changes
	changes: hashmap of tiddler changes in the format used by $tw.Wiki
*/
Node.prototype.refresh = function(changes) {	
};

/*
Re-execute a node if it is impacted by a set of tiddler changes, and update the associated DOM elements as necessary
	changes: hashmap of tiddler changes in the format used by $tw.Wiki
*/
Node.prototype.refreshInDom = function(changes) {
	
};

exports.Node = Node;

})();
