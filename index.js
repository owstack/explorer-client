'use strict';

var Client = require('./lib/model/explorer');
Client.version = 'v' + require('./package.json').version;

module.exports = Client;
