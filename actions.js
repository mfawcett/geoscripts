var response = require('ringo/jsgi/response');
var mustache = require('ringo/mustache');
var utils = require('ringo/utils/http');
var httpclient = require('ringo/httpclient');
var gs = require('./lib/geoscript');
var db = require('./scripts/DistanceBearing');

// character codes used for slicing and decoding
var SPACE     = " ".charCodeAt(0);
var PERCENT   = "%".charCodeAt(0);
var AMPERSAND = "&".charCodeAt(0);
var PLUS      = "+".charCodeAt(0);
var EQUALS    = "=".charCodeAt(0);

// character codes used for hex decoding
var CHAR_0 = "0".charCodeAt(0);
var CHAR_9 = "9".charCodeAt(0);
var CHAR_A = "A".charCodeAt(0);
var CHAR_F = "F".charCodeAt(0);
var CHAR_a = "a".charCodeAt(0);
var CHAR_f = "f".charCodeAt(0);

// used for multipart parsing
var HYPHEN  = "-".charCodeAt(0);
var CR = "\r".charCodeAt(0);
var CRLF = new ByteString("\r\n", "ASCII");
var EMPTY_LINE = new ByteString("\r\n\r\n", "ASCII");

exports.index = function (req) {
    var template = getResource("./templates/index.html").content;
    return response.html(
        mustache.to_html(template, {
            title: "It's working!"
        })
    );
};

function makeBBox(x, y, radius_m) {
	var calc  = new Packages.org.geotools.referencing.GeodeticCalculator();
	calc.setStartingGeographicPoint(x, y);
	
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

// convert + to spaces, decode %ff hex sequences,
// then decode to string using the specified encoding.
function decodeToString(bytes, encoding) {
	var k = 0;
	while ((k = bytes.indexOf(PLUS, k)) > -1) {
		bytes[k++] = SPACE;
	}
	var i, j = 0;
	while ((i = bytes.indexOf(PERCENT, j)) > -1) {
		j = i;
		while (bytes[i] == PERCENT && i++ <= bytes.length - 3) {
			bytes[j++] = (convertHexDigit(bytes[i++]) << 4) + convertHexDigit(bytes[i++]);
		}
		if (i < bytes.length) {
			bytes.copy(i, bytes.length, bytes, j);
		}
		bytes.length -= i - j;
	}

	return bytes.decodeToString(encoding);
}

function convertHexDigit(byte) {
	if (byte >= CHAR_0 && byte <= CHAR_9)
		return byte - CHAR_0;
	if (byte >= CHAR_a && byte <= CHAR_f)
		return byte - CHAR_a + 10;
	if (byte >= CHAR_A && byte <= CHAR_F)
		return byte - CHAR_A + 10;
	return 0;
}


function exacuteWps(params) {
	if (params && params.x && params.y && params.radius && params.wfs && params.typeName) {

	    var resp = null;
		
		var bbox = makeBBox(params.x, params.y, params.radius);

		var requestParams = "?request=GetFeature&version=1.0.0&typeName=" + params.typeName + "&BBOX=" +
			bbox.lowerleft.x + "," + bbox.lowerleft.y + "," + bbox.upperright.x + "," + bbox.upperright.y + ",EPSG:4326&outputFormat=JSON";

		var exchange = httpclient.get(params.wfs + requestParams);

	    var obj = JSON.parse(exchange.content);
	    if (obj.type != "FeatureCollection") {
	        throw new Error("Invalid GeoJSON type - " + obj.type);
	    }
	    
	    obj.features.forEach(function(f) {
	    	f.geometry = gs.geom.create(f.geometry);
	    });
	    
	    resp = response.json(db.distanceBearing(params, obj.features));
	} else {
		print("Server Error: Invalid parameters");
		resp = {
	        status: 500,
	        headers: {"Content-Type": "text/plain",
	        	"Access-Control-Allow-Origin": "*",
	        	"Access-Control-Allow-Methods": "POST, GET",
	        	"Access-Control-Allow-Headers": "x-requested-with,Content-Type"},
	        body: ["Invalid parameters"]
	    };
	}

    resp.headers['Access-Control-Allow-Origin'] = '*';
    return resp;
} 


function parseParameters(req) {
	var input = req.input.read();
	var params = null;
	
	// handle json and application/x-www-form-urlencoded input
	if (req.headers["content-type"] === "application/json") {
		var inputString =  decodeToString(input);
		params = eval('(' + inputString + ')');
	} else {
		params = utils.parseParameters(input);		
	}
	
	print("params {");
	for (var key in params) {
		print("  " + key + " = " + params[key]);
	}
	print("} // params");	
	
	return params;
}

function generateOptionsResponse() {
	// if the request received is of method "OPTIONS", respond with okay so that
	// the POST can follow as expected
	return {
        status: 200,
        headers: {"Content-Type": "text/plain",
        	"Access-Control-Allow-Origin": "*",
        	"Access-Control-Allow-Methods": "POST, GET",
        	"Access-Control-Allow-Headers": "x-requested-with,Content-Type"},
        body: ["reponse to preflight"]
    };	
}

exports.wps = function (req) {
	if(req.method === "OPTIONS") {
		return generateOptionsResponse();
	}
	
	var params = parseParameters(req);
	return exacuteWps(params);
 };

 exports.medfordschools = function (req) {
	if(req.method === "OPTIONS") {
		return generateOptionsResponse();
	}
	
	var params = parseParameters(req);
	params.wfs = 'http://geoserver.rogue.lmnsolutions.com/geoserver/wfs';
	params.typeName = "medford:schools";
	return exacuteWps(params);
 };


exports.medfordhospitals = function (req) {
	if(req.method === "OPTIONS") {
		return generateOptionsResponse();
	}
	
	var params = parseParameters(req);
	params.wfs = 'http://geoserver.rogue.lmnsolutions.com/geoserver/wfs';
	params.typeName = "medford:hospitals";
	return exacuteWps(params);
};

