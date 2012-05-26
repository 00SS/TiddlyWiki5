/*\
title: $:/core/modules/parsers/newwikitextparser/newwikitextparser.js
type: application/javascript
module-type: parser

A new-school wikitext parser

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Define the wikitext renderer constructor
*/
var WikiTextRenderer = function(text,options) {
	this.source = text || "";
	this.sourceLength = this.source.length;
	this.pos = 0;
	this.wiki = options.wiki;
	this.parser = options.parser;
	this.tree = [];
	this.dependencies = new $tw.Dependencies();
	// Parse the text into blocks
	while(this.pos < this.sourceLength) {
		this.tree.push.apply(this.tree,this.parseBlock());
	}
};

/*
Now make WikiTextRenderer inherit from the default Renderer class
*/
var Renderer = require("$:/core/modules/renderer.js").Renderer;
WikiTextRenderer.prototype = new Renderer();
WikiTextRenderer.constructor = WikiTextRenderer;

/*
Parse a block of text at the current position
*/
WikiTextRenderer.prototype.parseBlock = function() {
	this.skipWhitespace();
	if(this.pos >= this.sourceLength) {
		return [];
	}
	// Look for a block rule
	this.parser.blockRules.regExp.lastIndex = this.pos;
	var match = this.parser.blockRules.regExp.exec(this.source);
	if(this.parser.blockRules.rules.length && match && match.index === this.pos) {
		var rule;
		for(var t=0; t<this.parser.blockRules.rules.length; t++) {
			if(match[t+1]) {
				rule = this.parser.blockRules.rules[t];
			}
		}
		return rule ? rule.parse.call(this,match) : [];
	} else {
		// Treat it as a paragraph if we didn't find a block rule
		return [$tw.Tree.Element("p",{},this.parseRun())];
	}
};

WikiTextRenderer.prototype.skipWhitespace = function() {
	var whitespaceRegExp = /(\s+)/mg;
	whitespaceRegExp.lastIndex = this.pos;
	var whitespaceMatch = whitespaceRegExp.exec(this.source);
	if(whitespaceMatch && whitespaceMatch.index === this.pos) {
		this.pos = whitespaceRegExp.lastIndex;
	}
};

/*
Parse a run of text at the current position
	terminatorRegExp: a regexp at which to stop the run
Returns an array of tree nodes
*/
WikiTextRenderer.prototype.parseRun = function(terminatorRegExp) {
	var tree = [];
	// Find the next occurrence of the terminator
	terminatorRegExp = terminatorRegExp || /(\r?\n\r?\n)/mg;
	terminatorRegExp.lastIndex = this.pos;
	var terminatorMatch = terminatorRegExp.exec(this.source);
	// Find the next occurrence of a runrule
	this.parser.runRules.regExp.lastIndex = this.pos;
	var runRuleMatch = this.parser.runRules.regExp.exec(this.source);
	// Loop around until we've reached the end of the text
	while(this.pos < this.sourceLength && (terminatorMatch || runRuleMatch)) {
		// Return if we've found the terminator, and it precedes any run rule match
		if(terminatorMatch) {
			if(!runRuleMatch || runRuleMatch.index > terminatorMatch.index) {
				if(terminatorMatch.index > this.pos) {
					tree.push($tw.Tree.Text(this.source.substring(this.pos,terminatorMatch.index)));
				}
				this.pos = terminatorMatch.index;
				return tree;
			}
		}
		// Process any run rule, along with the text preceding it
		if(runRuleMatch) {
			// Preceding text
			if(runRuleMatch.index > this.pos) {
				tree.push($tw.Tree.Text(this.source.substring(this.pos,runRuleMatch.index)));
				this.pos = runRuleMatch.index;
			}
			// Process the run rule
			var rule;
			for(var t=0; t<this.parser.runRules.rules.length; t++) {
				if(runRuleMatch[t+1]) {
					rule = this.parser.runRules.rules[t];
				}
			}
			if(rule) {
				tree.push.apply(tree,rule.parse.call(this,runRuleMatch));
			}
			// Look for the next run rule
			this.parser.runRules.regExp.lastIndex = this.pos;
			runRuleMatch = this.parser.runRules.regExp.exec(this.source);
		}
	}
	// Process the remaining text
	if(this.pos < this.sourceLength) {
		tree.push($tw.tree.Text(this.source.substr(this.pos)));
	}
	this.pos = this.sourceLength;
	return tree;
};

/*
Parse a run of text preceded by an optional class specifier `{{class}}`
*/
WikiTextRenderer.prototype.parseClassedRun = function(terminatorRegExp) {
	var classRegExp = /\{\{([^\}]*)\}\}/mg,
		className;
	classRegExp.lastIndex = this.pos;
	var match = classRegExp.exec(this.source);
	if(match && match.index === this.pos) {
		className = match[1];
		this.pos = match.index + match[0].length;
	}
	var tree = this.parseRun(terminatorRegExp);
	return {
		"class": className,
		tree: tree
	};
};

/*
The wikitext parser assembles the rules and uses the wikitext renderer to do the parsing
*/
var WikiTextParser = function(options) {
    this.wiki = options.wiki;
    // Assemble the rule regexps
    this.blockRules = this.getRules("wikitextblockrule");
    this.runRules = this.getRules("wikitextrunrule");
};

/*
The wikitext parser constructs a wikitext renderer to do the work
*/
WikiTextParser.prototype.parse = function(type,text) {
	return new WikiTextRenderer(text,{
		wiki: this.wiki,
		parser: this
	});
};

/*
Merge all the rule regexp strings into a single regexp
*/
WikiTextParser.prototype.getRules = function(moduleType) {
	var rules = ($tw.plugins.moduleTypes[moduleType] || []).slice(0),
		regExpStrings = [];
	for(var t=0; t<rules.length; t++) {
		regExpStrings.push("(" + rules[t].regExpString + ")");
	}
	return {
		regExp: new RegExp(regExpStrings.join("|"),"mg"),
		rules: rules
	};
};

exports["text/x-tiddlywiki-new"] = WikiTextParser;

})();
