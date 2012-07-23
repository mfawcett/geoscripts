var gs = require('../lib/geoscript');

exports.distanceBearing = function () {
	
	// Hard-coded inputs.  These should be passed in as generically as possible
	var postgis = new gs.workspace.PostGIS({
		database:	"GeoScript_Test",
		host:		"192.168.10.140",
		port:		5432,
		schema:		"public",
		user:		"postgres",
		password:	"p0stGISAdm!n"	
	});
	//var features = postgis.get("polygons").query(new gs.filter.Filter("CONTAINS(buffer(POINT(-122.7668 42.4979), 0.01), centroid(geom))"));
//			"DWITHIN(centroid(geom), POINT(-122.7668 42.4979), 700, meters)"));
	// End hard-coded inputs
	var features = postgis.get("polygons").query();
	
	var jsonObject = [];

	var i = 0;
	features.forEach(function (f) {
		//i = i + 1;
		var calc  = new Packages.org.geotools.referencing.GeodeticCalculator();
		calc.setStartingGeographicPoint(-122.7668, 42.4979);
		
		var p = f.geometry.centroid;
		calc.setDestinationGeographicPoint(p.x, p.y);
		
		var distance = calc.getOrthodromicDistance();
		var bearing = calc.getAzimuth();
		
		if(distance <= 2500) { //2500 in meters
			print(p);
			print("distance: " + distance);
			print("bearing: " + bearing);
			i = i + 1;
		}
		
		//var bearing = calc.getAzimuth();
		//print("bearing: " + bearing);
		
		//var distance = calc.getOrthodromicDistance();
		//print("distance: " + distance);
		
		jsonObject.push({distance: distance, bearing: bearing});
	});

	print("feature count: " + i);
	postgis.close();
	
	print(JSON.stringify(jsonObject));
	
	return jsonObject;
}