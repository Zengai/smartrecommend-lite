const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const config = require('./config');
const Logger = require('./utils/logger');
const SecurityUtils = require('./utils/security');
const ShopifyClient = require('./shopify-client');
const database = require('./services/database');
const recommendation = require('./services/recommendation');
const syncService = require('./services/sync');
const trackingService = require('./services/tracking');
const billingService = require('./services/billing');

const logger = new Logger('Server');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/auth', (req, res) => {
  const { shop } = req.query;
  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  const state = crypto.randomBytes(16).toString('hex');
  const installUrl = `https://${shop}/admin/oauth/authorize?` + new URLSearchParams({
    client_id: config.shopify.apiKey,
    scope: config.shopify.scopes,
    redirect_uri: `${config.app.url}/auth/callback`,
    state
  });

  res.redirect(installUrl);
});

app.get('/auth/callback', async (req, res) => {
  const logger = new Logger('OAuth');
  const { shop, hmac, code, state } = req.query;
  
  try {
    // 1. 验证必要参数
    if (!shop || !hmac || !code) {
      logger.error('Missing required parameters', { shop: !!shop, hmac: !!hmac, code: !!code });
      return res.status(400).send('Missing required parameters');
    }

    // 2. 验证 Shopify 店铺域名
    if (!SecurityUtils.validateShop(shop)) {
      logger.error('Invalid shop domain', { shop });
      return res.status(400).send('Invalid shop domain');
    }

    // 3. 验证 HMAC
    try {
      const isValidHmac = SecurityUtils.verifyHMAC(req.query);
      if (!isValidHmac) {
        logger.error('Invalid HMAC', { shop });
        return res.status(400).send('Invalid HMAC');
      }
    } catch (e) {
      logger.error('HMAC verification failed', { shop, error: e.message });
      return res.status(400).send('HMAC verification failed');
    }

    logger.info('HMAC verified successfully', { shop });

    // 4. 获取 access_token
    logger.info('Exchanging code for access_token', { shop });
    let tokenData;
    try {
      tokenData = await ShopifyClient.getAccessToken(shop, code);
      logger.success('Access token obtained', { shop });
    } catch (e) {
      logger.error('Failed to get access_token', { shop, error: e.message });
      return res.status(500).send('Failed to get access token');
    }

    // 5. 创建或更新商家账户
    const merchantId = SecurityUtils.generateUUID();
    const merchantData = {
      id: merchantId,
      shop: shop,
      accessToken: tokenData.access_token,
      isActive: true
    };

    try {
      database.createMerchant(merchantData);
      logger.success('Merchant account created/updated', { shop, merchantId });
    } catch (e) {
      logger.error('Failed to create merchant', { shop, error: e.message });
      return res.status(500).send('Failed to create merchant account');
    }

    // 6. TODO: 开始初始数据同步（后台异步）
    // syncService.syncAll(shop, tokenData.access_token).catch(e => {
    //   logger.error('Initial sync failed', { shop, error: e.message });
    // });

    logger.success('OAuth flow completed', { shop });

    // 重定向到商家后台
    res.redirect('/?shop=' + encodeURIComponent(shop));
    
  } catch (error) {
    logger.error('OAuth callback error', { shop: shop || 'unknown', error: error.message });
    res.status(500).send('OAuth error');
  }
});

// 数据同步 API
app.post('/api/sync', async (req, res) => {
  const { shop, accessToken } = req.body;
  
  if (!shop || !accessToken) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  const result = await syncService.syncAll(shop, accessToken);
  res.json(result);
});

// 推荐 API
app.get('/api/recommendations', (req, res) => {
  const { shop, productId, strategy = 'hybrid', limit = 10, excludeItems = '' } = req.query;
  
  if (!shop) {
    return res.status(400).json({ success: false, message: 'Missing shop parameter' });
  }

  const recommendations = recommendation.getRecommendations({
    productId,
    strategy,
    limit: parseInt(limit, 10),
    excludeItems: excludeItems ? excludeItems.split(',') : []
  });

  res.json({ success: true, data: recommendations });
});

// 效果追踪 API
app.post('/api/track', async (req, res) => {
  const { shop, eventType, ...data } = req.body;
  
  if (!shop || !eventType) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let result;
  switch (eventType) {
    case 'impression':
      result = await trackingService.trackImpression(shop, data);
      break;
    case 'click':
      result = await trackingService.trackClick(shop, data);
      break;
    case 'add_to_cart':
      result = await trackingService.trackAddToCart(shop, data);
      break;
    case 'purchase':
      result = await trackingService.trackPurchase(shop, data);
      break;
    default:
      return res.status(400).json({ success: false, message: 'Invalid event type' });
  }

  res.json(result);
});

app.get('/api/stats', async (req, res) => {
  const { shop, startDate, endDate, eventType } = req.query;
  
  if (!shop) {
    return res.status(400).json({ success: false, message: 'Missing shop parameter' });
  }

  const result = await trackingService.getStats(shop, { startDate, endDate, eventType });
  res.json(result);
});

// 计费 API
app.get('/api/billing', async (req, res) => {
  const { shop, startDate, endDate } = req.query;
  
  if (!shop) {
    return res.status(400).json({ success: false, message: 'Missing shop parameter' });
  }

  const result = await billingService.calculateBill(shop, { startDate, endDate });
  res.json(result);
});

app.post('/api/billing/charge', async (req, res) => {
  const { shop, amount, description } = req.body;
  
  if (!shop || !amount) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  const result = await billingService.recordCharge(shop, amount, description);
  res.json(result);
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(config.app.port, () => {
  logger.success(`Server running on port ${config.app.port}`);
});
