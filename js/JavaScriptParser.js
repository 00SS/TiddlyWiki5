/*\
title: js/JavaScriptParser.js

Parses JavaScript source code into a parse tree using PEGJS

\*/
(function(){

/*jslint node: true */
"use strict";

var WikiTextParseTree = require("./WikiTextParseTree.js").WikiTextParseTree,
    Renderer = require("./Renderer.js").Renderer,
    Dependencies = require("./Dependencies.js").Dependencies,
    esprima = require("esprima");

// Initialise the parser
var JavaScriptParser = function(options) {
    this.store = options.store;
};

// Parse a string of JavaScript code or JSON and return the parse tree as a wikitext parse tree
JavaScriptParser.prototype.parse = function(type,code) {
	// Try to parse the code
	try {
		var parseTree = esprima.parse(code,{comment: true,tokens: true,range: true});
	} catch(ex) {
		// Return a helpful error if the parse failed
		return new WikiTextParseTree([
			Renderer.ElementNode("pre",{"class": "javascript-source"},[
				Renderer.TextNode(code.substring(0,ex.index)),
				Renderer.ErrorNode(ex),
				Renderer.TextNode(code.substring(ex.index))
			])
		],new Dependencies(),this.store);
	}
	// Helpers to render the comments and tokens with the appropriate classes
	var self = this,
		result = [],
		nextComment = 0,
		nextToken = 0,
		currPos = 0;
	var renderWhitespace = function(nextPos) {
			if(currPos < nextPos) {
				result.push(Renderer.TextNode(code.substring(currPos,nextPos)));
			}
		},
		renderComment = function(comment) {
			var text = comment.value,
				element,
				classes = [];
			renderWhitespace(comment.range[0]);
			if(comment.type === "Block") {
				element = "div";
				classes.push("javascript-block-comment");
			} else {
				element = "span";
				classes.push("javascript-line-comment");
			}
			result.push(Renderer.ElementNode(element,{"class": classes},
					self.store.parseText("text/x-tiddlywiki",text).tree));
			if(comment.type === "Line") {
				result.push(Renderer.TextNode("\n"));
			}
			currPos = comment.range[1] + 1;
		},
		renderToken = function(token) {
			renderWhitespace(token.range[0]);
			result.push(Renderer.ElementNode("span",{
				"class": "javascript-" + token.type.toLowerCase()
			},[
				Renderer.TextNode(token.value)
			]));
			currPos = token.range[1] + 1;
		};
	// Process the tokens interleaved with the comments
	while(nextComment < parseTree.comments.length || nextToken < parseTree.tokens.length) {
		if(nextComment < parseTree.comments.length && nextToken < parseTree.tokens.length) {
			if(parseTree.comments[nextComment].range[0] < parseTree.tokens[nextToken].range[0]) {
				renderComment(parseTree.comments[nextComment++]);
			} else {
				renderToken(parseTree.tokens[nextToken++]);
			}
		} else if(nextComment < parseTree.comments.length) {
			renderComment(parseTree.comments[nextComment++]);
		} else {
			renderToken(parseTree.tokens[nextToken++]);
		}
	}
	renderWhitespace(code.length);
	// Wrap the whole lot in a `<PRE>`
	return new WikiTextParseTree([
			Renderer.ElementNode("pre",{"class": "javascript-source"},result)
		],new Dependencies(),this.store);
};

exports.JavaScriptParser = JavaScriptParser;

})();
