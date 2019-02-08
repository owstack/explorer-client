'use strict';

var owsCommon = require('@owstack/ows-common');
var io = require('socket.io-client');
var request = require('superagent');
var RequestList = require('./request-list');
var lodash = owsCommon.deps.lodash;
var $ = owsCommon.util.preconditions;

class Explorer {
  constructor(config, opts) {
    $.checkArgument(opts);
    $.checkArgument(opts.server);

    this.hosts = config.server;
    this.userAgent = opts.userAgent || 'explorer-lib';
    this.request = opts.request || request;
  }
};

/**
 * Return connection information.
 *
 * @return {String}
 */
Explorer.prototype.getConnectionInfo = function() {
  return 'Explorer @ ' + this.hosts;
};

/**
 * Retrieve a list of unspent outputs associated with an address or set of addresses.
 *
 * @param {Array} addresses
 * @return {Array}
 */
Explorer.prototype.getUtxos = function(addresses, cb) {
  var args = {
    method: 'POST',
    path: '/addrs/utxo',
    json: {
      addrs: lodash.uniq([].concat(addresses)).join(',')
    },
  };

  this._doRequest(args, function(err, res, unspent) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));
    return cb(null, unspent);
  });
};

/**
 * Broadcast a transaction to the network.
 *
 * @param {String} rawTx
 * @return {String} txid
 */
Explorer.prototype.broadcast = function(rawTx, cb) {
  var args = {
    method: 'POST',
    path: '/tx/send',
    json: {
      rawtx: rawTx
    },
  };

  this._doRequest(args, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));
    return cb(null, body ? body.txid : null);
  });
};

/**
 * Get a transaction by id.
 *
 * @param {String} txid
 * @return {Object} tx
 */
Explorer.prototype.getTransaction = function(txid, cb) {
  var args = {
    method: 'GET',
    path: '/tx/' + txid,
    json: true,
  };

  this._doRequest(args, function(err, res, tx) {
    if (res && res.statusCode == 404) return cb();
    if (err || res.statusCode !== 200)
      return cb(_parseErr(err, res));

    return cb(null, tx);
  });
};

/**
 * Get a list of transactions for a set of addresses.
 *
 * @param {Array} addresses
 * @param {Number} from
 * @param {Numner} to
 * @return {Object} txs, {Number} total
 */
Explorer.prototype.getTransactions = function(addresses, from, to, cb) {
  var qs = [];
  var total;
  if (lodash.isNumber(from)) qs.push('from=' + from);
  if (lodash.isNumber(to)) qs.push('to=' + to);

  // Trim output
  qs.push('noAsm=1');
  qs.push('noScriptSig=1');
  qs.push('noSpent=1');

  var args = {
    method: 'POST',
    path: '/addrs/txs' + (qs.length > 0 ? '?' + qs.join('&') : ''),
    json: {
      addrs: lodash.uniq([].concat(addresses)).join(',')
    },
    timeout: 120000,
  };

  this._doRequest(args, function(err, res, txs) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));

    if (lodash.isObject(txs)) {
      if (txs.totalItems)
        total = txs.totalItems;

      if (txs.items)
        txs = txs.items;
    }

    // NOTE: When Explorer breaks communication with the full-node, it returns invalid data but no error code.
    if (!lodash.isArray(txs) || (txs.length != lodash.compact(txs).length)) {
      return cb(new Error('Could not retrieve transactions from blockchain. Request was:' + JSON.stringify(args)));
    }

    return cb(null, txs, total);
  });
};

/**
 * Return whether or not an address has activity.
 *
 * @param {String} address
 * @return {Boolean}
 */
Explorer.prototype.getAddressActivity = function(address, cb) {
  var self = this;

  var args = {
    method: 'GET',
    path: '/addr/' + address,
    json: true,
  };

  this._doRequest(args, function(err, res, result) {
    if (res && res.statusCode == 404) return cb();
    if (err || res.statusCode !== 200)
      return cb(_parseErr(err, res));

    var nbTxs = result.unconfirmedTxApperances + result.txApperances;
    return cb(null, nbTxs > 0);
  });
};

/**
 * Return a fee estimate for a number of blocks.
 *
 * @param {Number} nbBlocks
 * @return {Object} feeEstimate
 */
Explorer.prototype.estimateFee = function(nbBlocks, cb) {
  var path = '/utils/estimatefee';
  if (nbBlocks) {
    path += '?nbBlocks=' + [].concat(nbBlocks).join(',');
  }

  var args = {
    method: 'GET',
    path: path,
    json: true,
  };
  this._doRequest(args, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));
    return cb(null, body);
  });
};

/**
 * Get current blockchain height.
 *
 * @return {Number} blockchainHeight
 */
Explorer.prototype.getBlockchainHeight = function(cb) {
  var path = '/sync';

  var args = {
    method: 'GET',
    path: path,
    json: true,
  };
  this._doRequest(args, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));
    return cb(null, body.blockChainHeight);
  });
};

/**
 * Get a list of tx ids for a block.
 *
 * @param {String} blockHash
 * @return {Array} txs
 */
Explorer.prototype.getTxidsInBlock = function(blockHash, cb) {
  var self = this;

  var args = {
    method: 'GET',
    path: '/block/' + blockHash,
    json: true,
  };

  this._doRequest(args, function(err, res, body) {
    if (err || res.statusCode !== 200) return cb(_parseErr(err, res));
    return cb(null, body.tx);
  });
};

Explorer.prototype.initSocket = function() {
  // Sockets always use the first server on the pull.
  var socket = io.connect(lodash.head([].concat(this.hosts)), {
    'reconnection': true,
  });
  return socket;
};

Explorer.prototype._doRequest = function(args, cb) {
  var opts = {
    hosts: this.hosts,
    headers: {
      'User-Agent': this.userAgent,
    },
    request: this.request
  };
  new RequestList(lodash.defaults(args, opts), cb);
};

var _parseErr = function(err, res) {
  if (err) {
    return err;
  }
  return 'Error querying the blockchain: ' + res.statusCode;
};

module.exports = Explorer;
