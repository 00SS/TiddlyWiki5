/*\
title: $:/core/modules/savers/download.js
type: application/javascript
module-type: saver

Handles saving changes via HTML5's download APIs

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Select the appropriate saver module and set it up
*/
var DownloadSaver = function() {
};

DownloadSaver.prototype.save = function(text) {
	// Set up the link
	var link = document.createElement("a");
	link.setAttribute("target","_blank");
	link.setAttribute("href","data:text/html," + encodeURIComponent(text));
	// Use the download attribute to download it if it is supported
	if(link.download !== undefined) {
		link.setAttribute("download","tiddlywiki.html");
	}
	link.click();
};

/*
Information about this saver
*/
DownloadSaver.prototype.info = {
	name: "download",
	priority: 0
};

/*
Static method that returns true if this saver is capable of working
*/
exports.canSave = function() {
	return true;
};

/*
Create an instance of this saver
*/
exports.create = function() {
	return new DownloadSaver();
};

})();
