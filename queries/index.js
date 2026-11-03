const bomExplosion = require('./bomExplosion.sql');
const gateEntryInward = require('./gateEntryInward.sql');
const gateEntryOutward = require('./gateEntryOutward.sql');
const pendingPurchaseOrders = require('./pendingPurchaseOrders.sql');

module.exports = {
  bomExplosion,
  gateEntryInward,
  gateEntryOutward,
  pendingPurchaseOrders,
  // Convenient aliases
  gateEntry: gateEntryInward,
  pendingPo: pendingPurchaseOrders,
};
