/*\
title: $:/core/modules/macros/button.js
type: application/javascript
module-type: macro

Button macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "button",
	params: {
		name: {byName: "default", type: "text"},
		"class": {byName: true, type: "text"}
	},
	events: ["click"]
};

exports.handleEvent = function(event) {
	if(event.type === "click") {
		var buttonEvent = document.createEvent("Event");
		buttonEvent.initEvent("tw-" + this.params.name,true,true);
		buttonEvent.tiddlerTitle = this.tiddlerTitle;
		buttonEvent.commandOrigin = this;
		event.target.dispatchEvent(buttonEvent); 
		event.preventDefault();
		return false;
	}
	return true;
};

exports.executeMacro = function() {
	var attributes = {};
	if(this.hasParameter("class")) {
		attributes["class"] = this.params["class"].split(" ");
	}
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
	}
	for(var t=0; t<this.content.length; t++) {
		this.content[t].execute(this.parents,this.tiddlerTitle);
	}
	return $tw.Tree.Element("button",attributes,this.content);
};

})();
