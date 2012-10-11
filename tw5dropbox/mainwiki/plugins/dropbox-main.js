/*\
title: $:/plugins/dropbox/dropbox-main.js
type: application/javascript
module-type: dropbox-startup

Startup the Dropbox main app

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var titleLoadedWikis = "$:/plugins/dropbox/LoadedWikis";

exports.startup = function() {
	$tw.wiki.addTiddler({title: titleLoadedWikis, text: "no"},true);
	// Load tiddlers
	$tw.plugins.dropbox.loadWikiFiles("/",function() {
		$tw.wiki.addTiddler({title: titleLoadedWikis, text: "yes"},true);
		console.log("Loaded all wikis",$tw.wiki.tiddlers);
	});
};

})();
