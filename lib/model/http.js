'use strict';

var owsCommon = require('@owstack/ows-common');
var Errors = require('../errors');
var JSUtil = owsCommon.util.js;
var Log = require('../common/log');
var Package = require('../../package.json');
var request = require('superagent');
var util = require('util');
var lodash = owsCommon.deps.lodash;
var $ = require('preconditions').singleton();

class Http {
  constructor(config, opts) {
    $.checkArgument(config.server);

    opts = opts || {};
    this.request = opts.request || request;
    this.timeout = opts.timeout || 3000;

    JSUtil.defineImmutable(this, {
      config: config,
      log: new Log(opts.log)
    });
  }
};

/**
 * Do a GET request
 *
 * @param {String} url
 */
Http.prototype.doGetRequest = function(url) {
  var self = this;
  url += url.indexOf('?') > 0 ? '&' : '?';
  url += 'r=' + lodash.random(10000, 99999);
  return self._doRequest('get', url, {});
};

/**
 * Do a POST request
 *
 * @param {String} url
 * @param {Object} args
 */
Http.prototype.doPostRequest = function(url, args) {
  return this._doRequest('post', url, args);
};

/**
 * Do a PUT request
 *
 * @param {String} url
 * @param {Object} args
 */
Http.prototype.doPutRequest = function(url, args) {
  return this._doRequest('put', url, args);
};

/**
 * Do a DELETE request
 *
 * @param {String} url
 */
Http.prototype.doDeleteRequest = function(url) {
  return this._doRequest('delete', url, {});
};

/**
 * Return request headers.
 * @private
 */
Http.prototype._getHeaders = function() {
  var headers = {
    'x-client-version': Package.version
  };
  return headers;
};

/**
 * Do an HTTP request
 * @private
 *
 * @param {Object} method
 * @param {String} url
 * @param {Object} args
 */
Http.prototype._doRequest = function(method, url, args) {
  var self = this;

  return new Promise(function(resolve, reject) {
    var headers = self._getHeaders();

    var r = self.request[method](self.config.server + url);
    r.accept('json');

    lodash.each(headers, function(v, k) {
      if (v) {
        r.set(k, v);
      }
    });

    if (args) {
      if (method == 'post' || method == 'put') {
        r.send(args);
      } else {
        r.query(args);
      }
    }

    r.timeout(self.timeout);

    r.end(function(err, res) {
      if (!res) {
        return reject(new Errors.CONNECTION_ERROR);
      }

      if (res.body) {
        self.log.debug(util.inspect(res.body, {
          depth: 10
        }));
      }

      if (!lodash.inRange(res.status, 199, 300)) {
        if (res.status === 404) {
          return reject(new Errors.NOT_FOUND);
        }

        if (res.status === 401) {
          return reject(new Errors.UNAUTHORIZED);
        }

        if (lodash.inRange(res.status, 499, 600)) {
          return reject(new Errors.INTERNAL_ERROR(res.statusText));
        }

        if (!res.status) {
          return reject(new Errors.CONNECTION_ERROR);
        }

        self.log.error('HTTP Error: ' + res.status + ' ' + res.req.method + ' ' + (res.req.url || res.req.path)  + (res.body ? (' - ' + res.body.error || res.body.errors && res.body.errors[0]) : ''));

        if (!res.body || lodash.isEmpty(res.body)) {
          return reject(new Error(err.message));
        }

        return reject(Http._parseError(res.body));
      }

      if (res.body === '{"error":"read ECONNRESET"}') {
        return reject(new Errors.ECONNRESET_ERROR(JSON.parse(res.body)));
      }

      return resolve({
        body: res.body,
        header: res.header
      });
    });
  });
};

/**
 * Parse errors
 * @private
 *
 * @param {Object} body
 */
Http._parseError = function(body) {
  if (!body) {
    return;
  }

  if (lodash.isString(body)) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {
        error: body
      };
    }
  }

  var ret;

  if (body.code) {
    if (Errors[body.code]) {
      ret = new Errors[body.code];
      if (body.message) ret.message = body.message;
    } else {
      ret = new Error(body.code + ': ' + body.message);
    }
  } else {
    ret = new Error(body.error || (body.errors && body.errors[0]) || JSON.stringify(body));
  }

  return ret;
};

module.exports = Http;
