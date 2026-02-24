class RecommendationEngine {
  constructor() {
    this.products = new Map();
    this.orders = [];
    this.customers = new Map();
    this.isTrained = false;
  }

  train(products, orders, customers) {
    this.products.clear();
    this.orders = orders;
    this.customers.clear();

    for (const product of products) {
      this.products.set(String(product.id), {
        id: String(product.id),
        title: product.title,
        productType: (product.product_type || '').toLowerCase(),
        vendor: (product.vendor || '').toLowerCase(),
        tags: this._parseTags(product.tags),
        price: parseFloat(product.variants?.[0]?.price || product.price || 0)
      });
    }

    for (const customer of customers) {
      this.customers.set(String(customer.id), customer);
    }

    this.isTrained = true;
  }

  _parseTags(tags) {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.map(t => t.toLowerCase().trim());
    if (typeof tags === 'string') {
      return tags.split(',').map(t => t.toLowerCase().trim()).filter(t => t);
    }
    return [];
  }

  getRecommendations(options = {}) {
    const { productId, strategy = 'hybrid', limit = 10, excludeItems = [] } = options;
    const excludeSet = new Set(excludeItems.map(String));

    if (!this.isTrained) {
      return this._getPopularityRecommendations(limit, excludeSet);
    }

    switch (strategy) {
      case 'content':
        return this._getContentRecommendations(productId, limit, excludeSet);
      case 'collaborative':
        return this._getCollaborativeRecommendations(limit, excludeSet);
      case 'hybrid':
      default:
        return this._getHybridRecommendations(productId, limit, excludeSet);
    }
  }

  _getPopularityRecommendations(limit, excludeSet) {
    const purchaseCounts = new Map();
    for (const order of this.orders) {
      for (const item of order.line_items || []) {
        const productId = String(item.product_id);
        if (!excludeSet.has(productId)) {
          purchaseCounts.set(productId, (purchaseCounts.get(productId) || 0) + (item.quantity || 1));
        }
      }
    }

    const maxCount = Math.max(...purchaseCounts.values(), 1);
    return Array.from(purchaseCounts.entries())
      .map(([itemId, count]) => ({
        itemId,
        score: count / maxCount,
        strategy: 'popularity',
        reason: 'Trending in your store',
        product: this.products.get(itemId)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  _getContentRecommendations(productId, limit, excludeSet) {
    const targetProduct = this.products.get(String(productId));
    if (!targetProduct) {
      return this._getPopularityRecommendations(limit, excludeSet);
    }

    const scores = new Map();
    for (const [id, product] of this.products) {
      if (id === String(productId) || excludeSet.has(id)) continue;

      let similarity = 0;
      if (targetProduct.productType === product.productType) similarity += 0.3;
      if (targetProduct.vendor === product.vendor) similarity += 0.2;
      similarity += this._tagSimilarity(targetProduct.tags, product.tags) * 0.3;
      similarity += this._priceSimilarity(targetProduct.price, product.price) * 0.2;

      scores.set(id, similarity);
    }

    return Array.from(scores.entries())
      .map(([itemId, score]) => ({
        itemId,
        score,
        strategy: 'content',
        reason: 'Similar to what you viewed',
        product: this.products.get(itemId)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  _tagSimilarity(tags1, tags2) {
    if (!tags1.length || !tags2.length) return 0;
    const set1 = new Set(tags1);
    const set2 = new Set(tags2);
    const intersection = [...set1].filter(t => set2.has(t));
    const union = new Set([...tags1, ...tags2]);
    return union.size > 0 ? intersection.length / union.size : 0;
  }

  _priceSimilarity(price1, price2) {
    const maxPrice = Math.max(price1, price2, 1);
    return Math.max(0, 1 - Math.abs(price1 - price2) / maxPrice);
  }

  _getCollaborativeRecommendations(limit, excludeSet) {
    return this._getPopularityRecommendations(limit, excludeSet).map(r => ({
      ...r,
      strategy: 'collaborative',
      reason: 'Similar users also bought'
    }));
  }

  _getHybridRecommendations(productId, limit, excludeSet) {
    const contentRecs = productId ? this._getContentRecommendations(productId, 50, excludeSet) : [];
    const popularityRecs = this._getPopularityRecommendations(50, excludeSet);

    const scores = new Map();
    for (const rec of contentRecs) {
      scores.set(rec.itemId, (scores.get(rec.itemId) || 0) + rec.score * 0.5);
    }
    for (const rec of popularityRecs) {
      scores.set(rec.itemId, (scores.get(rec.itemId) || 0) + rec.score * 0.5);
    }

    return Array.from(scores.entries())
      .map(([itemId, score]) => ({
        itemId,
        score: Math.min(score, 1),
        strategy: 'hybrid',
        reason: 'Recommended for you',
        product: this.products.get(itemId)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = new RecommendationEngine();
