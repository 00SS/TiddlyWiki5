/*\
title: js/macros/info.js

\*/
(function(){

/*jslint node: true */
"use strict";

var utils = require("../Utils.js");

exports.macro = {
	name: "info",
	types: ["text/html","text/plain"],
	params: {
	},
	code: function(type,tiddler,store,params) {
		var encoder = type === "text/html" ? utils.htmlEncode : function(x) {return x;},
			parseTree = store.parseTiddler(tiddler.fields.title);
		if(parseTree) {
			var d = parseTree.dependencies;
			if(d === null) {
				return encoder("Dependencies: *");
			} else {
				return encoder("Dependencies: " + d.join(", "));
			}
		} else {
			return "";
		}
	}
};

})();
