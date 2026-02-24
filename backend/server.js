const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const config = require('./config');
const Logger = require('./utils/logger');
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
  const { shop, hmac, code, state } = req.query;
  
  // TODO: 验证 HMAC
  // TODO: 获取 access_token
  // TODO: 创建商家账户
  // TODO: 开始初始数据同步
  
  res.redirect('/');
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
