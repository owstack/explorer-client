'use strict';

var owsCommon = require('@owstack/ows-common');
var async = require('async');
var lodash = owsCommon.deps.lodash;
var $ = owsCommon.util.preconditions;

var DEFAULT_TIMEOUT= 60000; // 60s

/**
 * Query a server, using one of the given options.
 *
 * @param {Object} args
 * @param {Array} args.hosts Array of hosts to query until the first successful result.
 * @param {Array} args.path Path to request in each server.
 */
class RequestList {
  constructor(args, cb) {
    $.checkArgument(args.hosts);
    var request = args.request || require('request');

    if (!lodash.isArray(args.hosts)) {
      args.hosts = [args.hosts];
    }

    args.timeout = args.timeout || DEFAULT_TIMEOUT;

    var urls = lodash.map(args.hosts, function(x) {
      return (x + args.path);
    });
    var nextUrl, result, success;

    async.whilst(
      function() {
        nextUrl = urls.shift();
        return nextUrl && !success;
      },
      function(a_cb) {
        args.uri = nextUrl;
        request(args, function(err, res, body) {
          if (err) {
            console.log('REQUEST FAIL: ' + nextUrl + ' ERROR: ' + err);
          }

          if (res) {
            success = !!res.statusCode.toString().match(/^[1234]../);
            if (!success) {
              console.log('REQUEST FAIL: ' + nextUrl + ' STATUS CODE: ' + res.statusCode);
            }
          }

          result = [err, res, body];
          return a_cb();
        });
      },
      function(err) {
        if (err) {
          return cb(err);
        }
        return cb(result[0], result[1], result[2]);
      }
    );
  }
};

module.exports = RequestList;
