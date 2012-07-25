var response = require('ringo/jsgi/response');
var mustache = require('ringo/mustache');
var utils = require('ringo/utils/http');
var httpclient = require('ringo/httpclient');
var gs = require('./lib/geoscript');
var db = require('./scripts/DistanceBearing');

exports.index = function (req) {
    var template = getResource("./templates/index.html").content;
    return response.html(
        mustache.to_html(template, {
            title: "It's working!"
        })
    );
};

function makeBBox(loc, radius_m) {
	var calc  = new Packages.org.geotools.referencing.GeodeticCalculator();
	calc.setStartingGeographicPoint(loc.x, loc.y);
	
	calc.setDirection(0, radius_m);
	var north = calc.getDestinationGeographicPoint();

	calc.setDirection(90, radius_m);
	var east = calc.getDestinationGeographicPoint();

	calc.setDirection(180, radius_m);
	var south = calc.getDestinationGeographicPoint();

	calc.setDirection(-90, radius_m);
	var west = calc.getDestinationGeographicPoint();
	
	return {
		lowerleft:	{ x: west.x, y: south.y },
		upperright:	{ x: east.x, y: north.y }
	};
}

exports.wps = function (req) {
	var params = utils.parseParameters(req.input.read());
	var bbox = makeBBox(params.location, params.radius);

	var request = "?request=GetFeature&version=1.0.0&typeName=" + params.typeName + "&BBOX=" +
		bbox.lowerleft.x + "," + bbox.lowerleft.y + "," + bbox.upperright.x + "," + bbox.upperright.y + ",EPSG:4326&outputFormat=JSON";

	var exchange = httpclient.get(params.wfs + request);

    var obj = JSON.parse(exchange.content);
    if (obj.type != "FeatureCollection") {
        throw new Error("Invalid GeoJSON type - " + obj.type);
    }
    
    obj.features.forEach(function(f) {
    	f.geometry = gs.geom.create(f.geometry);
    });
    
	return response.json(db.distanceBearing(params, obj.features));
};