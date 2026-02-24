const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const config = require('./config');
const Logger = require('./utils/logger');
const ShopifyClient = require('./shopify-client');

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

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(config.app.port, () => {
  logger.success(`Server running on port ${config.app.port}`);
});
