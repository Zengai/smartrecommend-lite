const database = require('./database');
const Logger = require('../utils/logger');

const logger = new Logger('TrackingService');

class TrackingService {
  constructor() {
    this.eventTypes = {
      IMPRESSION: 'impression',
      CLICK: 'click',
      ADD_TO_CART: 'add_to_cart',
      PURCHASE: 'purchase'
    };
  }

  async trackImpression(shop, data) {
    return this._trackEvent(shop, {
      ...data,
      eventType: this.eventTypes.IMPRESSION
    });
  }

  async trackClick(shop, data) {
    return this._trackEvent(shop, {
      ...data,
      eventType: this.eventTypes.CLICK
    });
  }

  async trackAddToCart(shop, data) {
    return this._trackEvent(shop, {
      ...data,
      eventType: this.eventTypes.ADD_TO_CART
    });
  }

  async trackPurchase(shop, data) {
    return this._trackEvent(shop, {
      ...data,
      eventType: this.eventTypes.PURCHASE
    });
  }

  async _trackEvent(shop, event) {
    try {
      await database.recordEvent(shop, event);
      logger.info('Event tracked', { shop, eventType: event.eventType });
      
      return {
        success: true,
        message: 'Event tracked',
        data: event
      };
    } catch (error) {
      logger.error('Failed to track event', { shop, error: error.message });
      return {
        success: false,
        message: 'Failed to track event',
        error: error.message
      };
    }
  }

  async getStats(shop, options = {}) {
    const { startDate, endDate, eventType } = options;
    
    try {
      const events = this._getEventsByShop(shop);
      let filtered = events;

      if (startDate) {
        filtered = filtered.filter(e => new Date(e.created_at) >= new Date(startDate));
      }
      
      if (endDate) {
        filtered = filtered.filter(e => new Date(e.created_at) <= new Date(endDate));
      }
      
      if (eventType) {
        filtered = filtered.filter(e => e.event_type === eventType);
      }

      const stats = {
        total: filtered.length,
        byType: {
          [this.eventTypes.IMPRESSION]: filtered.filter(e => e.event_type === this.eventTypes.IMPRESSION).length,
          [this.eventTypes.CLICK]: filtered.filter(e => e.event_type === this.eventTypes.CLICK).length,
          [this.eventTypes.ADD_TO_CART]: filtered.filter(e => e.event_type === this.eventTypes.ADD_TO_CART).length,
          [this.eventTypes.PURCHASE]: filtered.filter(e => e.event_type === this.eventTypes.PURCHASE).length
        },
        clickThroughRate: this._calculateCTR(filtered),
        conversionRate: this._calculateConversionRate(filtered)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      logger.error('Failed to get stats', { shop, error: error.message });
      return {
        success: false,
        message: 'Failed to get stats',
        error: error.message
      };
    }
  }

  _getEventsByShop(shop) {
    const stmt = database.db.prepare('SELECT * FROM events WHERE shop = ?');
    return stmt.all(shop);
  }

  _calculateCTR(events) {
    const impressions = events.filter(e => e.event_type === this.eventTypes.IMPRESSION).length;
    const clicks = events.filter(e => e.event_type === this.eventTypes.CLICK).length;
    
    if (impressions === 0) return 0;
    return (clicks / impressions * 100).toFixed(2) + '%';
  }

  _calculateConversionRate(events) {
    const clicks = events.filter(e => e.event_type === this.eventTypes.CLICK).length;
    const purchases = events.filter(e => e.event_type === this.eventTypes.PURCHASE).length;
    
    if (clicks === 0) return 0;
    return (purchases / clicks * 100).toFixed(2) + '%';
  }
}

module.exports = new TrackingService();
