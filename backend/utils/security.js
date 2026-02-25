/**
 * 安全工具模块
 * HMAC 验证、随机字符串生成等
 */

const crypto = require('crypto');
const config = require('../config');

class SecurityUtils {
  /**
   * 验证 Shopify HMAC
   * https://shopify.dev/docs/api/partner/2024-01/authentication/oauth#verify-the-hmac-signature
   */
  static verifyHMAC(query, apiSecret = config.shopify.apiSecret) {
    const { hmac, signature, ...params } = query;
    
    // 按字母顺序排序参数
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // 计算 HMAC
    const calculatedHmac = crypto
      .createHmac('sha256', apiSecret)
      .update(sortedParams)
      .digest('hex');
    
    // 对比（使用时间安全的比较）
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac, 'hex'),
      Buffer.from(hmac || signature, 'hex')
    );
  }

  /**
   * 验证 Shopify 店铺域名
   */
  static validateShop(shop) {
    if (!shop) return false;
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    return shopRegex.test(shop);
  }

  /**
   * 生成随机字符串
   */
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成 UUID
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = crypto.randomBytes(1)[0] % 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 生成 HMAC 哈希
   */
  static generateHMAC(data, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }
}

module.exports = SecurityUtils;
