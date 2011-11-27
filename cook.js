// Cook a TiddlyWiki recipe and send it to STDOUT
//
// Usage: node cook.js <recipefile>

var sys = require("sys"),
	TiddlyWiki = require("./js/TiddlyWiki.js").TiddlyWiki,
	Recipe = require("./js/Recipe.js").Recipe;

var filename = process.argv[2];

var store = new TiddlyWiki();

var theRecipe = new Recipe(store,filename);

process.stdout.write(theRecipe.cook());
