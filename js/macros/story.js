/*\
title: js/macros/story.js

\*/
(function(){

/*jslint node: true, jquery: true */
"use strict";

var Tiddler = require("../Tiddler.js").Tiddler,
	Renderer = require("../Renderer.js").Renderer,
    Dependencies = require("../Dependencies.js").Dependencies,
	utils = require("../Utils.js");

exports.macro = {
	name: "story",
	params: {
		story: {byName: "default", type: "tiddler"},
		defaultViewTemplate: {byName: true, type: "tiddler"},
		defaultEditTemplate: {byName: true, type: "tiddler"}
	},
	events: {
		"tw-navigate": function(event) {
			var template = this.hasParameter("defaultViewTemplate") ? this.params.defaultViewTemplate : "SimpleTemplate",
				storyTiddler = this.store.getTiddler(this.params.story),
				story = {tiddlers: []};
			if(storyTiddler && storyTiddler.hasOwnProperty("text")) {
				story = JSON.parse(storyTiddler.text);
			}
			story.tiddlers.unshift({title: event.navigateTo, template: template});
			this.store.addTiddler(new Tiddler(storyTiddler,{text: JSON.stringify(story)}));
			$("html,body").animate({
				scrollTop: 0
			}, 400);
			event.stopPropagation();
			return false;
		},
		"tw-EditTiddler": function(event) {
			var template = this.hasParameter("defaultEditTemplate") ? this.params.defaultEditTemplate : "EditTemplate",
				storyTiddler = this.store.getTiddler(this.params.story),
				story = {tiddlers: []};
			if(storyTiddler && storyTiddler.hasOwnProperty("text")) {
				story = JSON.parse(storyTiddler.text);
			}
			for(var t=0; t<story.tiddlers.length; t++) {
				var storyRecord = story.tiddlers[t];
				if(storyRecord.title === event.tiddlerTitle && storyRecord.template !== template) {
					storyRecord.title = "Draft of " + event.tiddlerTitle + " at " + (new Date());
					storyRecord.template = template;
					var tiddler = this.store.getTiddler(event.tiddlerTitle);
					this.store.addTiddler(new Tiddler(tiddler,{title: storyRecord.title, "draft.title": event.tiddlerTitle}));
				}
			}
			this.store.addTiddler(new Tiddler(storyTiddler,{text: JSON.stringify(story)}));
			event.stopPropagation();
			return false;
		}
	},
	execute: function() {
		var story = JSON.parse(this.store.getTiddlerText(this.params.story)),
			content = [];
		for(var t=0; t<story.tiddlers.length; t++) {
			var m = Renderer.MacroNode("tiddler",
										{target: story.tiddlers[t].title,template: story.tiddlers[t].template},
										null,
										this.store);
			m.execute(this.parents,this.tiddlerTitle);
			content.push(m);
		}
		return content;
	},
	refreshInDom: function(changes) {
		/*jslint browser: true */
		// Get the tiddlers we're supposed to be displaying
		var self = this,
			story = JSON.parse(this.store.getTiddlerText(this.params.story)),
			template = this.params.template,
			t,n,domNode,
			findTiddler = function (childIndex,tiddlerTitle,templateTitle) {
				while(childIndex < self.content.length) {
					var params = self.content[childIndex].params;
					if(params.target === tiddlerTitle) {
						if(!templateTitle || params.template === templateTitle) {
							return childIndex;
						}
					}
					childIndex++;
				}
				return null;
			};
		for(t=0; t<story.tiddlers.length; t++) {
			// See if the node we want is already there
			var tiddlerNode = findTiddler(t,story.tiddlers[t].title,story.tiddlers[t].template);
			if(tiddlerNode === null) {
				// If not, render the tiddler
				var m = Renderer.MacroNode("tiddler",
											{target: story.tiddlers[t].title,template: story.tiddlers[t].template},
											null,
											this.store);
				m.execute(this.parents,story.tiddlers[t].title);
				m.renderInDom(this.domNode,this.domNode.childNodes[t]);
				this.content.splice(t,0,m);
			} else {
				// Delete any nodes preceding the one we want
				if(tiddlerNode > t) {
					// First delete the DOM nodes
					for(n=t; n<tiddlerNode; n++) {
						domNode = this.content[n].domNode;
						domNode.parentNode.removeChild(domNode);
					}
					// Then delete the actual renderer nodes
					this.content.splice(t,tiddlerNode-t);
				}
				// Refresh the DOM node we're reusing
				this.content[t].refreshInDom(changes);
			}
		}
		// Remove any left over nodes
		if(this.content.length > story.tiddlers.length) {
			for(t=story.tiddlers.length; t<this.content.length; t++) {
				domNode = this.content[t].domNode;
				domNode.parentNode.removeChild(domNode);
			}
			this.content.splice(story.tiddlers.length,this.content.length-story.tiddlers.length);
		}
	}
};

})();
