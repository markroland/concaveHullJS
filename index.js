// Requirements
var fs = require('fs');
var parse = require('csv-parse');
const ch = require('./src/concaveHull.js')
var stringify = require('csv-stringify');

// Input filepath
let input_filepath = __dirname + '/sample.csv'
let output_filepath = __dirname + '/sample-out.csv'

// Parse callback
var parser = parse({cast: true}, function (err, points) {
  let calculated_hull = ch.concaveHull.calculate(points, 3)
  console.log(calculated_hull)

  stringify(calculated_hull, {
    header: false
  }, function (err, output) {
    fs.writeFile(output_filepath, output, (err) => {
      if (err) throw err;
      console.log('The file has been saved to ' + output_filepath);
    });
  })

});

// Read CSV file
fs.createReadStream(input_filepath).pipe(parser);
