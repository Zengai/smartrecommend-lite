const database = require('./database');
const Logger = require('../utils/logger');

const logger = new Logger('BillingService');

class BillingService {
  constructor() {
    this.pricing = {
      click: 0.01,      // $0.01 per click
      add_to_cart: 0.05, // $0.05 per add to cart
      purchase: 0.05     // 5% of purchase amount
    };
  }

  async calculateBill(shop, options = {}) {
    const { startDate, endDate } = options;
    
    try {
      const events = this._getEventsByShop(shop);
      let filtered = events;

      if (startDate) {
        filtered = filtered.filter(e => new Date(e.created_at) >= new Date(startDate));
      }
      
      if (endDate) {
        filtered = filtered.filter(e => new Date(e.created_at) <= new Date(endDate));
      }

      const clickEvents = filtered.filter(e => e.event_type === 'click');
      const cartEvents = filtered.filter(e => e.event_type === 'add_to_cart');
      const purchaseEvents = filtered.filter(e => e.event_type === 'purchase');

      const clickCost = clickEvents.length * this.pricing.click;
      const cartCost = cartEvents.length * this.pricing.add_to_cart;
      
      let purchaseCost = 0;
      for (const event of purchaseEvents) {
        const metadata = event.metadata ? JSON.parse(event.metadata) : {};
        const amount = metadata.amount || 0;
        purchaseCost += amount * this.pricing.purchase;
      }

      const total = clickCost + cartCost + purchaseCost;

      const bill = {
        shop,
        period: {
          start: startDate,
          end: endDate
        },
        events: {
          clicks: clickEvents.length,
          addToCarts: cartEvents.length,
          purchases: purchaseEvents.length
        },
        costs: {
          clicks: Number(clickCost.toFixed(2)),
          addToCarts: Number(cartCost.toFixed(2)),
          purchases: Number(purchaseCost.toFixed(2)),
          total: Number(total.toFixed(2))
        },
        currency: 'USD'
      };

      logger.info('Bill calculated', { shop, total: bill.costs.total });

      return {
        success: true,
        data: bill
      };
    } catch (error) {
      logger.error('Failed to calculate bill', { shop, error: error.message });
      return {
        success: false,
        message: 'Failed to calculate bill',
        error: error.message
      };
    }
  }

  async recordCharge(shop, amount, description) {
    try {
      logger.info('Recording charge', { shop, amount, description });
      
      // TODO: 集成实际的支付处理器（Stripe、PayPal等）
      // 这里只是记录，实际的支付处理需要集成支付网关
      
      return {
        success: true,
        message: 'Charge recorded',
        data: {
          shop,
          amount,
          description,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to record charge', { shop, error: error.message });
      return {
        success: false,
        message: 'Failed to record charge',
        error: error.message
      };
    }
  }

  _getEventsByShop(shop) {
    const stmt = database.db.prepare('SELECT * FROM events WHERE shop = ?');
    return stmt.all(shop);
  }
}

module.exports = new BillingService();
