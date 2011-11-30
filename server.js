// Cook a TiddlyWiki recipe and serve the result over HTTP
//
// Usage: node server.js <recipefile>

"use strict";

var TiddlyWiki = require("./js/TiddlyWiki.js").TiddlyWiki,
	Recipe = require("./js/Recipe.js").Recipe,
	http = require("http"),
	fs = require("fs"),
	url = require("url"),
	path = require("path"),
	util = require("util");

var filename = process.argv[2];

http.createServer(function(request, response) {
	response.writeHead(200, {"Content-Type": "text/html"});
	var store = new TiddlyWiki(),
		theRecipe = new Recipe(store,filename,function() {
			response.end(theRecipe.cook(), "utf-8");	
		});
}).listen(8000);

util.puts("Server running at http://127.0.0.1:8000/");
