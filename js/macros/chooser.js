/*\
title: js/macros/chooser.js

\*/
(function(){

/*jslint node: true, browser: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer,
    Dependencies = require("../Dependencies.js").Dependencies,
	Tiddler = require("../Tiddler.js").Tiddler,
	utils = require("../Utils.js");

function showChooser(macroNode) {
	if(!macroNode.chooserDisplayed) {
		macroNode.chooserDisplayed = true;
		var nodes = [];
		macroNode.store.forEachTiddler("title",function(title,tiddler) {
			nodes.push(Renderer.ElementNode("li",{
					"data-link": title
				},[
					Renderer.TextNode(title)
				]));
		});
		var wrapper = Renderer.ElementNode("ul",{},nodes);
		wrapper.execute(macroNode.parents,macroNode.tiddlerTitle);
		macroNode.content = [wrapper];
		macroNode.content[0].renderInDom(macroNode.domNode);
	}
}

/*
Select the appropriate chooser item given a touch/mouse position in screen coordinates
*/
function select(macroNode,y) {
	if(macroNode.content.length > 0) {
		var targetIndex = Math.floor(macroNode.content[0].domNode.childNodes.length * (y/window.innerHeight)),
			target = macroNode.content[0].domNode.childNodes[targetIndex];
		if(target) {
			deselect(macroNode);
			macroNode.selectedNode = target;
			utils.addClass(target,"selected");
		}
	}
}

function deselect(macroNode) {
	if(macroNode.selectedNode) {
		utils.removeClass(macroNode.selectedNode,"selected");
		macroNode.selectedNode = null;
	}
}

function action(macroNode) {
	if(macroNode.selectedNode) {
		var navEvent = document.createEvent("Event");
		navEvent.initEvent("tw-navigate",true,true);
		navEvent.navigateTo = macroNode.selectedNode.getAttribute("data-link");
		macroNode.domNode.dispatchEvent(navEvent); 
	}
}

/*
Set the position of the chooser panel within its wrapper given a touch/mouse position in screen coordinates
*/
function hoverChooser(macroNode,x,y) {
	if(macroNode.chooserDisplayed) {
		// Get the target element that the touch/mouse is over
		select(macroNode,y);
		// Things we need for sizing and positioning the chooser
		var domPanel = macroNode.content[0].domNode,
			heightPanel = domPanel.offsetHeight,
			widthPanel = domPanel.offsetWidth;
		// Position the chooser div to account for scrolling
		macroNode.content[0].domNode.style.top = window.pageYOffset + "px";
		// Scale the panel to fit
		var scaleFactor = window.innerHeight/heightPanel;
		// Scale up as we move right
		var expandFactor = x > 50 ? ((x+150)/200) : 1;
		// Set up the transform
		var scale = scaleFactor * expandFactor,
			translateX = x > 16 ? 0 : -(((16-x)/16) * widthPanel) / scale,
			translateY = (y / scale) - ((y/window.innerHeight) * heightPanel);
		domPanel.style.webkitTransformOrigin = 
		domPanel.style.MozTransformOrigin = "0 0";
		domPanel.style.webkitTransform = 
		domPanel.style.MozTransform = "scale(" + scale + ") translateX(" + translateX + "px) translateY(" + translateY + "px)";
	}
}

function hideChooser(macroNode) {
	if(macroNode.chooserDisplayed) {
		deselect(macroNode);
		macroNode.chooserDisplayed = false;
		macroNode.domNode.removeChild(macroNode.content[0].domNode);
		macroNode.content = [];
	}
}

exports.macro = {
	name: "chooser",
	wrapperTag: "div",
	params: {
	},
	events: {
		touchstart: function(event) {
			showChooser(this);
			hoverChooser(this,event.touches[0].clientX,event.touches[0].clientY);
			event.preventDefault();
			return false;
		},
		touchmove: function(event) {
			hoverChooser(this,event.touches[0].clientX,event.touches[0].clientY);
			event.preventDefault();
			return false;
		},
		touchend: function(event) {
			action(this);
			hideChooser(this);
			event.preventDefault();
			return false;
		},
		mouseover: function(event) {
			if(event.target === this.domNode) {
				showChooser(this);
				hoverChooser(this,event.clientX,event.clientY);
				event.preventDefault();
				return false;
			}
		},
		mousemove: function(event) {
			hoverChooser(this,event.clientX,event.clientY);
			event.preventDefault();
			return false;
		},
		mouseup: function(event) {
			action(this);
			hideChooser(this);
			event.preventDefault();
			return false;
		},
		mouseout: function(event) {
			if(!utils.domContains(this.domNode,event.relatedTarget)) {
				hideChooser(this);
				event.preventDefault();
				return false;
			}
		}
	},
	execute: function() {
		this.chooserDisplayed = false;
		return [];
	}
};

})();

