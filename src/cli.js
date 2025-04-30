#!/usr/bin/env node
/*

Installation:

npm install csv-parse@5.6.0 csv-stringify@6.5.2 yargs@17.7.2

Usage:

node main.mjs sample.csv

*/

// Import modules
import fs from 'fs';
import { parse } from 'csv-parse';
import concaveHull from './concaveHull.js';
import { stringify } from 'csv-stringify';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse input
const argv = yargs(hideBin(process.argv)).argv;

// Input filepath
let input_filepath = null;
if (argv.file) {
  input_filepath = argv.file;
} else if (argv._[0]) {
  input_filepath = argv._[0];
} else {
  console.log('Input File required. Please specify the file path after a --file argument.');
  process.exit();
}

// Output filepath
let output_filepath;
if (argv._[1]) {
  output_filepath = argv._[1];
} else {
  output_filepath = path.join(__dirname, 'sample-out.csv');
}

// Parse callback
const parser = parse({ cast: true }, function (err, points) {
  if (err) {
    console.error('Error parsing CSV:', err);
    process.exit(1);
  }

  const hullModule = concaveHull();
  const calculated_hull = hullModule.calculate(points, 3);
  console.log(calculated_hull);

  stringify(calculated_hull, { header: false }, function (err, output) {
    if (err) {
      console.error('Error stringifying CSV:', err);
      process.exit(1);
    }

    fs.writeFile(output_filepath, output, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        process.exit(1);
      }
      console.log('The calculated hull has been saved to ' + output_filepath);
    });
  });
});

// Read CSV file
if (fs.existsSync(input_filepath)) {
  fs.createReadStream(input_filepath).pipe(parser);
} else {
  console.log('File does not exist.');
}
