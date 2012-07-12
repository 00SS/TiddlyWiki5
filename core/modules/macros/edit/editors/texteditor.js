/*\
title: $:/core/modules/macros/edit/editors/texteditor.js
type: application/javascript
module-type: editor

An editor plugin for editting text

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var MIN_TEXT_AREA_HEIGHT = 100;

function TextEditor(macroNode) {
	this.macroNode = macroNode;
}

/*
Get the tiddler being editted, field name and current value
*/
TextEditor.prototype.getEditText = function() {
	// Get the current tiddler and the field name
	var tiddler = this.macroNode.wiki.getTiddler(this.macroNode.tiddlerTitle),
		field = this.macroNode.hasParameter("field") ? this.macroNode.params.field : "title",
		value;
	// If we've got a tiddler, the value to display is the field string value
	if(tiddler) {
		value = tiddler.getFieldString(field);
	} else {
		// Otherwise, we need to construct a default value for the editor
		switch(field) {
			case "text":
				value = "Type the text for the tiddler '" + this.macroNode.tiddlerTitle + "'";
				break;
			case "title":
				value = this.macroNode.tiddlerTitle;
				break;
			default:
				value = "";
				break;
		}
	}
	return {tiddler: tiddler, field: field, value: value};
};

TextEditor.prototype.getChild = function() {
	var edit = this.getEditText();
	var attributes = {
			"class": ["tw-edit-field"]
		},
		tagName,
		content = [];
	// Make a textarea for text fields and an input box for other fields
	if(edit.field === "text") {
		tagName = "textarea";
		content.push($tw.Tree.Text(edit.value));
	} else {
		tagName = "input";
		attributes.type = "text";
		attributes.value = edit.value;
	}
	// Wrap the editor control in a div
	return $tw.Tree.Element("div",{},[$tw.Tree.Element(tagName,attributes,content)],{
		events: ["focus","keyup"],
		eventHandler: this
	});
};

TextEditor.prototype.handleEvent = function(event) {
	// Get the value of the field if it might have changed
	if("keyup".split(" ").indexOf(event.type) !== -1) {
		this.saveChanges();
	}
	// Whatever the event, fix the height of the textarea if required
	var self = this;
	window.setTimeout(function() {
		self.fixHeight();
	},5);
	return true;
};

TextEditor.prototype.saveChanges = function() {
	var text = this.macroNode.child.children[0].domNode.value,
		tiddler = this.macroNode.wiki.getTiddler(this.macroNode.tiddlerTitle);
	if(tiddler && text !== tiddler.fields[this.macroNode.params.field]) {
		var update = {};
		update[this.macroNode.params.field] = text;
		this.macroNode.wiki.addTiddler(new $tw.Tiddler(tiddler,update));
	}
};

TextEditor.prototype.fixHeight = function() {
	if(this.macroNode.child && this.macroNode.child.children[0] && this.macroNode.child.children[0].type === "textarea") {
		var wrapper = this.macroNode.child.domNode,
			textarea = this.macroNode.child.children[0].domNode;
		// Set the text area height to 1px temporarily, which allows us to read the true scrollHeight
		var prevWrapperHeight = wrapper.style.height;
		wrapper.style.height = textarea.style.height + "px";
		textarea.style.overflow = "hidden";
		textarea.style.height = "1px";
		textarea.style.height = Math.max(textarea.scrollHeight,MIN_TEXT_AREA_HEIGHT) + "px";
		wrapper.style.height = prevWrapperHeight;
	}
};

TextEditor.prototype.postRenderInDom = function() {
	this.fixHeight();
};

TextEditor.prototype.refreshInDom = function() {
	if(document.activeElement !== this.macroNode.child.children[0].domNode) {
		var edit = this.getEditText();
		this.macroNode.child.children[0].domNode.value = edit.value;
	}
	// Fix the height if needed
	this.fixHeight();
};

exports["text/x-tiddlywiki"] = TextEditor;
exports["text/plain"] = TextEditor;

})();
