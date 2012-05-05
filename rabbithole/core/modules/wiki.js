/*\
title: $:/core/modules/wiki.js
type: application/javascript
module-type: wikimethod

Extension methods for the $tw.Wiki object

Adds the following properties to the wiki object:

* `eventListeners` is an array of {filter: <string>, listener: fn}
* `changedTiddlers` is a hashmap describing changes to named tiddlers since wiki change events were
last dispatched. Each entry is a hashmap containing two fields:
	modified: true/false
	deleted: true/false
* `changeCount` is a hashmap by tiddler title containing a numerical index that starts at zero and is
	incremented each time a tiddler is created changed or deleted
* `caches` is a hashmap by tiddler title containing a further hashmap of named cache objects. Caches
	are automatically cleared when a tiddler is modified or deleted
* `macros` is a hashmap by macro name containing an object class inheriting from the Macro tree node

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.getTiddlerText = function(title,defaultText) {
	defaultText = typeof defaultText === "string"  ? defaultText : null;
	var t = this.getTiddler(title);
	return t ? t.fields.text : defaultText;
};

exports.addEventListener = function(filter,listener) {
	this.eventListeners = this.eventListeners || [];
	this.eventListeners.push({
		filter: filter,
		listener: listener
	});	
};

exports.removeEventListener = function(filter,listener) {
	for(var c=this.eventListeners.length-1; c>=0; c--) {
		var l = this.eventListeners[c];
		if(l.filter === filter && l.listener === listener) {
			this.eventListeners.splice(c,1);
		}
	}
};

/*
Causes a tiddler to be marked as changed, incrementing the change count, and triggers event handlers.
This method should be called after the changes it describes have been made to the wiki.tiddlers[] array.
	title: Title of tiddler
	isDeleted: defaults to false (meaning the tiddler has been created or modified),
		true if the tiddler has been created
*/
exports.touchTiddler = function(title,isDeleted) {
	// Record the touch in the list of changed tiddlers
	this.changedTiddlers = this.changedTiddlers || {};
	this.changedTiddlers[title] = this.changedTiddlers[title] || [];
	this.changedTiddlers[title][isDeleted ? "deleted" : "modified"] = true;
	// Increment the change count
	this.changeCount = this.changeCount || {};
	if(this.changeCount.hasOwnProperty(title)) {
		this.changeCount[title]++;
	} else {
		this.changeCount[title] = 1;
	}
	// Trigger events
	this.eventListeners = this.eventListeners || [];
	if(!this.eventsTriggered) {
		var me = this;
		$tw.utils.nextTick(function() {
			var changes = me.changedTiddlers;
			me.changedTiddlers = {};
			me.eventsTriggered = false;
			for(var e=0; e<me.eventListeners.length; e++) {
				var listener = me.eventListeners[e];
				listener.listener(changes);
			}
		});
		this.eventsTriggered = true;
	}
};

exports.getChangeCount = function(title) {
	this.changeCount = this.changeCount || {};
	if(this.changeCount.hasOwnProperty(title)) {
		return this.changeCount[title];
	} else {
		return 0;
	}
};

exports.deleteTiddler = function(title) {
	delete this.tiddlers[title];
	this.clearCache(title);
	this.touchTiddler(title,true);
};

exports.tiddlerExists = function(title) {
	if(this.tiddlers[title]) {
		return true;
	} else if (this.shadows) {
		return this.shadows.tiddlerExists(title);
	}
};

exports.addTiddler = function(tiddler) {
	// Check if we're passed a fields hashmap instead of a tiddler
	if(!(tiddler instanceof $tw.Tiddler)) {
		tiddler = new $tw.Tiddler(tiddler);
	}
	var title = tiddler.fields.title;
	this.tiddlers[title] = tiddler;
	this.clearCache(title);
	this.touchTiddler(title);
};

exports.serializeTiddler = function(title,type) {
	var serializer = $tw.Wiki.tiddlerSerializerPlugins[type],
		tiddler = this.getTiddler(title);
	if(serializer) {
		return serializer.call(this,tiddler);
	} else {
		return null;
	}
};

/*
Return a sorted array of tiddler titles, optionally filtered by a tag 
*/
exports.sortTiddlers = function(sortField,excludeTag) {
	sortField = sortField || "title";
	var tiddlers = [], t, titles = [];
	for(t in this.tiddlers) {
		tiddlers.push(this.tiddlers[t]);
	}
	tiddlers.sort(function(a,b) {
		var aa = a.fields[sortField] || 0,
			bb = b.fields[sortField] || 0;
		if(aa < bb) {
			return -1;
		} else {
			if(aa > bb) {
				return 1;
			} else {
				return 0;
			}
		}
	});
	for(t=0; t<tiddlers.length; t++) {
		if(!excludeTag || !tiddlers[t].hasTag(excludeTag)) {
			titles.push(tiddlers[t].fields.title);
		}
	}
	return titles;
};

exports.forEachTiddler = function(/* [sortField,[excludeTag,]]callback */) {
	var arg = 0,
		sortField = arguments.length > 1 ? arguments[arg++] : null,
		excludeTag = arguments.length > 2 ? arguments[arg++] : null,
		callback = arguments[arg++],
		titles = this.sortTiddlers(sortField,excludeTag),
		t, tiddler;
	for(t=0; t<titles.length; t++) {
		tiddler = this.tiddlers[titles[t]];
		if(tiddler) {
			callback.call(this,tiddler.fields.title,tiddler);
		}
	}
};

exports.getMissingTitles = function() {
	return []; // Todo
};

exports.getOrphanTitles = function() {
	return []; // Todo
};

exports.getShadowTitles = function() {
	return this.shadows ? this.shadows.sortTiddlers() : [];
};

// Return the named cache object for a tiddler. If the cache doesn't exist then the initializer function is invoked to create it
exports.getCacheForTiddler = function(title,cacheName,initializer) {
	this.caches = this.caches || {};
	var caches = this.caches[title];
	if(caches && caches[cacheName]) {
		return caches[cacheName];
	} else {
		if(!caches) {
			caches = {};
			this.caches[title] = caches;
		}
		caches[cacheName] = initializer();
		return caches[cacheName];
	}
};

// Clear all caches associated with a particular tiddler
exports.clearCache = function(title) {
	this.caches = this.caches || {};
	if(this.caches.hasOwnProperty(title)) {
		delete this.caches[title];
	}
};

exports.initParsers = function(moduleType) {
	// Install the parser modules
	moduleType = moduleType || "parser";
	$tw.wiki.parsers = {}; 
	var modules = $tw.plugins.moduleTypes[moduleType],
		n,m,f;
	if(modules) {
		for(n=0; n<modules.length; n++) {
			m = modules[n];
			// Add the parsers defined by the module
			for(f in m) {
				$tw.wiki.parsers[f] = new m[f]({wiki: this}); // Store an instance of the parser
			}
		}
	}
	// Install the wikitext rules
	modules = $tw.plugins.moduleTypes["wikitextrule"];
	var wikitextparser = this.parsers["text/x-tiddlywiki"];
	if(modules && wikitextparser) {
		for(n=0; n<modules.length; n++) {
			m = modules[n];
			// Add the rules defined by the module - currently a hack as we overwrite them
			wikitextparser.installRules(m.rules);
		}
	}
};

/*
Parse a block of text of a specified MIME type

Options are:
	defaultType: Default MIME type to use if the specified one is unknown
*/
exports.parseText = function(type,text,options) {
	options = options || {};
	var parser = this.parsers[type];
	if(!parser) {
		parser = this.parsers[options.defaultType || "text/x-tiddlywiki"];
	}
	if(parser) {
		return parser.parse(type,text);
	} else {
		return null;
	}
};

exports.parseTiddler = function(title) {
	var me = this,
		tiddler = this.getTiddler(title);
	return tiddler ? this.getCacheForTiddler(title,"parseTree",function() {
			return me.parseText(tiddler.fields.type,tiddler.fields.text);
		}) : null;
};

/*
Parse text in a specified format and render it into another format
	outputType: content type for the output
	textType: content type of the input text
	text: input text
	options: see below
Options are:
	defaultType: Default MIME type to use if the specified one is unknown
*/
exports.renderText = function(outputType,textType,text,options) {
	var renderer = this.parseText(textType,text,options);
	renderer.execute([]);
	return renderer.render(outputType);
};

exports.renderTiddler = function(outputType,title) {
	var renderer = this.parseTiddler(title);
	renderer.execute([],title);
	return renderer.render(outputType);
};

/*
Install macro plugins into this wiki
	moduleType: Plugin type to install (defaults to "macro")

It's useful to remember what the `new` keyword does. It:

# Creates a new object. It's type is a plain `object`
# Sets the new objects internal, inaccessible, `[[prototype]]` property to the
	constructor function's external, accessible, `prototype` object
# Executes the constructor function, passing the new object as `this`

*/
exports.initMacros = function(moduleType) {
	moduleType = moduleType || "macro";
	$tw.wiki.macros = {}; 
	var MacroClass = require("./treenodes/macro.js").Macro,
		modules = $tw.plugins.moduleTypes[moduleType],
		n,m,f,
		subclassMacro = function(module) {
			// Make a copy of the Macro() constructor function
			var MacroMaker = function Macro() {
				MacroClass.apply(this,arguments);
			};
			// Set the prototype to a new instance of the prototype of the Macro class
			MacroMaker.prototype = new MacroClass();
			// Add the prototype methods for this instance of the macro
			for(var f in module) {
				MacroMaker.prototype[f] = module[f];
			}
			// Make a more convenient reference to the macro info
			return MacroMaker;
		};
	if(modules) {
		for(n=0; n<modules.length; n++) {
			m = modules[n];
			$tw.wiki.macros[m.info.name] = subclassMacro(m);
		}
	}
};

/*
Install editor plugins for the edit macro
*/
exports.initEditors = function(moduleType) {
	moduleType = moduleType || "editor";
	var editMacro = this.macros.edit;
	if(editMacro) {
		editMacro.editors = {};
		$tw.plugins.applyMethods(moduleType,editMacro.editors);
	}
};

})();
