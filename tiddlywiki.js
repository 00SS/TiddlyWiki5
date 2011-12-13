(function(){

/*
TiddlyWiki command line interface
*/

/*jslint node: true */
"use strict";

var WikiStore = require("./js/WikiStore.js").WikiStore,
	Tiddler = require("./js/Tiddler.js").Tiddler,
	Recipe = require("./js/Recipe.js").Recipe,
	tiddlerInput = require("./js/TiddlerInput.js"),
	tiddlerOutput = require("./js/TiddlerOutput.js"),
	TextProcessors = require("./js/TextProcessors.js").TextProcessors,
	WikiTextProcessor = require("./js/WikiTextProcessor.js").WikiTextProcessor,
	TiddlerConverters = require("./js/TiddlerConverters.js").TiddlerConverters,
	util = require("util"),
	fs = require("fs"),
	url = require("url"),
	path = require("path"),
	aync = require("async"),
	http = require("http");

var parseOptions = function(args,defaultSwitch) {
	var result = [],
		a = 0,
		switchRegExp = /^--([\S]+)$/gi;
	while(a < args.length) {
		switchRegExp.lastIndex = 0;
		var m = switchRegExp.exec(args[a]);
		if(m) {
			a++;
			var switchArgs = [];
			switchRegExp.lastIndex = 0;
			while(a < args.length && !switchRegExp.test(args[a])) {
				switchArgs.push(args[a++]);
			switchRegExp.lastIndex = 0;
			}
			result.push({switchName: m[1], args: switchArgs});
		} else {
			result.push({switchName: defaultSwitch, args: [args[a++]]});
		}
	}
	return result;
};

var textProcessors = new TextProcessors(),
	tiddlerConverters = new TiddlerConverters(),
	switches = parseOptions(Array.prototype.slice.call(process.argv,2),"dummy"),
	store = new WikiStore({
		textProcessors: textProcessors
	}),
	recipe = null,
	lastRecipeFilepath = null,
	currSwitch = 0;


textProcessors.registerTextProcessor("text/x-tiddlywiki",new WikiTextProcessor({
	textProcessors: textProcessors
}));
// Register the standard tiddler serializers and deserializers
tiddlerInput.register(tiddlerConverters);
tiddlerOutput.register(tiddlerConverters);

// Add the shadow tiddlers that are built into TiddlyWiki
var shadowShadowStore = new WikiStore({
		textProcessors: textProcessors,
		shadowStore: null
	}),
	shadowShadows = [
		{title: "StyleSheet", text: ""},
		{title: "MarkupPreHead", text: ""},
		{title: "MarkupPostHead", text: ""},
		{title: "MarkupPreBody", text: ""},
		{title: "MarkupPostBody", text: ""},
		{title: "TabTimeline", text: "<<timeline>>"},
		{title: "TabAll", text: "<<list all>>"},
		{title: "TabTags", text: "<<allTags excludeLists>>"},
		{title: "TabMoreMissing", text: "<<list missing>>"},
		{title: "TabMoreOrphans", text: "<<list orphans>>"},
		{title: "TabMoreShadowed", text: "<<list shadowed>>"},
		{title: "AdvancedOptions", text: "<<options>>"},
		{title: "PluginManager", text: "<<plugins>>"},
		{title: "SystemSettings", text: ""},
		{title: "ToolbarCommands", text: "|~ViewToolbar|closeTiddler closeOthers +editTiddler > fields syncing permalink references jump|\n|~EditToolbar|+saveTiddler -cancelTiddler deleteTiddler|"},
		{title: "WindowTitle", text: "<<tiddler SiteTitle>> - <<tiddler SiteSubtitle>>"},
		{title: "DefaultTiddlers", text: "[[GettingStarted]]"},
		{title: "MainMenu", text: "[[GettingStarted]]"},
		{title: "SiteTitle", text: "My TiddlyWiki"},
		{title: "SiteSubtitle", text: "a reusable non-linear personal web notebook"},
		{title: "SiteUrl", text: ""},
		{title: "SideBarOptions", text: '<<search>><<closeAll>><<permaview>><<newTiddler>><<newJournal "DD MMM YYYY" "journal">><<saveChanges>><<slider chkSliderOptionsPanel OptionsPanel "options \u00bb" "Change TiddlyWiki advanced options">>'},
		{title: "SideBarTabs", text: '<<tabs txtMainTab "Timeline" "Timeline" TabTimeline "All" "All tiddlers" TabAll "Tags" "All tags" TabTags "More" "More lists" TabMore>>'},
		{title: "TabMore", text: '<<tabs txtMoreTab "Missing" "Missing tiddlers" TabMoreMissing "Orphans" "Orphaned tiddlers" TabMoreOrphans "Shadowed" "Shadowed tiddlers" TabMoreShadowed>>'}
	];
store.shadows.shadows = shadowShadowStore;
for(var t=0; t<shadowShadows.length; t++) {
	shadowShadowStore.addTiddler(new Tiddler(shadowShadows[t]));
}

/*
Each command line switch is represented by a function that takes a string array of arguments and a callback to
be invoked when the switch processing has completed. The only argument to the callback is an error code, or null
for success.
*/
var commandLineSwitches = {
	recipe: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			if(recipe) {
				callback("--recipe: Cannot process more than one recipe file");
			} else {
				lastRecipeFilepath = args[0];
				recipe = new Recipe({
					filepath: args[0],
					store: store,
					tiddlerConverters: tiddlerConverters,
					textProcessors: textProcessors
				},function() {
					callback(null);
				});
			}
		}
	},
	dumpstore: {
		args: {min: 0, max: 0},
		handler: function(args,callback) {
			console.log("Store is:\n%s",util.inspect(store,false,10));
			process.nextTick(function() {callback(null);});
		}
	},
	dumprecipe: {
		args: {min: 0, max: 0},
		handler: function(args,callback) {
			console.log("Recipe is:\n%s",util.inspect(recipe,false,10));
			process.nextTick(function() {callback(null);});
		}
	},
	load: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			fs.readFile(args[0],"utf8",function(err,data) {
				if(err) {
					callback(err);
				} else {
					var fields = {title: args[0]},
						extname = path.extname(args[0]),
						type = extname === ".html" ? "application/x-tiddlywiki" : extname;
					var tiddlers = tiddlerInput.parseTiddlerFile(data,type,fields);
					for(var t=0; t<tiddlers.length; t++) {
						store.addTiddler(new Tiddler(tiddlers[t]));
					}
					callback(null);	
				}
			});
		}
	},
	savewiki: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			if(!recipe) {
				callback("--savewiki requires a recipe to be loaded first");
			}
			fs.writeFile(path.resolve(args[0],"index.html"),recipe.cook(),"utf8",function(err) {
				if(err) {
					callback(err);
				} else {
					fs.writeFile(path.resolve(args[0],"index.xml"),recipe.cookRss(),"utf8",function(err) {
						callback(err);
					});
				}
			});
		}
	},
	savetiddlers: {
		args: {min: 1, max: 1},
		handler: function(args,callback) {
			var recipe = [];
			store.forEachTiddler(function(title,tiddler) {
				var filename = encodeURIComponent(tiddler.fields.title.replace(/ /g,"_")) + ".tid";
				fs.writeFileSync(path.resolve(args[0],filename),tiddlerOutput.outputTiddler(tiddler),"utf8");
				recipe.push("tiddler: " + filename + "\n");
			});
			fs.writeFileSync(path.join(args[0],"split.recipe"),recipe.join(""));
			process.nextTick(function() {callback(null);});
		}
	},
	servewiki: {
		args: {min: 0, max: 1},
		handler: function(args,callback) {
			if(!lastRecipeFilepath) {
				callback("--servewiki must be preceded by a --recipe");
			}
			var port = args.length > 0 ? args[0] : 8000;
			// Dumbly, this implementation wastes the recipe processing that happened on the --recipe switch
			http.createServer(function(request, response) {
				response.writeHead(200, {"Content-Type": "text/html"});
				store = new WikiStore({
					textProcessors: textProcessors
				});
				recipe = new Recipe(store,lastRecipeFilepath,function() {
					response.end(recipe.cook(), "utf8");	
				});
			}).listen(port);
		}
	},
	servetiddlers: {
		args: {min: 0, max: 1},
		handler: function(args,callback) {
			var port = args.length > 0 ? args[0] : 8000;
			http.createServer(function (request, response) {
				var title = decodeURIComponent(url.parse(request.url).pathname.substr(1)),
					tiddler = store.getTiddler(title);
				if(tiddler) {
					response.writeHead(200, {"Content-Type": "text/html"});
					response.end(store.renderTiddler("text/html",title),"utf8");					
				} else {
					response.writeHead(404);
					response.end();
				}
			}).listen(port);
		}
	},
	verbose: {
		args: {min: 0, max: 0},
		handler: function(args,callback) {
			process.nextTick(function() {callback(null);});
		}
	}
};

var processNextSwitch = function() {
	if(currSwitch < switches.length) {
		var s = switches[currSwitch++],
			csw = commandLineSwitches[s.switchName];
		if(s.args.length < csw.args.min) {
			throw "Command line switch --" + s.switchName + " should have a minimum of " + csw.args.min + " arguments";
		}
		if(s.args.length > csw.args.max) {
			throw "Command line switch --" + s.switchName + " should have a maximum of " + csw.args.max + " arguments";
		}
		csw.handler(s.args,function (err) {
			if(err) {
				throw err;
			}
			process.nextTick(processNextSwitch);
		});
	}
};

process.nextTick(processNextSwitch);

})();
