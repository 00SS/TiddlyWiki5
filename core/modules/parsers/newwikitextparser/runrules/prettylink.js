/*\
title: $:/core/modules/parsers/newwikitextparser/runrules/prettylink.js
type: application/javascript
module-type: wikitextrunrule

Wiki text run rule for pretty links

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "prettylink";

exports.regExpString = "\\[\\[";

exports.parse = function(match) {
	var regExp = /\[\[(.*?)(?:\|(~)?(.*?))?\]\]/mg;
	regExp.lastIndex = this.pos;
	match = regExp.exec(this.source);
	if(match && match.index === this.pos) {
		var text = match[1],
			link = match[3] || text;
		this.pos = match.index + match[0].length;
		var macroNode = $tw.Tree.Macro("link",{to: link},[$tw.Tree.Text(text)],this.wiki);
		this.dependencies.mergeDependencies(macroNode.dependencies);
		return [macroNode];
	}
	return [];
};

})();
