var response = require('ringo/jsgi/response');
var mustache = require('ringo/mustache');
var db = require('./scripts/DistanceBearing');

exports.index = function (req) {
    var template = getResource("./templates/index.html").content;
    return response.html(
        mustache.to_html(template, {
            title: "It's working!"
        })
    );
};

exports.wps = function (req) {

	db.distanceBearing();
	
    var template = getResource("./templates/index.html").content;
    return response.html(
        mustache.to_html(template, {
            title: "It's a REST path!"
        })
    );
};
