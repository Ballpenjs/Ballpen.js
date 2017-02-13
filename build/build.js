require('shelljs/global');
const ora = require('ora');
const path = require('path');
const fs = require('fs');
const rollup = require('rollup');
const chalk = require('chalk');
const babel = require('rollup-plugin-babel');
const eslint = require('rollup-plugin-eslint');
const filesize = require('rollup-plugin-filesize');
const uglify = require('rollup-plugin-uglify');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

if (require.main === module) {
	var spinner = ora('building for production...');
	spinner.start();
} else {
	console.error(chalk.red("[Ballpen Build Error] You should run this script in a cli like environment!"));
	return;
}

var buildDistPath = path.resolve(__dirname, '../dist');

var buildDistPathFile = path.resolve(__dirname, '../dist/ballpen.min.js');
var sourcePathFile = path.resolve(__dirname, '../src/ballpen.js');

// Clear
rm('-rf', buildDistPath);
mkdir('-p', buildDistPath);


rollup.rollup({

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
    ]

}).then(function (bundle) {

    bundle.write({
        format: "umd",
        moduleName: "Ballpen",
        dest: buildDistPathFile,
        sourceMap: true
    });

    spinner.stop();

}).catch(function(err) {
	console.error(chalk.red(err));

	spinner.stop();
});
