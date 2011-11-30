/*
Functions concerned with parsing representations of tiddlers
*/

var ArgParser = require("./ArgParser.js").ArgParser,
	utils = require("./Utils.js");

var tiddlerInput = exports;

/*
Parse a tiddler given its mimetype, and merge the results into a hashmap of tiddler fields.

A file extension can be passed as a shortcut for the mimetype, as shown in tiddlerUtils.fileExtensionMappings.
For example ".txt" file extension is mapped to the "text/plain" mimetype.

Special processing to extract embedded metadata is applied to some mimetypes.
*/

tiddlerInput.parseTiddlerFile = function(text,type,fields) {
	if(fields === undefined) {
		var fields = {};
	}
	// Map extensions to mimetpyes
	var fileExtensionMapping = tiddlerInput.fileExtensionMappings[type];
	if(fileExtensionMapping)
		type = fileExtensionMapping;
	// Invoke the parser for the specified mimetype
	var parser = tiddlerInput.parseTiddlerFileByMimeType[type];
	if(parser) {
		return parser(text,fields);
	} else {
		throw new Error("Unknown tiddler type in tiddlerInput.parseTiddlerFile: " + type);
	}
}

tiddlerInput.fileExtensionMappings = {
	".txt": "text/plain",
	".html": "text/html",
	".tiddler": "application/x-tiddler-html-div",
	".tid": "application/x-tiddler",
	".js": "application/javascript",
	".json": "application/json"
}

tiddlerInput.parseTiddlerFileByMimeType = {
	"text/plain": function(text,fields) {
		fields.text = text;
		return [fields];
	},
	"text/html": function(text,fields) {
		fields.text = text;
		return [fields];
	},
	"application/x-tiddler-html-div": function(text,fields) {
		return [tiddlerInput.parseTiddlerDiv(text,fields)];
	},
	"application/x-tiddler": function(text,fields) {
		var split = text.indexOf("\n\n");
		if(split === -1) {
			split = text.length;
		}
		fields = tiddlerInput.parseMetaDataBlock(text.substr(0,split),fields);
		fields.text = text.substr(split + 2);
		return [fields];
	},
	"application/javascript": function(text,fields) {
		fields.text = text;
		return [fields];
	},
	"application/json": function(text,fields) {
		
	}
}

/*
Parse a block of metadata and merge the results into a hashmap of tiddler fields.

The block consists of newline delimited lines consisting of the field name, a colon, and then the value. For example:

title: Safari
modifier: blaine
created: 20110211110700
modified: 20110211131020
tags: browsers issues
creator: psd
*/
tiddlerInput.parseMetaDataBlock = function(metaData,fields) {
	if(fields === undefined) {
		var fields = {};
	}
	metaData.split("\n").forEach(function(line) {
		var p = line.indexOf(":");
		if(p !== -1) {
			var field = line.substr(0, p).trim();
			var value = line.substr(p+1).trim();
			fields[field] = tiddlerInput.parseMetaDataItem(field,value);
		}
	});
	return fields;
}

/*
Parse an old-style tiddler DIV. It looks like this:

<div title="Title" creator="JoeBloggs" modifier="JoeBloggs" created="201102111106" modified="201102111310" tags="myTag [[my long tag]]">
<pre>The text of the tiddler (without the expected HTML encoding).
</pre>
</div>

Note that the field attributes are HTML encoded, but that the body of the <PRE> tag is not.
*/
tiddlerInput.parseTiddlerDiv = function(text,fields) {
	if(fields === undefined) {
		var fields = {};
	}
	var divRegExp = /^\s*<div\s+([^>]*)>((?:.|\n)*)<\/div>\s*$/gi,
		subDivRegExp = /^\s*<pre>((?:.|\n)*)<\/pre>\s*$/gi,
		attrRegExp = /\s*([^=\s]+)\s*=\s*"([^"]*)"/gi,
		match = divRegExp.exec(text);
	if(match) {
		var subMatch = subDivRegExp.exec(match[2]); // Body of the <DIV> tag
		if(subMatch) {
			fields.text = subMatch[1];
		} else {
			fields.text = match[2]; 
		}
		var attrMatch;
		do {
			attrMatch = attrRegExp.exec(match[1]);
			if(attrMatch) {
				var name = attrMatch[1];
				var value = attrMatch[2];
				fields[name] = tiddlerInput.parseMetaDataItem(name,value);
			}
		} while(attrMatch);
	}
	return fields;	
}

/*
Parse a single metadata field/value pair and return the value as the appropriate data type
*/
tiddlerInput.parseMetaDataItem = function(field,value) {
	var result;
	switch(field) {
		case "modified":
		case "created":
			result = utils.convertFromYYYYMMDDHHMMSS(value);
			break;
		case "tags":
			var parser = new ArgParser(value,{noNames: true});
			result = parser.getValuesByName("","");
			break;
		default:
			result = value;
			break;
	}
	return result;
}
