const axios = require('axios');
const config = require('./config');

class ShopifyClient {
  constructor(shop, accessToken) {
    this.shop = shop;
    this.accessToken = accessToken;
  }

  async request(path, options = {}) {
    const url = `https://${this.shop}/admin/api/${config.shopify.apiVersion}${path}`;
    
    const response = await axios(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
        ...options.headers
      }
    });
    
    return response.data;
  }

  async getProducts(limit = 250) {
    return this.request(`/products.json?limit=${limit}`);
  }

  async getOrders(limit = 250) {
    return this.request(`/orders.json?limit=${limit}&status=any`);
  }

  async getCustomers(limit = 250) {
    return this.request(`/customers.json?limit=${limit}`);
  }
}

module.exports = ShopifyClient;
