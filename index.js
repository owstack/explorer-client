'use strict';

var explorerLib = {};

explorerLib.version = 'v' + require('./package.json').version;
explorerLib.Explorer = require('./lib/explorer');

module.exports = explorerLib;
