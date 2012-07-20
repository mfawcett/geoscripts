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
	
	var typeName = json.feature;
	var layer = "geom";
	var lon = json.location.x;
	var lat = json.location.y;
	var distance = json.radius;
	var distanceUnits = "m";

	var xml = '' + 
	'<wfs:GetFeature service="WFS" version="1.1.0"' +
	'	xmlns:usa="http://usa.opengeo.org"' +
	'	xmlns:wfs="http://www.opengis.net/wfs"' +
	'	xmlns="http://www.opengis.net/ogc"' +
	'	xmlns:gml="http://www.opengis.net/gml"' +
	'	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
	'	xsi:schemaLocation="http://www.opengis.net/wfs' +
	'                      http://schemas.opengis.net/wfs/1.1.0/wfs.xsd"' +
	'  outputFormat="json">' +
	'  <wfs:Query typeName="' + typeName + '">' +
	'    <Filter>' +
	'      <DWithin>' +
	'        <PropertyName>' + layer + '</PropertyName>' +
	'          <gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">' +
	'            <gml:coordinates>' + lon + ',' + lat + '</gml:coordinates>' +
	'          </gml:Point>' +
	'          <Distance units="' + distanceUnits + '">' + distance + '</Distance>' +
	'        </DWithin>' +
	'      </Filter>' +
	'  </wfs:Query>' +
	'</wfs:GetFeature>';

	return httpclient.post(json.wfs, xml);
/*
	db.distanceBearing();

    var template = getResource("./templates/index.html").content;
    return response.json({ name: 'some name', epsg: 4326 });
*/
};
