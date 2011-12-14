/*\
title: js/StoryNavigator.js

This browser component manages navigating to new tiddlers in a TiddlyWiki classic story style

\*/
(function(){

/*jslint node: true, jquery: true */
"use strict";

var StoryNavigator = function(navigators) {
	this.navigators = navigators;
};

StoryNavigator.prototype.navigateTo = function(title) {
	var tiddlerHtml = this.navigators.store.renderTiddler("text/html","SimpleTemplate",title);
	if(tiddlerHtml) {
		$("<article/>").html(tiddlerHtml).appendTo("body");
		return false;
	} else {
		return true;		
	}
};

exports.StoryNavigator = StoryNavigator;

})();
