/*\
title: $:/core/modules/parsers/wikiparser/rules/inline/entity.js
type: application/javascript
module-type: wiki-inline-rule

Wiki text inline rule for HTML entities. For example:

{{{
	This is a copyright symbol: &copy;
}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "entity";

exports.init = function(parser) {
	this.parser = parser;
	// Regexp to match
	this.matchRegExp = /(&#?[a-zA-Z0-9]{2,8};)/mg;
};

/*
Parse the most recent match
*/
exports.parse = function() {
	// Get all the details of the match
	var entityString = this.match[1];
	// Move past the macro call
	this.parser.pos = this.matchRegExp.lastIndex;
	// Return the entity
	return [{type: "entity", entity: this.match[0]}];
};

})();
