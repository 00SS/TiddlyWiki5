# cook.js

This is an attempt to modernise TiddlyWiki's build system, which has been based on tools written in Ruby called Cook and Ginsu (see https://github.com/TiddlyWiki/cooker for details). They were first written in 2006 and have been heavily hacked since then.

This new version is written in JavaScript for node.js, with the intention that it can share code with TiddlyWiki itself.

The goal is to achieve byte-for-byte compatibility with the old tools, but only to support the features required by the recipe files that are currently in use by TiddlyWiki and TiddlySpace. One of the difficulties is that cook.rb is very buggy; the current build process for tiddlywiki.com relies on TiddlyWiki itself doing a save operation in the browser to clear up problems with duplicate tiddlers and badly formed attributes.

## Usage

	node cook.js <recipefile>

Cooks a recipe file and sends the output to STDOUT

	node server.js <recipefile>

Cooks a recipe file and serves it over HTTP port 8000

	node ginsu.js <tiddlywikifile> <outputdir>

Splits a TiddlyWiki file into separate `.tid` files and a `split.recipe` file.

Tiddlers can be read from `.tid`, `.tiddler` or TiddlyWeb-style fat `.json' files.

You can use filepaths or URLs to reference recipe files and tiddlers. For example, this recipe cooks the latest TiddlyWiki components directly from the online repositories:

	recipe: https://raw.github.com/TiddlyWiki/tiddlywiki/master/tiddlywikinonoscript.html.recipe
	tiddler: http://tiddlywiki-com.tiddlyspace.com/bags/tiddlywiki-com-ref_public/tiddlers.json?fat=1
	tiddler: http://tiddlywiki-com.tiddlyspace.com/bags/tiddlywiki-com_public/tiddlers.json?fat=1

## Testing

`test.sh` contains a simple test that cooks the main tiddlywiki.com recipe and compares it with the results of the old build process (ie, running cook.rb and then opening the file in a browser and performing a 'save changes' operation).

## Current status

As of 2nd December 2011, cook.js can now build a fully functional TiddlyWiki from the existing recipe files. There are two or three minor whitespace issues that prevent full byte-for-byte compatibility.

## Plans for new command line interface

The idea is to join `cook.js`, `ginsu.js` and `server.js` into a single command line tool, provisionally called `tiddlywiki.js`. This would be used as follows:

	node tiddlywiki.js <options>

An interesting potential goal is that the same `tiddlywiki.js` file could be used in the browser as on the server side.

The command line options are processed in sequential order from left to right. Processing pauses during long operations, like loading a recipe file and all the subrecipes and tiddlers that it references. The following options are available:

	--recipe <filepath>			# Loads a specfied `.recipe` file
	--load <filepath>			# Load additional tiddlers from TiddlyWiki files (`.html`), `.tiddler`, `.tid`, `.json` or other files
	--savewiki <filepath>		# Saves all the loaded tiddlers as a single file TiddlyWiki in `.html` format
	--saverss <filepath> 		# Saves the the loaded tiddlers as an RSS feed in `.xml` format
	--savetiddlers <outdir>		# Saves all the loaded tiddlers as `.tid` files in the specified directory
	--servewiki <port>			# Serve the cooked TiddlyWiki over HTTP at `/`
	--servetiddlers <port>		# Serve individual tiddlers over HTTP at `/tiddlertitle`
	--verbose 					# verbose output, useful for debugging

This example loads the tiddlers from a TiddlyWiki HTML file and makes them available over HTTP:

	node tiddlywiki.js --load mywiki.html --servewiki 127.0.0.1:8000

This example cooks a TiddlyWiki from a recipe:

	node tiddlywiki.js --recipe tiddlywiki.com/index.recipe --savewiki tmp/

This example ginsus a TiddlyWiki into its constituent tiddlers:

	node tiddlywiki.js --load mywiki.html --savetiddlers tmp/tiddlers

`--servewiki` and `--servertiddlers` are for different purposes and should not be used together. The former is for TiddlyWiki core developers who want to be able to edit the TiddlyWiki source files in a text editor and view the results in the browser by clicking refresh; it is slow because it reloads all the TiddlyWiki JavaScript files each time the page is loaded. The latter is for experimenting with the new wikification engine.
