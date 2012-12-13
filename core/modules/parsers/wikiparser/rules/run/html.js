/*\
title: $:/core/modules/parsers/wikiparser/rules/run/html.js
type: application/javascript
module-type: wikirunrule

Wiki rule for HTML elements and widgets. For example:

{{{
<aside>
This is an HTML5 aside element
</aside>

<_slider target="MyTiddler">
This is a widget invocation
</_slider>

}}}

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var voidElements = "area,base,br,col,command,embed,hr,img,input,keygen,link,meta,param,source,track,wbr".split(",");

var HtmlRule = function(parser,startPos) {
	// Save state
	this.parser = parser;
	// Regexp to match
	this.reMatch = /<(_)?([A-Za-z]+)(\s*[^>]*?)(\/)?>/mg;
	// Get the first match
	this.matchIndex = startPos-1;
	this.findNextMatch(startPos);
};

HtmlRule.prototype.findNextMatch = function(startPos) {
	if(this.matchIndex !== undefined && startPos > this.matchIndex) {
		this.reMatch.lastIndex = startPos;
		this.match = this.reMatch.exec(this.parser.source);
		this.matchIndex = this.match ? this.match.index : undefined;
	}
	return this.matchIndex;
};

/*
Parse the most recent match
*/
HtmlRule.prototype.parse = function() {
	// Get all the details of the match in case this parser is called recursively
	var isWidget = !!this.match[1],
		tagName = this.match[2],
		attributeString = this.match[3],
		isSelfClosing = !!this.match[4];
	// Move past the tag name and parameters
	this.parser.pos = this.reMatch.lastIndex;
	var reLineBreak = /(\r?\n)/mg,
		reAttr = /\s*([A-Za-z\-_]+)(?:\s*=\s*(?:("[^"]*")|('[^']*')|(\{\{[^\}]*\}\})|([^"'\s]+)))?/mg,
		isBlock;
	// Process the attributes
	var attrMatch = reAttr.exec(attributeString),
		attributes = {};
	while(attrMatch) {
		var name = attrMatch[1],
			value;
		if(attrMatch[2]) { // Double quoted
			value = {type: "string", value: attrMatch[2].substring(1,attrMatch[2].length-1)};
		} else if(attrMatch[3]) { // Single quoted
			value = {type: "string", value: attrMatch[3].substring(1,attrMatch[3].length-1)};
		} else if(attrMatch[4]) { // Double curly brace quoted
			value = {type: "indirect", textReference: attrMatch[4].substr(2,attrMatch[4].length-4)};
		} else if(attrMatch[5]) { // Unquoted
			value = {type: "string", value: attrMatch[5]};
		} else { // Valueless
			value = {type: "string", value: "true"}; // TODO: We should have a way of indicating we want an attribute without a value
		}
		attributes[name] = value;
		attrMatch = reAttr.exec(attributeString);
	}
	// Check for a line break immediate after the opening tag
	reLineBreak.lastIndex = this.parser.pos;
	var lineBreakMatch = reLineBreak.exec(this.parser.source);
	if(lineBreakMatch && lineBreakMatch.index === this.parser.pos) {
		this.parser.pos = lineBreakMatch.index + lineBreakMatch[0].length;
		isBlock = true;
	} else {
		isBlock = false;
	}
	if(!isSelfClosing && (isWidget || voidElements.indexOf(tagName) === -1)) {
		var reEndString = "(</" + (isWidget ? "_" : "") + tagName + ">)",
			reEnd = new RegExp(reEndString,"mg"),
			content;
		if(isBlock) {
			content = this.parser.parseBlocks(reEndString);
		} else {
			content = this.parser.parseRun(reEnd);
		}
		reEnd.lastIndex = this.parser.pos;
		var endMatch = reEnd.exec(this.parser.source);
		if(endMatch && endMatch.index === this.parser.pos) {
			this.parser.pos = endMatch.index + endMatch[0].length;
		}
	} else {
		content = [];
	}
	var element = {type: isWidget ? "widget" : "element", tag: tagName, isBlock: isBlock, attributes: attributes, children: content};
	return [element];
};

exports.HtmlRule = HtmlRule;

})();
