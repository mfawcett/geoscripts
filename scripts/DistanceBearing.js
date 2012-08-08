var gs = require('../lib/geoscript');

exports.distanceBearing = function (params, features) {

	var jsonObject = [];
	var featureCount = 0;

	features.forEach(function (f) {
		var calc  = new Packages.org.geotools.referencing.GeodeticCalculator();
		calc.setStartingGeographicPoint(params.x, params.y);

		var p = f.geometry.centroid;
		calc.setDestinationGeographicPoint(p.x, p.y);
		
		var distance = calc.getOrthodromicDistance();
		var bearing = calc.getAzimuth();
		
		if (distance <= params.radius) {
			print(p);
			print(" - distance: " + distance);
			print(" - bearing: " + bearing);
			
			//If the feature is inside the radius, add it to the jsonObject
			jsonObject.push({endPoint: {x: p.x, y: p.y}, distance: distance, bearing: bearing});
			featureCount++;
		}
	});

	print("Feature count: " + featureCount + " / " + features.length);
	
	return jsonObject;
}
