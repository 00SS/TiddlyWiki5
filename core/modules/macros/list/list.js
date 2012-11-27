/*\
title: $:/core/modules/macros/list.js
type: application/javascript
module-type: macro

List macro

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.info = {
	name: "list",
	dependentAll: true, // Tiddlers containing <<list>> macro are dependent on every tiddler
	params: {
		type: {byPos: 0, type: "text"},
		filter: {byName: true, type: "filter"},
		history: {byName: true, type: "tiddler"},
		template: {byName: true, type: "tiddler"},
		templateText: {byName: true, type: "text"},
		editTemplate: {byName: true, type: "tiddler"},
		editTemplateText: {byName: true, type: "text"},
		emptyMessage: {byName: true, type: "text"},
		listviewTiddler: {byName: true, type: "tiddler"},
		listview: {byName: true, type: "text"},
		itemClass: {byName: true, type: "text"},
		map: {byName: true, type: "tiddler"},
		forceBlock: {ByName: true, type: "text"} // HACK: To be removed...
	}
};

/*
These types are shorthands for particular filters
*/
var typeMappings = {
	all: "[!is[shadow]sort[title]]",
	recent: "[!is[shadow]sort[modified]]",
	missing: "[is[missing]sort[title]]",
	orphans: "[is[orphan]sort[title]]",
	shadowed: "[is[shadow]sort[title]]"
};

exports.executeMacro = function() {
	this.useBlock = this.isBlock;
	if(this.hasParameter("forceBlock")) {
		this.useBlock = true;
	}
	// Get the list of tiddlers object
	this.getTiddlerList();
	// Create the list frame element
	var attributes = {"class": ["tw-list-frame"]};
	if(this.classes) {
		$tw.utils.pushTop(attributes["class"],this.classes);
	}
	this.listFrame = $tw.Tree.Element(this.useBlock ? "div" : "span",attributes,[]);
	// Create the list
	if(this.list.length === 0) {
		// Check for an empty list
		this.listFrame.children = [this.getEmptyMessage()];
	} else {
		// Create the list
		for(var t=0; t<this.list.length; t++) {
			this.listFrame.children.push(this.createListElement(this.list[t]));
		}		
	}
	return this.listFrame;
};

exports.postRenderInDom = function() {
	this.listview = this.chooseListView();
	this.history = [];
};

/*
Select the appropriate list viewer
*/
exports.chooseListView = function() {
	// Instantiate the list view
	var listviewName;
	if(this.hasParameter("listviewTiddler")) {
		listviewName = this.wiki.getTextReference(this.params.listviewTiddler);
	}
	if(!listviewName && this.hasParameter("listview")) {
		listviewName = this.params.listview;
	}
	var ListView = this.wiki.macros.list.listviews[listviewName];
	return ListView ? new ListView(this) : null;
};

exports.getTiddlerList = function() {
	var filter;
	if(this.hasParameter("type")) {
		filter = typeMappings[this.params.type];
	} else if(this.hasParameter("filter")) {
		filter = this.params.filter;
	}
	if(!filter) {
		filter = "[!is[shadow]]";
	}
	this.list = this.wiki.filterTiddlers(filter,this.tiddlerTitle);
};

/*
Create and execute the nodes representing the empty message
*/
exports.getEmptyMessage = function() {
	var nodes = this.wiki.parseText("text/vnd.tiddlywiki",this.params.emptyMessage).tree;
	for(var c=0; c<nodes.length; c++) {
		nodes[c].execute(this.parents,this.tiddlerTitle);
	}
	return $tw.Tree.Element("span",{},nodes);
};

/*
Create a list element representing a given tiddler
*/
exports.createListElement = function(title) {
	var node = this.createListElementMacro(title),
		attributes = {"class": ["tw-list-element"]},
		eventHandler = {handleEvent: function(event) {
			// Add context information to the event
			event.navigateFromTitle = title;
			return true;
		}};
	node.execute(this.parents,this.tiddlerTitle);
	// Add any specified classes
	if(this.hasParameter("itemClass")) {
		attributes["class"].push(this.params.itemClass);
	}
	var listElement = $tw.Tree.Element(this.useBlock ? "div" : "span",attributes,[node],{
			events: ["tw-navigate","tw-EditTiddler","tw-SaveTiddler","tw-CloseTiddler","tw-NewTiddler"],
			eventHandler: eventHandler
		});
	// Save our data inside the list element node
	listElement.listElementInfo = {title: title};
	return listElement;
};

/*
Create the tiddler macro needed to represent a given tiddler
*/
exports.createListElementMacro = function(title) {
	// Check if the tiddler is a draft
	var tiddler = this.wiki.getTiddler(title),
		draft = tiddler ? tiddler.hasField("draft.of") : false;
	// Figure out the template to use
	var template = this.params.template,
		templateText = this.params.templateText;
	if(draft && this.hasParameter("editTemplate")) {
		template = this.params.editTemplate;
	}
	if(draft && this.hasParameter("editTemplateText")) {
		template = this.params.editTemplateText;
	}
	// Check for no template specified
	if(!template && !templateText) {
		templateText = "<<view title link>>";
	}
	// Create the tiddler macro
	return $tw.Tree.Macro("tiddler",{
			srcParams: {
				target: title,
				template: template,
				templateText: templateText
			},
			wiki: this.wiki
		});
};

/*
Remove a list element from the list, along with the attendant DOM nodes
*/
exports.removeListElement = function(index) {
	// Get the list element
	var listElement = this.listFrame.children[index];
	// Invoke the listview to animate the removal
	if(this.listview && this.listview.remove) {
		if(!this.listview.remove(index)) {
			// Only delete the DOM element if the listview.remove() returned false
			listElement.domNode.parentNode.removeChild(listElement.domNode);
		}
	} else {
		// Always remove the DOM node if we didn't invoke the listview
		listElement.domNode.parentNode.removeChild(listElement.domNode);
	}
	// Then delete the actual renderer node
	this.listFrame.children.splice(index,1);
};

/*
Return the index of the list element that corresponds to a particular title
startIndex: index to start search (use zero to search from the top)
title: tiddler title to seach for
*/
exports.findListElementByTitle = function(startIndex,title) {
	while(startIndex < this.listFrame.children.length) {
		var listElementInfo = this.listFrame.children[startIndex].listElementInfo;
		if(listElementInfo && listElementInfo.title === title) {
			return startIndex;
		}
		startIndex++;
	}
	return undefined;
};

/*
Selectively update the list in response to changes in tiddlers
*/
exports.refreshInDom = function(changes) {
	// If any of our parameters have changed we'll have to completely re-execute the macro
	var paramNames = ["template","editTemplate"];
	for(var t=0; t<paramNames.length; t++) {
		if(this.hasParameter(paramNames[t]) && $tw.utils.hop(changes,this.params[paramNames[t]])) {
			this.reexecuteInDom();
			return;
		}
	}
	// Reflect any changes in the list
	this.handleListChanges(changes);
	// Process any history list changes
	if(this.hasParameter("history") && $tw.utils.hop(changes,this.params.history)) {
		this.handleHistoryChanges();
	}
};

/*
Handle changes to the content of the list
*/
exports.handleListChanges = function(changes) {
	// Get the list of tiddlers, saving the previous length
	var t,
		prevListLength = this.list.length;
	this.getTiddlerList();
	// Check if the list is empty
	if(this.list.length === 0) {
		// Check if it was empty before
		if(prevListLength === 0) {
			// If so, just refresh the empty message
			this.listFrame.refreshInDom(changes);
			return;
		} else {
			// If the list wasn't empty before, empty it
			for(t=prevListLength-1; t>=0; t--) {
				this.removeListElement(t);
			}
			// Insert the empty message
			this.listFrame.children = [this.getEmptyMessage()];
			this.listFrame.children[0].renderInDom(this.listFrame.domNode,this.listFrame.domNode.childNodes[0]);
			return;
		}
	} else {
		// If it is not empty now, but was empty previously, then remove the empty message
		if(prevListLength === 0) {
			this.removeListElement(0);
		}
	}
	// Step through the list and adjust our child list elements appropriately
	for(t=0; t<this.list.length; t++) {
		// Check to see if the list element is already there
		var index = this.findListElementByTitle(t,this.list[t]);
		if(index === undefined) {
			// The list element isn't there, so we need to insert it
			this.listFrame.children.splice(t,0,this.createListElement(this.list[t]));
			this.listFrame.children[t].renderInDom(this.listFrame.domNode,this.listFrame.domNode.childNodes[t]);
			if(this.listview && this.listview.insert) {
				this.listview.insert(t);
			}
		} else {
			// Delete any list elements preceding the one we want
			if(index > t) {
				for(var n=index-1; n>=t; n--) {
					this.removeListElement(n);
				}
			}
			// Refresh the node we're reusing
			this.listFrame.children[t].refreshInDom(changes);
		}
	}
	// Remove any left over elements
	if(this.listFrame.children.length > this.list.length) {
		for(t=this.listFrame.children.length-1; t>=this.list.length; t--) {
			this.removeListElement(t);
		}
	}
};

/*
Handle any changes to the history list
*/
exports.handleHistoryChanges = function() {
	// Get the history data
	var newHistory = this.wiki.getTiddlerData(this.params.history,[]);
	// Ignore any entries of the history that match the previous history
	var entry = 0;
	while(entry < newHistory.length && entry < this.history.length && newHistory[entry].title === this.history[entry].title) {
		entry++;
	}
	// Navigate forwards to each of the new tiddlers
	while(entry < newHistory.length) {
		if(this.listview && this.listview.navigateTo) {
			this.listview.navigateTo(newHistory[entry]);
		}
		entry++;
	}
	// Update the history
	this.history = newHistory;
};

})();
