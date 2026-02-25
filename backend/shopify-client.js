const axios = require('axios');
const config = require('./config');

class ShopifyClient {
  constructor(shop, accessToken) {
    this.shop = shop;
    this.accessToken = accessToken;
  }

  /**
   * 使用 authorization code 获取 access_token
   * https://shopify.dev/docs/api/partner/2024-01/authentication/oauth#step-2-confirm-installation
   */
  static async getAccessToken(shop, code) {
    const url = `https://${shop}/admin/oauth/access_token`;
    
    const response = await axios.post(url, {
      client_id: config.shopify.apiKey,
      client_secret: config.shopify.apiSecret,
      code
    });
    
    return response.data;
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
