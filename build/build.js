require('shelljs/global');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config.conf');
const config = require('./config.js');
const ora = require('ora');
const fs = require('fs');
const chalk = require('chalk');

var spinner = ora('building for production...');
spinner.start();

var buildDistPath = config.build.assetsRoot;

// Clear
rm('-rf', buildDistPath);
mkdir('-p', buildDistPath);

webpack(webpackConfig, function (err, stats) {
  spinner.stop();
  if (err) throw err;
  process.stdout.write(stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }) + '\n');
});