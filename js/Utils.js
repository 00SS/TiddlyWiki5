/*
Various static utility functions.

This file is a bit of a dumping ground; the expectation is that most of these functions will be refactored.
*/

/*global require: false, exports: false, process: false */
"use strict";

var utils = exports;

// Pad a string to a certain length with zeros
utils.zeroPad = function(n,d)
{
	var s = n.toString();
	if(s.length < d)
		s = "000000000000000000000000000".substr(0,d-s.length) + s;
	return s;
};

// Convert a date to UTC YYYYMMDDHHMM string format
utils.convertToYYYYMMDDHHMM = function(date)
{
	return date.getUTCFullYear() + utils.zeroPad(date.getUTCMonth()+1,2) + utils.zeroPad(date.getUTCDate(),2) + utils.zeroPad(date.getUTCHours(),2) + utils.zeroPad(date.getUTCMinutes(),2);
};

// Convert a date to UTC YYYYMMDDHHMMSSMMM string format
utils.convertToYYYYMMDDHHMMSSMMM = function(date)
{
	return date.getUTCFullYear() + utils.zeroPad(date.getUTCMonth()+1,2) + utils.zeroPad(date.getUTCDate(),2) + utils.zeroPad(date.getUTCHours(),2) + utils.zeroPad(date.getUTCMinutes(),2) + utils.zeroPad(date.getUTCSeconds(),2) + utils.zeroPad(date.getUTCMilliseconds(),3) +"0";
};

// Create a UTC date from a YYYYMMDDHHMM format string
utils.convertFromYYYYMMDDHHMM = function(d)
{
	return utils.convertFromYYYYMMDDHHMMSSMMM(d.substr(0,12));
};

// Create a UTC date from a YYYYMMDDHHMMSS format string
utils.convertFromYYYYMMDDHHMMSS = function(d)
{
	return utils.convertFromYYYYMMDDHHMMSSMMM(d.substr(0,14));
};

// Create a UTC date from a YYYYMMDDHHMMSSMMM format string
utils.convertFromYYYYMMDDHHMMSSMMM = function(d)
{
	return new Date(Date.UTC(parseInt(d.substr(0,4),10),
			parseInt(d.substr(4,2),10)-1,
			parseInt(d.substr(6,2),10),
			parseInt(d.substr(8,2)||"00",10),
			parseInt(d.substr(10,2)||"00",10),
			parseInt(d.substr(12,2)||"00",10),
			parseInt(d.substr(14,3)||"000",10)));
};

// Convert & to "&amp;", < to "&lt;", > to "&gt;" and " to "&quot;"
utils.htmlEncode = function(s)
{
	return s.replace(/&/mg,"&amp;").replace(/</mg,"&lt;").replace(/>/mg,"&gt;").replace(/\"/mg,"&quot;");
};

// Convert "&amp;" to &, "&lt;" to <, "&gt;" to > and "&quot;" to "
utils.htmlDecode = function(s)
{
	return s.replace(/&lt;/mg,"<").replace(/&gt;/mg,">").replace(/&quot;/mg,"\"").replace(/&amp;/mg,"&");
};

