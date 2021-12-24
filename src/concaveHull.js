/*
 * Concave Hull
 *
 * The purpose of this library is to calculate a Concave Hull from a set of points in 2D space
 *
 * It follows the algorithm defined by Adriano Moreira and Maribel Yasmina Santos in their paper
 * "CONCAVE HULL: A K-NEAREST NEIGHBOURS APPROACH FOR THE COMPUTATION OF THE REGION OCCUPIED BY A SET OF POINTS"
 * See http://repositorium.sdum.uminho.pt/bitstream/1822/6429/1/ConcaveHull_ACM_MYS.pdf.
 * Some parts of the algorithm have been adapted to more closely align with Javascript. Comments are
 * added where the deviations occur.
 *
 * With special thanks to this article from João Paulo Figueira describing his Python implementation.
 * See https://towardsdatascience.com/the-concave-hull-c649795c0f0f
 *
 * In an effort to create an all-in-one library, I have used code available online in public forums
 * from other developers. Links are provided where this code appears and I have made an effort to
 * isolate these functions and modify them as little as possible.
 *
 */
var concaveHull = function() {

  // ---
  // The Moreira and Santos Algorithm
  // ---

  /**
   * Calculate the concave hull for a list of points.
   * @param Array An array of point arrays, i.e. [[0,0], [1,1], [1,1]]
   * @param Integer k The number of neighbors to consider as perimeter points
   * @return Array The portion of the original array that defines an outer perimeter
   */
  function calculate(pointsList, k) {

    // Make sure k >= 3
    let kk = Math.max(k, 3);

    // Protect against a k-value larger than the number of points
    // Note: Not in algorithm
    if (kk >= pointsList.length) {
      return null;
    }

    // Remove equal (duplicate) points
    let dataset = CleanList(pointsList);

    // A minimum of 3 dissimilar points is required
    if (dataset.length < 3) {
      return null;
    }

    // For a 3 points dataset, the polygon is the dataset itself
    if (dataset.length == 3) {
      return dataset;
    }

    // Make sure that k neighbors can be found
    kk = Math.min(kk, dataset.length - 1);

    // Identify the point in the dataset that is lowest on the vertical Y-axis
    let firstPointId = FindMinYPoint(dataset);
    let firstPoint = dataset[firstPointId];

    // Initialize the hull with the first point
    let hull = [];
    hull.push(dataset[firstPointId]);

    // Remove the first point
    let currentPoint = firstPoint;
    dataset = RemovePoint(dataset, firstPoint);

    // Initialize previous angle
    // This deviatess from the algorithm. In this coordinate system the zero
    // angle described in the algorithm is in the negative X direction,
    // which is also equivalent to Pi radians from the positive X direction
    let previousAngle = Math.PI;

    let step = 2;

    // This is not defined in the algorithm. The algorithm uses a hard-coded value
    // of 5, presumably because 5 equals the starting step (2) plus the minimum k-value of 3
    let stop = step + kk;

    while ((!pointEquals(currentPoint, firstPoint) || step == 2) && dataset.length > 0) {

      // See note above about "stop"
      if (step == stop) {
        // Add the firstPoint again
        dataset = AddPoint(dataset, firstPoint);
      }

      // Find the nearest neighbors
      let kNearestPoints = NearestPoints(dataset, currentPoint, kk);

      // Sort the candidates (neighbours) in descending order of right-hand turn
      let cPoints = SortByAngle(kNearestPoints, currentPoint, previousAngle);

      // Select the first candidate that does not intersect any of the "hull" polygon edges
      // The algorithm's "its" variable name has been replaced with "intersects"
      let intersects = true;
      let i = 0;
      while (intersects === true && i < cPoints.length) {

        // Note: The source algorithm is NOT designed for zero-indexed arrays
        i++;

        let lastPoint;
        if (pointEquals(cPoints[i-1], firstPoint)) {
          lastPoint = 1;
        } else {
          lastPoint = 0;
        }

        // Only evaluate if the hull is 3 or more points
        let j = 2;
        intersects = false;
        while (intersects === false && j < (hull.length - lastPoint)) {

          // Note: The index values here are reduced by one compared to the algorithm
          intersects = IntersectsQ(
            [hull[step-2], cPoints[i-1]],
            [hull[step-2-j], hull[step-1-j]]
          );

          j++;
        }
      }

      // since all candidates intersect at least one edge, try again with a higher number of neighbours
      if (intersects === true) {
        return calculate(pointsList, kk+1);
      }

      // Note: Again "i" is replaced by "i-1"
      currentPoint = cPoints[i-1];

      // A valid candidate was found
      hull = AddPoint(hull, currentPoint);

      // Again, step index altered by -1
      previousAngle = Angle(hull[step-2], hull[step-1]);

      dataset = RemovePoint(dataset, currentPoint);

      step++;
    }

    // check if all the given points are inside the computed polygon
    // Note: i and conditionals adjusted from Algorithm definition
    let allInside = true;
    let i = dataset.length-1;
    while (allInside === true && i >= 0) {
      allInside = PointInPolygonQ(dataset[i], hull);
      i--;
    }

    // since at least one point is out of the computed polygon, try again with a higher number of neighbours
    if (allInside === false) {
      return calculate(pointsList, kk+1);
    }

    // A valid hull was found!
    return hull;
  }

  // ---
  // Supporting methods of the Moreira and Santos Algorithm
  // ---

  /**
   * Remove duplicate points
   * @param Array An array of point arrays, i.e. [[0,0], [1,1], [1,1]]
   * @return Array The original array with duplicates removed [[0,0], [1,1]
   */
  function CleanList(points){

    // This is calling another function so that the function signature can match
    // the algorithm and so that pre-written code can be leveraged
    return multiDimensionalUnique(points);
  }

  /**
   * Find the index of the point with the lowest Y value. Note: The index is returned
   * instead of the actual value.
   * Important Note: In this coordinate system "lowest" Y has the maximum value
   * @param Array An array of point arrays, i.e. [[0,0], [1,1], [1,1]]
   * @return Integer The position of the point with the lowest Y value in points
   */
  function FindMinYPoint(points){

    // Extract the Y coordinate in the 2nd position of each point
    let y_coordinates = arrayColumn(points, 1);

    // Find the index from the points array where the maximum value is stored
    return y_coordinates.indexOf(arrayMax(y_coordinates));
  }

  /**
   * Remove a point from an array of points.
   * @param Array An array of point arrays with unique values only (no duplicates.
   * @param Array A point array, i.e. [2,2]
   * @return Array The points array with the point removed
   */
  function RemovePoint(points, point){
    for (let i = 0; i < points.length; i++) {
      if (pointEquals(points[i], point)) {
        points.splice(i, 1);
        return points;
      }
    }
  }

  /**
   * Add a point array onto the end of the Points array
   * @param Array An array of point arrays, i.e. [[0,0], [1,1], [1,1]]
   * @param Array A point array, i.e. [2,2]
   * @return Array The updated points array
   */
  function AddPoint(points, point){
    points.push(point);
    return points;
  }

  /**
   * Return the "k" number of points nearest to "point" in "points" array
   * @param Array An array of point arrays
   * @param Array A point array, i.e. [2,2]
   * @param Integer The number (or length of array) of the points to return
   * @return Array The nearest points array
   */
  function NearestPoints(points, point, k){

    let nearest_points = [];

    // Calculate the distance between each point in "points" and the target point
    // and insert the point index and distance into a "candidates" array for sorting
    let candidates = [];
    for (let p = 0; p < points.length; p++) {
      candidates.push({
        "id": p,
        "point" : points[p],
        "distance" : distance(points[p], point)
      });
    }

    // Sort points by distance
    // See https://flaviocopes.com/how-to-sort-array-of-objects-by-property-javascript/
    candidates.sort((a, b) => (a.distance > b.distance) ? 1 : -1);

    // Set limit for results
    k = Math.min(k, candidates.length);

    // Select "k" number of nearest points
    for (let i = 0; i < k; i++) {
      nearest_points.push(candidates[i].point);
    }

    return nearest_points;
  }

  /**
   * Returns the given points sorted in descending order of angle (right-hand turn).
   * The first element of the returned list is the first candidate to be the
   * next point of the polygon.
   * @param Array An array of point arrays
   * @param Array A point array, i.e. [2,2]
   * @param Float The angle of the previous line segment in the path
   * @return Array A sorted points array
   */
  function SortByAngle(points, point, prev_angle){

    let sorted_points = [];

    // Calculate the angle between each point in "points" and the target point
    // and insert the point index and angle into a "candidates" array for sorting
    let candidates = [];
    for (let p = 0; p < points.length; p++) {
      let obj = {
        "id" : p,
        "point" : points[p],
        "angle" : prev_angle - Angle(points[p], point)
      };

      if (obj.angle < 0) {
        obj.angle = obj.angle + (2 * Math.PI);
      }

      obj.degrees = ((obj.angle) * (180/Math.PI)).toFixed(2);

      candidates.push(obj);
    }

    // Sort points by angle in descending order
    // https://flaviocopes.com/how-to-sort-array-of-objects-by-property-javascript/
    candidates.sort((a, b) => (a.angle > b.angle) ? -1 : 1);

    // Extract the points
    for (let i = 0; i < candidates.length; i++) {
      sorted_points.push(candidates[i].point);
    }

    return sorted_points;
  }

  /**
   * Returns True if the two given lines segments intersect each other,
   * and False otherwise.
   * https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
   * https://en.wikipedia.org/wiki/Line–line_intersection#Mathematics
   * @param Array An array of 2 point arrays that define the start and end of a line
   * @param Array An array of 2 point arrays that define the start and end of a line
   * @return Boolean
   */
  function IntersectsQ(lineA, lineB){

    // This is calling another function so that the function signature can match
    // the algorithm and so that pre-written code can be leveraged
    let intersection_point = getLineLineCollision(
      {"x": lineA[0][0], "y": lineA[0][1]},
      {"x": lineA[1][0], "y": lineA[1][1]},
      {"x": lineB[0][0], "y": lineB[0][1]},
      {"x": lineB[1][0], "y": lineB[1][1]}
    );
    if (intersection_point !== false) {
      return true;
    }
    return false;
  }

  /**
   * Returns True if the given point is inside the polygon defined
   * by the given points, and False otherwise.
   * https://en.wikipedia.org/wiki/Point_in_polygon
   * @param Array A point array, i.e. [2,2]
   * @param Array An array of point arrays
   * @return Boolean
   */
  function PointInPolygonQ(point, points){

    // This is calling another function so that the function signature can match
    // the algorithm and so that pre-written code can be leveraged
    return pointInPolygonNested(point, points);
  }

  /**
   * Calculate the angle between two points. The angle is measured between the
   * line formed from point B to point A and the line from point A extending
   * into the negative X direction (left). This is done to match the algorithm.
   * @param Array A point array. The starting point.
   * @param Array A point array. The ending point.
   * @return Float The angle in Radians
   */
  function Angle(pointA, pointB) {

    let angle = Math.atan2(pointB[1] - pointA[1], pointB[0] - pointA[0]);

    // Measure angle from left-side of the Y-axis
    angle = Math.PI - angle;

    // Force between 0 and 2-Pi
    if (angle < 0) {
      angle = angle + (2 * Math.PI);
    }

    return angle;
  }

  // ---
  // Helper functions.
  // These are not defined as part of the Moreira and Santos Algorithm,
  // but are required to support it.
  // ---

  /**
   * Extract a column from a 2D array
   * @param Array The soure array
   * @param String The name of the column to extract
   * @return Array A single-dimensional array containing column values
   */
  function arrayColumn(arr, n){
    return arr.map(a => a[n]);
  }

  /**
   * Get the maximum value from an array of numbers
   * @param Array The soure array
   * @return Integer The maximum value
   */
  function arrayMax(a) {
    return Math.max(...a);
  }

  /**
   * Determine if two point arrays are equivalent
   * @param Array A point array containing two values for x and y
   * @param Array A point array containing two values for x and y
   * @return Boolean True if the same, false otherwise
   */
  function pointEquals(a, b) {
    if (a[0] === b[0] && a[1] === b[1]) {
      return true;
    }
    return false;
  }

  /**
   * Calculate the distance between two points
   * @param Array A point array containing two values for x and y
   * @param Array A point array containing two values for x and y
   * @return Float The calculated distance
   */
  function distance(p1, p2) {
    return Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
  }

  /**
   * Remove duplicate elements of a multidimensional array
   * From https://stackoverflow.com/a/20339709
   * @param Array A multidimensional array
   * @return Array The original array with duplicates removed
   */
  function multiDimensionalUnique(arr) {
    var uniques = [];
    var itemsFound = {};
    for(var i = 0, l = arr.length; i < l; i++) {
      var stringified = JSON.stringify(arr[i]);
      if(itemsFound[stringified]) { continue; }
      uniques.push(arr[i]);
      itemsFound[stringified] = true;
    }
    return uniques;
  }

  /**
   * Calculate if and where two finite line segments intersect
   * From https://stackoverflow.com/a/30159167
   * @param Array A point array containing two values for x and y. Start Point of Line A
   * @param Array A point array containing two values for x and y. End Point of Line A
   * @param Array A point array containing two values for x and y. Start Point of Line B
   * @param Array A point array containing two values for x and y. End Point of Line B
   * @return Boolean True if the lines intersect, false otherwise
   */
  function getLineLineCollision(p0, p1, p2, p3) {

    var s1, s2;
    s1 = {x: p1.x - p0.x, y: p1.y - p0.y};
    s2 = {x: p3.x - p2.x, y: p3.y - p2.y};

    var s10_x = p1.x - p0.x;
    var s10_y = p1.y - p0.y;
    var s32_x = p3.x - p2.x;
    var s32_y = p3.y - p2.y;

    var denom = s10_x * s32_y - s32_x * s10_y;

    if(denom === 0) {
        return false;
    }

    var denom_positive = denom > 0;

    var s02_x = p0.x - p2.x;
    var s02_y = p0.y - p2.y;

    var s_numer = s10_x * s02_y - s10_y * s02_x;

    if((s_numer < 0) == denom_positive) {
        return false;
    }

    var t_numer = s32_x * s02_y - s32_y * s02_x;

    if((t_numer < 0) == denom_positive) {
        return false;
    }

    if((s_numer > denom) == denom_positive || (t_numer > denom) == denom_positive) {
        return false;
    }

    var t = t_numer / denom;

    var p = {x: p0.x + (t * s10_x), y: p0.y + (t * s10_y)};
    return p;
  }

  /**
   * Returns True if the given point is inside the polygon
   * From https://github.com/substack/point-in-polygon
   * https://github.com/substack/point-in-polygon/blob/master/nested.js
   * @param Array A point array, i.e. [2,2]
   * @param Array An array of point arrays
   * @param Integer Start position
   * @param Integer Stop position
   * @return Boolean
   */
  function pointInPolygonNested (point, vs, start, end) {
    var x = point[0], y = point[1];
    var inside = false;
    if (start === undefined) start = 0;
    if (end === undefined) end = vs.length;
    var len = end - start;
    for (var i = 0, j = len - 1; i < len; j = i++) {
        var xi = vs[i+start][0], yi = vs[i+start][1];
        var xj = vs[j+start][0], yj = vs[j+start][1];
        var intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
  }

  // ---
  // Expose private functions publicly
  // ---
  return {
    calculate: calculate
  };
}();

// NodeJS CLI Support
if (typeof exports === "object") {
  module.exports = { concaveHull };
}