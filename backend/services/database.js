const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');
const Logger = require('../utils/logger');

const logger = new Logger('Database');
const dbPath = path.join(__dirname, '../../data', path.basename(config.database.path));

class DatabaseService {
  constructor() {
    this.db = new Database(dbPath);
    this._initTables();
  }

  _initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS merchants (
        id TEXT PRIMARY KEY,
        shop TEXT UNIQUE NOT NULL,
        access_token TEXT,
        is_active BOOLEAN DEFAULT true,
        installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        shop TEXT NOT NULL,
        title TEXT,
        product_type TEXT,
        vendor TEXT,
        tags TEXT,
        price REAL,
        raw_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY,
        shop TEXT NOT NULL,
        customer_id INTEGER,
        total_price REAL,
        raw_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY,
        shop TEXT NOT NULL,
        email TEXT,
        raw_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop TEXT NOT NULL,
        event_type TEXT NOT NULL,
        product_id TEXT,
        visitor_id TEXT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop);
      CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop);
      CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop);
      CREATE INDEX IF NOT EXISTS idx_events_shop ON events(shop);
    `);
    
    logger.success('Database initialized');
  }

  // 商家操作
  createMerchant(data) {
    const stmt = this.db.prepare(`
      INSERT INTO merchants (id, shop, access_token, is_active)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(shop) DO UPDATE SET
        access_token = excluded.access_token,
        is_active = excluded.is_active,
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(data.id, data.shop, data.accessToken, data.isActive !== false);
  }

  getMerchantByShop(shop) {
    const stmt = this.db.prepare('SELECT * FROM merchants WHERE shop = ?');
    return stmt.get(shop);
  }

  // 商品操作
  upsertProduct(shop, product) {
    const stmt = this.db.prepare(`
      INSERT INTO products (id, shop, title, product_type, vendor, tags, price, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        product_type = excluded.product_type,
        vendor = excluded.vendor,
        tags = excluded.tags,
        price = excluded.price,
        raw_data = excluded.raw_data,
        updated_at = CURRENT_TIMESTAMP
    `);
    return stmt.run(
      product.id,
      shop,
      product.title,
      product.product_type,
      product.vendor,
      Array.isArray(product.tags) ? product.tags.join(',') : product.tags,
      parseFloat(product.variants?.[0]?.price || product.price || 0),
      JSON.stringify(product)
    );
  }

  getProducts(shop, limit = 250) {
    const stmt = this.db.prepare('SELECT * FROM products WHERE shop = ? LIMIT ?');
    return stmt.all(shop, limit);
  }

  // 订单操作
  upsertOrder(shop, order) {
    const stmt = this.db.prepare(`
      INSERT INTO orders (id, shop, customer_id, total_price, raw_data)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        customer_id = excluded.customer_id,
        total_price = excluded.total_price,
        raw_data = excluded.raw_data
    `);
    return stmt.run(
      order.id,
      shop,
      order.customer?.id || order.customer_id,
      parseFloat(order.total_price || 0),
      JSON.stringify(order)
    );
  }

  getOrders(shop, limit = 250) {
    const stmt = this.db.prepare('SELECT * FROM orders WHERE shop = ? LIMIT ?');
    return stmt.all(shop, limit);
  }

  // 客户操作
  upsertCustomer(shop, customer) {
    const stmt = this.db.prepare(`
      INSERT INTO customers (id, shop, email, raw_data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        raw_data = excluded.raw_data
    `);
    return stmt.run(
      customer.id,
      shop,
      customer.email,
      JSON.stringify(customer)
    );
  }

  getCustomers(shop, limit = 250) {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE shop = ? LIMIT ?');
    return stmt.all(shop, limit);
  }

  // 事件操作
  recordEvent(shop, event) {
    const stmt = this.db.prepare(`
      INSERT INTO events (shop, event_type, product_id, visitor_id, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      shop,
      event.eventType,
      event.productId,
      event.visitorId,
      event.metadata ? JSON.stringify(event.metadata) : null
    );
  }
}

module.exports = new DatabaseService();
