/*\
title: js/macros/info.js

\*/
(function(){

/*jslint node: true */
"use strict";

var HTML = require("../HTML.js").HTML,
	utils = require("../Utils.js");

exports.macro = {
	name: "info",
	types: ["text/html","text/plain"],
	params: {
		info: {byName: "default", type: "text", optional: false}
	},
	events: {
		click: function(event,node,tiddler,store,params) {
			var el = node.firstChild.firstChild.nextSibling;
			el.style.display = el.style.display === "block" ? "none" : "block";
			event.preventDefault();
			return false;
		}
	},
	render: function(type,tiddler,store,params) {
		var encoder = type === "text/html" ? utils.htmlEncode : function(x) {return x;},
			info = params.info || "parsetree";
		if(tiddler) {
			var parseTree = store.parseTiddler(tiddler.title);
			switch(info) {
				case "parsetree":
					return HTML(HTML.slider(type,
										"Parse tree",
										"The parse tree for this tiddler",
										parseTree.toString(type)),type);
					//break;
				case "compiled":
					return HTML(HTML.slider(type,
										"Render functions",
										"The render functions for this tiddler",
										parseTree.compile(type).toString(type)),type);
					//break;
				case "dependencies":
					return HTML(HTML.slider(type,
										"Dependencies",
										"The dependencies for this tiddler",
										(parseTree.dependencies === null) ? "*" : encoder(parseTree.dependencies.join(", "))),type);
					//break;
			}
		}
	}
};

})();
