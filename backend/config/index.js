require('dotenv').config();

module.exports = {
  app: {
    name: 'SmartRecommend Lite',
    version: '1.0.0',
    url: process.env.SHOPIFY_APP_URL || 'http://localhost:3000',
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  shopify: {
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET,
    scopes: 'read_products,read_orders,read_customers,write_script_tags',
    apiVersion: '2024-01'
  },
  database: {
    path: './data/smartrecommend.db'
  },
  session: {
    secret: process.env.SESSION_SECRET || 'temp-secret-key-change-in-production'
  }
};
