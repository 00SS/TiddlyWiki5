/*\
title: $:/core/modules/macros/story/story.js
type: application/javascript
module-type: macro

Displays a sequence of tiddlers defined in a JSON structure:

	{
		tiddlers: [
			{title: <string>, template: <string>}
		]	
	}

The storyview is a plugin that extends the story macro to implement different navigation experiences.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

function scrollToTop(duration) {
    if (duration < 0) {
		return;
    }
    var delta = (-document.body.scrollTop/duration) * 10;
    window.setTimeout(function() {
        document.body.scrollTop = document.body.scrollTop + delta;
        scrollToTop(duration-10);
    }, 10);
}

exports.info = {
	name: "story",
	params: {
		story: {byName: "default", type: "tiddler"},
		defaultViewTemplate: {byName: true, type: "tiddler"},
		defaultEditTemplate: {byName: true, type: "tiddler"},
		storyview: {byName: true, type: "text"}
	},
	events: ["tw-navigate","tw-EditTiddler","tw-SaveTiddler"]
};

exports.handleEvent = function(event) {
	var template, storyTiddler, story, storyRecord, tiddler, storyTiddlerModified, t;
	switch(event.type) {
		case "tw-navigate":
			// Navigate to a specified tiddler
			template = this.hasParameter("defaultViewTemplate") ? this.params.defaultViewTemplate : "ViewTemplate";
			storyTiddler = this.wiki.getTiddler(this.params.story);
			story = {tiddlers: []};
			if(storyTiddler && $tw.utils.hop(storyTiddler.fields,"text")) {
				story = JSON.parse(storyTiddler.fields.text);
			}
			story.tiddlers.unshift({title: event.navigateTo, template: template});
			this.wiki.addTiddler(new $tw.Tiddler(storyTiddler,{text: JSON.stringify(story)}));
			scrollToTop(400);
			event.stopPropagation();
			return false;
		case "tw-EditTiddler":
			// Put the specified tiddler into edit mode
			template = this.hasParameter("defaultEditTemplate") ? this.params.defaultEditTemplate : "EditTemplate";
			storyTiddler = this.wiki.getTiddler(this.params.story);
			story = {tiddlers: []};
			if(storyTiddler && $tw.utils.hop(storyTiddler.fields,"text")) {
				story = JSON.parse(storyTiddler.fields.text);
			}
			for(t=0; t<story.tiddlers.length; t++) {
				storyRecord = story.tiddlers[t];
				if(storyRecord.title === event.tiddlerTitle && storyRecord.template !== template) {
					storyRecord.title = "Draft " + (new Date()) + " of " + event.tiddlerTitle;
					storyRecord.template = template;
					tiddler = this.wiki.getTiddler(event.tiddlerTitle);
					this.wiki.addTiddler(new $tw.Tiddler(
						{
							text: "Type the text for the tiddler '" + event.tiddlerTitle + "'"
						},
						tiddler,
						{
							title: storyRecord.title,
							"draft.title": event.tiddlerTitle,
							"draft.of": event.tiddlerTitle
						}));
				}
			}
			this.wiki.addTiddler(new $tw.Tiddler(storyTiddler,{text: JSON.stringify(story)}));
			event.stopPropagation();
			return false;
		case "tw-SaveTiddler":
			template = this.hasParameter("defaultViewTemplate") ? this.params.defaultEditTemplate : "ViewTemplate";
			storyTiddler = this.wiki.getTiddler(this.params.story);
			story = {tiddlers: []};
			storyTiddlerModified = false;
			if(storyTiddler && $tw.utils.hop(storyTiddler.fields,"text")) {
				story = JSON.parse(storyTiddler.fields.text);
			}
			for(t=0; t<story.tiddlers.length; t++) {
				storyRecord = story.tiddlers[t];
				if(storyRecord.title === event.tiddlerTitle && storyRecord.template !== template) {
					tiddler = this.wiki.getTiddler(storyRecord.title);
					if(tiddler && $tw.utils.hop(tiddler.fields,"draft.title")) {
						// Save the draft tiddler as the real tiddler
						this.wiki.addTiddler(new $tw.Tiddler(tiddler,{title: tiddler.fields["draft.title"],"draft.title": undefined, "draft.of": undefined}));
						// Remove the draft tiddler
						this.wiki.deleteTiddler(storyRecord.title);
						// Remove the original tiddler if we're renaming it
						if(tiddler.fields["draft.of"] !== tiddler.fields["draft.title"]) {
							this.wiki.deleteTiddler(tiddler.fields["draft.of"]);
						}
						// Make the story record point to the newly saved tiddler
						storyRecord.title = tiddler.fields["draft.title"];
						storyRecord.template = template;
						// Check if we're modifying the story tiddler itself
						if(tiddler.fields["draft.title"] === this.params.story) {
							storyTiddlerModified = true;
						}
					}
				}
			}
			if(!storyTiddlerModified) {
				this.wiki.addTiddler(new $tw.Tiddler(storyTiddler,{text: JSON.stringify(story)}));
			}
			event.stopPropagation();
			return false;
	}
};

exports.executeMacro = function() {
	var storyJson = JSON.parse(this.wiki.getTiddlerText(this.params.story)),
		storyNode = $tw.Tree.Element("div",{},[]);
	for(var t=0; t<storyJson.tiddlers.length; t++) {
		var m = $tw.Tree.Macro("tiddler",
									{target: storyJson.tiddlers[t].title,template: storyJson.tiddlers[t].template},
									null,
									this.wiki);
		m.execute(this.parents,this.tiddlerTitle);
		storyNode.children.push($tw.Tree.Element("div",{},[m]));
	}
	return [storyNode];
};

exports.postRenderInDom = function() {
	// Instantiate the story view
	var StoryView = this.wiki.macros.story.viewers[this.params.storyview];
	if(StoryView) {
		this.storyview = new StoryView(this);
	};
};

exports.refreshInDom = function(changes) {
	var t;
	/*jslint browser: true */
	if(this.dependencies.hasChanged(changes,this.tiddlerTitle)) {
		// Get the tiddlers we're supposed to be displaying
		var self = this,
			story = JSON.parse(this.wiki.getTiddlerText(this.params.story)),
			template = this.params.template,
			n,domNode,
			findTiddler = function (childIndex,tiddlerTitle,templateTitle) {
				while(childIndex < self.children[0].children.length) {
					var params = self.children[0].children[childIndex].children[0].params;
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
				var m = $tw.Tree.Element("div",{},[
							$tw.Tree.Macro("tiddler",
											{target: story.tiddlers[t].title,template: story.tiddlers[t].template},
											null,
											this.wiki)
							]);
				m.execute(this.parents,this.tiddlerTitle);
				m.renderInDom(this.children[0].domNode,this.children[0].domNode.childNodes[t]);
				this.children[0].children.splice(t,0,m);
				if(this.storyview && this.storyview.tiddlerAdded) {
					this.storyview.tiddlerAdded(this.children[0].children[t]);
				} 
			} else {
				// Delete any nodes preceding the one we want
				if(tiddlerNode > t) {
					// First delete the DOM nodes
					for(n=t; n<tiddlerNode; n++) {
						domNode = this.children[0].children[n].domNode;
						domNode.parentNode.removeChild(domNode);
					}
					// Then delete the actual renderer nodes
					this.children[0].children.splice(t,tiddlerNode-t);
				}
				// Refresh the DOM node we're reusing
				this.children[0].children[t].refreshInDom(changes);
			}
		}
		// Remove any left over nodes
		if(this.children[0].children.length > story.tiddlers.length) {
			for(t=story.tiddlers.length; t<this.children[0].children.length; t++) {
				domNode = this.children[0].children[t].domNode;
				domNode.parentNode.removeChild(domNode);
			}
			this.children[0].children.splice(story.tiddlers.length,this.children[0].children.length-story.tiddlers.length);
		}
	} else {
		for(t=0; t<this.children.length; t++) {
			this.children[t].refreshInDom(changes);
		}
	}
};

})();
