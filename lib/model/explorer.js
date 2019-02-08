'use strict';

var owsCommon = require('@owstack/ows-common');
var Errors = require('../errors');
var Http = require('./http');
var io = require('socket.io-client');
var log = require('../log');
var lodash = owsCommon.deps.lodash;
var $ = owsCommon.util.preconditions;

class Explorer {
  constructor(config, opts) {
    $.checkArgument(opts);
    $.checkArgument(opts.server);

    this.http = new Http(config, opts);
  }
};

/**
 * Return connection information.
 *
 * @return {String}
 */
Explorer.prototype.getConnectionInfo = function() {
  return 'Explorer @ ' + this.http.config.server;
};

/**
 * Retrieve a list of unspent outputs associated with an address or set of addresses.
 *
 * @param {Array} addresses
 * @return {Array}
 */
Explorer.prototype.getUtxos = async function(addresses) {
  var self = this;
  
  var url = '/addrs/utxo';
  var args = {
    addrs: lodash.uniq([].concat(addresses)).join(',')
  };

  try {
    var res = await (self.http.doPostRequest(url, args));
    return res.body;
  } catch(err) {
    log.error(err);
    throw new Errors.INTERNAL_ERROR(Errors.clean(err));
  };
};

/**
 * Broadcast a transaction to the network.
 *
 * @param {String} rawTx
 * @return {String} txid
 */
Explorer.prototype.broadcast = async function(rawTx) {
  var self = this;
  
  var url = '/tx/send';
  var args = {
    rawtx: rawTx
  };

  try {
    var res = await (self.http.doPostRequest(url, args));
    return res.body;
  } catch(err) {
    log.error(err);
    throw new Errors.INTERNAL_ERROR(Errors.clean(err));
  };
};

/**
 * Get a transaction by id.
 *
 * @param {String} txid
 * @return {Object} tx
 */
Explorer.prototype.getTransaction = async function(txid) {
  var self = this;
  
  var url = '/tx/' + txid;
  var args = {};

  try {
    var res = await (self.http.doGetRequest(url, args));
    return res.body;
  } catch(err) {
    log.error(err);
    throw new Errors.INTERNAL_ERROR(Errors.clean(err));
  };
};

/**
 * Get a list of transactions for a set of addresses.
 *
 * @param {Array} addresses
 * @param {Number} from
 * @param {Numner} to
 * @return {Object} txs, {Number} total
 */
Explorer.prototype.getTransactions = async function(addresses, from, to) {
  var self = this;
  
  var qs = [];
  var total;
  if (lodash.isNumber(from)) qs.push('from=' + from);
  if (lodash.isNumber(to)) qs.push('to=' + to);

  // Trim output
  qs.push('noAsm=1');
  qs.push('noScriptSig=1');
  qs.push('noSpent=1');

  var url = '/addrs/txs' + (qs.length > 0 ? '?' + qs.join('&') : '');
  var args = {
    addrs: lodash.uniq([].concat(addresses)).join(',')
  };
  // timeout: 120000

  try {
    var res = await (self.http.doPostRequest(url, args));

    var txs = res.body.txs;
    if (lodash.isObject(txs)) {
      if (txs.totalItems)
        total = txs.totalItems;

      if (txs.items)
        txs = txs.items;
    }

    // NOTE: When Explorer breaks communication with the full-node, it returns invalid data but no error code.
    if (!lodash.isArray(txs) || (txs.length != lodash.compact(txs).length)) {
      throw new Error('Could not retrieve transactions from blockchain. Request was:' + url + JSON.stringify(args));
    }

    return {
      txs: txs,
      total: total
    };
  } catch(err) {
    log.error(err);
    throw new Errors.INTERNAL_ERROR(Errors.clean(err));
  };
};

/**
 * Return whether or not an address has activity.
 *
 * @param {String} address
 * @return {Boolean}
 */
Explorer.prototype.getAddressActivity = async function(address) {
  var self = this;
  
  var url = '/addr/' + address;
  var args = {};

  try {
    var res = await (self.http.doGetRequest(url, args));
    var nbTxs = res.body.unconfirmedTxApperances + res.body.txApperances;
    return nbTxs > 0;
  } catch(err) {
    log.error(err);
    throw new Errors.INTERNAL_ERROR(Errors.clean(err));
  };
};

/**
 * Return a fee estimate for a number of blocks.
 *
 * @param {Number} nbBlocks
 * @return {Object} feeEstimate
 */
Explorer.prototype.estimateFee = async function(nbBlocks) {
  var self = this;
  
  var url = '/utils/estimatefee';
  if (nbBlocks) {
    url += '?nbBlocks=' + [].concat(nbBlocks).join(',');
  }
  var args = {};

  try {
    var res = await (self.http.doGetRequest(url, args));
    return res.body;
  } catch(err) {
    log.error(err);
    throw new Errors.INTERNAL_ERROR(Errors.clean(err));
  };
};

/**
 * Get current blockchain height.
 *
 * @return {Number} blockchainHeight
 */
Explorer.prototype.getBlockchainHeight = async function() {
  var self = this;
  
  var url = '/sync';
  var args = {};

  try {
    var res = await (self.http.doGetRequest(url, args));
    return res.body.blockChainHeight;
  } catch(err) {
    log.error(err);
    throw new Errors.INTERNAL_ERROR(Errors.clean(err));
  };
;

/**
 * Get a list of tx ids for a block.
 *
 * @param {String} blockHash
 * @return {Array} txs
 */
Explorer.prototype.getTxidsInBlock = async function(blockHash) {
  var self = this;
  
  var url = '/block/' + blockHash;
  var args = {};

  try {
    var res = await (self.http.doGetRequest(url, args));
    return res.body.tx;
  } catch(err) {
    log.error(err);
    throw new Errors.INTERNAL_ERROR(Errors.clean(err));
  };
};

module.exports = Explorer;
