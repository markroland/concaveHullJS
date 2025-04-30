import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';

export default [
  // CommonJS Build
  {
    input: 'src/concaveHull.js',
    output: {
      file: 'dist/concaveHull.cjs.js',
      format: 'cjs',
      exports: 'auto'
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      terser()
    ]
  },
  // ES Module Build
  {
    input: 'src/concaveHull.js',
    output: {
      file: 'dist/concaveHull.esm.js',
      format: 'esm'
    },
    plugins: [
      resolve(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: ['@babel/preset-env'],
      }),
      terser()
    ]
  },
  // Browser (IIFE) Build
  {
    input: 'src/concaveHull.js',
    output: {
      file: 'dist/concaveHull.browser.js',
      format: 'iife',
      name: 'concaveHull'
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**'
      }),
      terser()
    ]
  }
];