const ShopifyClient = require('../shopify-client');
const database = require('./database');
const recommendation = require('./recommendation');
const Logger = require('../utils/logger');

const logger = new Logger('SyncService');

class SyncService {
  constructor() {
    this.isSyncing = false;
  }

  async syncAll(shop, accessToken) {
    if (this.isSyncing) {
      logger.warn('Sync already in progress, skipping', { shop });
      return { success: false, message: 'Sync already in progress' };
    }

    this.isSyncing = true;
    logger.info('Starting full sync', { shop });

    try {
      const client = new ShopifyClient(shop, accessToken);

      // 同步商品
      logger.info('Syncing products...', { shop });
      const productsResult = await client.getProducts(250);
      const products = productsResult.products || [];
      
      for (const product of products) {
        await database.upsertProduct(shop, product);
      }
      logger.success('Products synced', { shop, count: products.length });

      // 同步订单
      logger.info('Syncing orders...', { shop });
      const ordersResult = await client.getOrders(250);
      const orders = ordersResult.orders || [];
      
      for (const order of orders) {
        await database.upsertOrder(shop, order);
      }
      logger.success('Orders synced', { shop, count: orders.length });

      // 同步客户
      logger.info('Syncing customers...', { shop });
      const customersResult = await client.getCustomers(250);
      const customers = customersResult.customers || [];
      
      for (const customer of customers) {
        await database.upsertCustomer(shop, customer);
      }
      logger.success('Customers synced', { shop, count: customers.length });

      // 训练推荐引擎
      logger.info('Training recommendation engine...', { shop });
      const dbProducts = database.getProductsForTraining(shop);
      const dbOrders = database.getOrdersForTraining(shop);
      const dbCustomers = database.getCustomersForTraining(shop);
      
      recommendation.train(dbProducts, dbOrders, dbCustomers);
      logger.success('Recommendation engine trained', { shop });

      this.isSyncing = false;
      logger.success('Full sync completed', { shop });

      return {
        success: true,
        message: 'Sync completed',
        data: {
          products: products.length,
          orders: orders.length,
          customers: customers.length
        }
      };
    } catch (error) {
      this.isSyncing = false;
      logger.error('Sync failed', { shop, error: error.message });
      return {
        success: false,
        message: 'Sync failed',
        error: error.message
      };
    }
  }

  async syncOrdersIncremental(shop, accessToken, sinceId = null) {
    logger.info('Starting incremental orders sync', { shop, sinceId });

    try {
      const client = new ShopifyClient(shop, accessToken);
      let path = '/orders.json?limit=250&status=any';
      
      if (sinceId) {
        path += `&since_id=${sinceId}`;
      }

      const result = await client.request(path);
      const orders = result.orders || [];

      for (const order of orders) {
        await database.upsertOrder(shop, order);
      }

      logger.success('Incremental orders sync completed', { shop, count: orders.length });

      return {
        success: true,
        message: 'Incremental sync completed',
        data: {
          orders: orders.length,
          lastOrderId: orders.length > 0 ? orders[orders.length - 1].id : sinceId
        }
      };
    } catch (error) {
      logger.error('Incremental sync failed', { shop, error: error.message });
      return {
        success: false,
        message: 'Incremental sync failed',
        error: error.message
      };
    }
  }
}

module.exports = new SyncService();
