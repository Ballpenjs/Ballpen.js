import path from 'path';
import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import filesize from 'rollup-plugin-filesize';
import uglify from 'rollup-plugin-uglify';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

// Source and output files name
let buildDistPathFile = path.resolve(__dirname, './dist/ballpen.min.js');
let sourcePathFile = path.resolve(__dirname, './src/ballpen.js');

export default {
  	entry: sourcePathFile,
	plugins: [
		eslint(),
	    babel({
	      exclude: '../node_modules/**',
	      runtimeHelpers: true,
	    }),
	    nodeResolve({ 
	      jsnext: true, 
	      main: true 
	    }),
	    // Convert CommonJS modules to ES2015
	    commonjs(),
	    // Compress dist file
	    uglify(),
	    // Show generated file size in cli
	    filesize()
	],
	format: "umd",
    moduleName: "Ballpen",
    dest: buildDistPathFile,
    sourceMap: true
};