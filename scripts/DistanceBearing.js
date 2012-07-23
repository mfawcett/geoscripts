var gs = require('../lib/geoscript');

exports.distanceBearing = function (features, radius) {
	var i = 0;
	features.forEach(function (f) {
		//i = i + 1;
		var calc  = new Packages.org.geotools.referencing.GeodeticCalculator();
		calc.setStartingGeographicPoint(-122.7668, 42.4979);
		
		var p = f.geometry.centroid;
		calc.setDestinationGeographicPoint(p.x, p.y);
		
		var distance = calc.getOrthodromicDistance();
		var bearing = calc.getAzimuth();
		
		if (distance <= radius) {
			print(p);
			print("distance: " + distance);
			print("bearing: " + bearing);
			i = i + 1;
		}
	});

	print("feature count: " + i);
}
