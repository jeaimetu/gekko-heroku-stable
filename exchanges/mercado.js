const MercadoBitcoin = require('mercadobitcoin-v3').MercadoBitcoin;
const MercadoBitcoinTrade = require('mercadobitcoin-v3').MercadoBitcoinTrade;

const _ = require('lodash');
const moment = require('moment');
const log = require('../core/log');
const util = require('../core/util');

const Trader = function(config) {
  _.bindAll(this);
  if(_.isObject(config)) {
    this.clientID = config.username;
    this.asset = config.asset;
    this.currency = config.currency;
    this.market = this.asset + this.currency;
    this.private = new MercadoBitcoin({
      key: config.key,
      secret: config.secret
    });
  }
  this.name = 'MercadoBitcoin';
  this.public = new MercadoBitcoin();
}

Trader.prototype.retry = function(method, args) {
  var wait = +moment.duration(10, 'seconds');
  log.debug(this.name, 'returned an error, retrying..');

  var self = this;

  // make sure the callback (and any other fn)
  // is bound to Trader
  _.each(args, function(arg, i) {
    if(_.isFunction(arg))
      args[i] = _.bind(arg, self);
  });

  // run the failed method again with the same
  // arguments after wait
  setTimeout(
    function() { method.apply(self, args) },
    wait
  );
}

Trader.prototype.getTrades = function(since, callback) {
  const args = _.toArray(arguments);
  const processTrades = function(trades) {
    if(!_.isArray(trades))
      return this.retry(this.getTrades, args);

    callback(null, trades);
  }.bind(this);

  this.public.get('trades', this.asset, processTrades);
}

Trader.getCapabilities = function () {
  return {
    name: 'Mercado',
    slug: 'mercado',
    currencies: ['BRL'],
    assets: ['BTC', 'LTC'],
    markets: [
      { pair: ['BRL', 'BTC'], minimalOrder: { amount: 5, unit: 'currency' } },
      { pair: ['BRL', 'LTC'], minimalOrder: { amount: 5, unit: 'currency' } }
    ],
    requires: ['key', 'secret', 'username'],
    tid: 'tid',
    tradable: false
  };
}

module.exports = Trader;