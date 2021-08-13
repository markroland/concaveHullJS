#!/usr/bin/env node

// Parse input
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

// Requirements
var fs = require('fs');
var parse = require('csv-parse');
const ch = require('./src/concaveHull.js')
var stringify = require('csv-stringify');

// Input filepath
let input_filepath = null
if (argv.file) {
  input_filepath = argv.file
} else if (argv._[0]) {
  input_filepath = argv._[0]
} else {
  console.log('Input File required. Please specify the file path after a --file argument.')
  process.exit();
}

// Output filepath
let output_filepath
if (argv._[1]) {
  output_filepath = argv._[1]
} else {
  output_filepath = __dirname + '/sample-out.csv'
}

// Parse callback
var parser = parse({cast: true}, function (err, points) {
  let calculated_hull = ch.concaveHull.calculate(points, 3)
  console.log(calculated_hull)

  stringify(calculated_hull, {
    header: false
  }, function (err, output) {
    fs.writeFile(output_filepath, output, (err) => {
      if (err) throw err;
      console.log('The calculated hull has been saved to ' + output_filepath);
    });
  })

});

// Read CSV file
if (fs.existsSync(input_filepath)) {
  fs.createReadStream(input_filepath).pipe(parser);
} else {
  console.log('File does not exist.')
}
