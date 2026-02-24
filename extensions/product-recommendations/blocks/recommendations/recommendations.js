/**
 * SmartRecommend Lite - Product Recommendations Widget
 */

class SmartRecommendWidget {
  constructor(container) {
    this.container = container;
    this.grid = container.querySelector('.smartrecommend-grid');
    this.loading = container.querySelector('.smartrecommend-loading');
    this.content = container.querySelector('.smartrecommend-content');
    this.error = container.querySelector('.smartrecommend-error');
    
    this.productId = this.grid.dataset.productId;
    this.strategy = this.grid.dataset.strategy;
    this.limit = parseInt(this.grid.dataset.limit, 10);
    this.shop = this.grid.dataset.shop;
    
    this.appUrl = window.SmartRecommend?.appUrl || '';
    
    this.init();
  }

  async init() {
    try {
      await this.loadRecommendations();
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      this.showError();
    }
  }

  async loadRecommendations() {
    this.showLoading();

    const response = await fetch(
      `${this.appUrl}/api/recommendations?` + new URLSearchParams({
        productId: this.productId,
        strategy: this.strategy,
        limit: this.limit,
        shop: this.shop
      }),
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      this.renderRecommendations(data.data);
      await this.trackImpressions(data.data);
    } else {
      throw new Error(data.message || 'No recommendations');
    }
  }

  renderRecommendations(recommendations) {
    this.hideLoading();
    
    if (recommendations.length === 0) {
      this.showError();
      return;
    }

    this.content.innerHTML = recommendations.map(rec => `
      <div class="smartrecommend-card" data-product-id="${rec.itemId}">
        <a href="/products/${rec.itemId}" class="smartrecommend-link">
          ${rec.product?.image ? `
            <img 
              src="${rec.product.image}" 
              alt="${rec.product.title || 'Product'}"
              class="smartrecommend-image"
            />
          ` : ''}
          
          <h3 class="smartrecommend-product-title">${rec.product?.title || 'Product'}</h3>
          
          ${rec.product?.price ? `
            <div class="smartrecommend-price">${rec.product.price}</div>
          ` : ''}
          
          ${rec.reason ? `
            <div class="smartrecommend-reason">${rec.reason}</div>
          ` : ''}
        </a>
      </div>
    `).join('');

    this.content.style.display = 'grid';
    
    // 添加点击追踪
    this.addClickTracking(recommendations);
  }

  addClickTracking(recommendations) {
    recommendations.forEach(rec => {
      const card = this.content.querySelector(`[data-product-id="${rec.itemId}"]`);
      if (card) {
        card.addEventListener('click', (e) => {
          this.trackClick(rec);
        });
      }
    });
  }

  async trackImpressions(recommendations) {
    try {
      await fetch(`${this.appUrl}/api/track`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shop: this.shop,
          eventType: 'impression',
          productId: this.productId,
          recommendations: recommendations.map(r => r.itemId)
        })
      });
    } catch (error) {
      console.error('Failed to track impressions:', error);
    }
  }

  async trackClick(recommendation) {
    try {
      await fetch(`${this.appUrl}/api/track`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shop: this.shop,
          eventType: 'click',
          productId: this.productId,
          recommendedProductId: recommendation.itemId,
          strategy: recommendation.strategy,
          score: recommendation.score
        })
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  }

  showLoading() {
    this.loading.style.display = 'block';
    this.content.style.display = 'none';
    this.error.style.display = 'none';
  }

  hideLoading() {
    this.loading.style.display = 'none';
  }

  showError() {
    this.loading.style.display = 'none';
    this.content.style.display = 'none';
    this.error.style.display = 'block';
  }
}

// 初始化所有 Widget
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.smartrecommend-widget').forEach(container => {
    new SmartRecommendWidget(container);
  });
});

// 支持 Shopify Theme Editor 预览
if (window.Shopify && window.Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => {
    const container = event.target.querySelector('.smartrecommend-widget');
    if (container) {
      new SmartRecommendWidget(container);
    }
  });
}
