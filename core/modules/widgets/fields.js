/*\
title: $:/core/modules/widgets/fields.js
type: application/javascript
module-type: widget

The view widget displays the fields of a tiddler through a text substitution template.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var FieldsWidget = function(renderer) {
	// Save state
	this.renderer = renderer;
	// Generate child nodes
	this.generateChildNodes();
};

FieldsWidget.prototype.generateChildNodes = function() {
	// Get parameters from our attributes
	this.tiddlerTitle = this.renderer.getAttribute("tiddler",this.renderer.getContextTiddlerTitle());
	this.template = this.renderer.getAttribute("template");
	this.exclude = this.renderer.getAttribute("exclude");
	// Get the tiddler we're displaying
	var tiddler = this.renderer.renderTree.wiki.getTiddler(this.tiddlerTitle);
	// Get the exclusion list
	var exclude;
	if(this.exclude) {
		exclude = this.exclude.split(" ");
	} else {
		exclude = ["text"]; 
	}
	// Compose the template
	var text = [];
	if(this.template && tiddler) {
		for(var field in tiddler.fields) {
			if(exclude.indexOf(field) === -1) {
				var row = this.template;
				row = row.replace("$name$",field);
				row = row.replace("$value$",tiddler.getFieldString(field));
				row = row.replace("$encoded_value$",$tw.utils.htmlEncode(tiddler.getFieldString(field)));
				text.push(row)
			}
		}
	}
	// Create the wrapper node
	var node = {
		type: "element",
		tag: this.renderer.parseTreeNode.isBlock ? "div" : "span",
		children: [{
			type: "text",
			text: text.join("")
		}]
	};
	// Set up the attributes for the wrapper element
	var classes = [];
	if(this.renderer.hasAttribute("class")) {
		$tw.utils.pushTop(classes,this.renderer.getAttribute("class").split(" "));
	}
	if(classes.length > 0) {
		$tw.utils.addClassToParseTreeNode(node,classes.join(" "));
	}
	if(this.renderer.hasAttribute("style")) {
		$tw.utils.addAttributeToParseTreeNode(node,"style",this.renderer.getAttribute("style"));
	}
	if(this.renderer.hasAttribute("tooltip")) {
		$tw.utils.addAttributeToParseTreeNode(node,"title",this.renderer.getAttribute("tooltip"));
	}
	// Create the renderers for the wrapper and the children
	this.children = this.renderer.renderTree.createRenderers(this.renderer.renderContext,[node]);
};

exports.fields = FieldsWidget;

})();
