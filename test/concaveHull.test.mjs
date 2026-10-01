import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import esm from '../dist/concaveHull.esm.js';

const cjs = createRequire(import.meta.url)('../dist/concaveHull.cjs.js');

const points = fs.readFileSync('sample.csv', 'utf8').trim().split('\n').map((l) => l.split(',').map(Number));

test('ESM and CJS builds produce the same hull', () => {
  const a = esm().calculate(points, 3);
  const b = cjs().calculate(points, 3);
  assert.ok(a.length >= 3);
  assert.deepEqual(a, b);
});

test('CLI writes the hull as CSV', () => {
  const out = '/tmp/concave-hull-test-out.csv';
  execFileSync('node', ['src/cli.js', 'sample.csv', out], { stdio: 'ignore' });
  const rows = fs.readFileSync(out, 'utf8').trim().split('\n');
  assert.deepEqual(rows.map((r) => r.split(',').map(Number)), esm().calculate(points, 3));
  fs.unlinkSync(out);
});
