'use strict';

var explorerLib = {};

explorerLib.version = 'v' + require('./package.json').version;
explorerLib.Explorer = require('./lib/model/explorer');

module.exports = explorerLib;
