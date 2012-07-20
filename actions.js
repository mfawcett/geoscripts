var response = require('ringo/jsgi/response');
var mustache = require('ringo/mustache');
var utils = require('ringo/utils/http');
var httpclient = require('ringo/httpclient');
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

	var json = utils.parseParameters(req.input.read());
	console.log(json.location.x + ", " + json.location.y);
	console.log(json.radius);
	console.log(json.wfs);
	console.log(json.feature);

	var xml = '' + 
	'<wfs:GetFeature service="WFS" version="1.1.0"' +
	'	  xmlns:wfs="' + json.wfs + '"' +
	'	  xmlns="http://www.opengis.net/ogc"' +
	'	  xmlns:gml="http://www.opengis.net/gml"' +
	'	  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
	'	  xsi:schemaLocation="http://www.opengis.net/wfs' +
	'	                      http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">' +
	'	  <wfs:Query typeName="' + json.feature + '">' +
	'	    <Filter>' +
	'	      <DWithin>' +
	'	        <PropertyName>geom</PropertyName>' +
	'	        <gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
	'	          <gml:coordinates>-122.7668,42.4979</gml:coordinates>' +
	'	        </gml:Point>' +
	'			<Distance units="m">200</Distance>' +
	'	      </DWithin>' +
	'	    </Filter>' +
	'	  </wfs:Query>' +
	'</wfs:GetFeature>';

	return httpclient.post(json.wfs, xml);
/*
	db.distanceBearing();

    var template = getResource("./templates/index.html").content;
    return response.json({ name: 'some name', epsg: 4326 });
*/
};
