/*\
title: $:/plugins/dropbox/dropbox-app.js
type: application/javascript
module-type: dropbox-startup

Startup the Dropbox wiki app

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var titleWikiName = "$:/plugins/dropbox/WikiName";

exports.startup = function() {
	// Check that we've been loaded from the dropbox
	var url = (window.location.protocol + "//" + window.location.host + window.location.pathname),
		wikiName;
	if(url.indexOf($tw.plugins.dropbox.userInfo.publicAppUrl) === 0) {
		var p = url.indexOf("/",$tw.plugins.dropbox.userInfo.publicAppUrl.length + 1);
		if(p !== -1 && url.substr(p) === "/index.html") {
			wikiName = decodeURIComponent(url.substring($tw.plugins.dropbox.userInfo.publicAppUrl.length + 1,p));
		}
	}
	if(wikiName) {
		$tw.plugins.dropbox.wikiName = wikiName;
		$tw.wiki.addTiddler({title: titleWikiName, text: $tw.plugins.dropbox.wikiName},true);
		// Load tiddlers
		$tw.plugins.dropbox.loadTiddlerFiles("/" + $tw.plugins.dropbox.wikiName + "/tiddlers",function() {
			console.log("Loaded all tiddlers",$tw.wiki.tiddlers);
		});	
	} else {
		alert("This TiddlyWiki file must be in Dropbox");
	}
};

})();
