import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, TextContainer, Button, DataTable, Stack, TextField, ChoiceList, Banner } from '@shopify/polaris';
import axios from 'axios';

function Dashboard() {
  const [shop, setShop] = useState('');
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: 从 URL 或 session 获取 shop
  }, []);

  const handleLoadStats = async () => {
    if (!shop) {
      setError('请输入店铺名称');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/stats', { params: { shop } });
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRecommendations = async () => {
    if (!shop) {
      setError('请输入店铺名称');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/recommendations', { params: { shop, strategy: 'hybrid', limit: 10 } });
      if (response.data.success) {
        setRecommendations(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('加载推荐失败');
    } finally {
      setLoading(false);
    }
  };

  const statsRows = stats ? [
    ['展示', stats.byType.impression],
    ['点击', stats.byType.click],
    ['加购', stats.byType.add_to_cart],
    ['购买', stats.byType.purchase],
    ['点击率', stats.clickThroughRate],
    ['转化率', stats.conversionRate]
  ] : [];

  const recommendationRows = recommendations.map(rec => [
    rec.product?.title || rec.itemId,
    rec.strategy,
    rec.reason,
    (rec.score * 100).toFixed(1) + '%'
  ]);

  return (
    <Page title="SmartRecommend Lite">
      <Layout>
        <Layout.Section>
          {error && (
            <Banner status="critical" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          )}

          <Card>
            <TextContainer>
              <h2>店铺设置</h2>
              <Stack vertical>
                <TextField
                  label="店铺名称"
                  value={shop}
                  onChange={setShop}
                  placeholder="your-shop.myshopify.com"
                />
                <Stack>
                  <Button onClick={handleLoadStats} loading={loading}>
                    加载统计
                  </Button>
                  <Button onClick={handleLoadRecommendations} loading={loading}>
                    测试推荐
                  </Button>
                </Stack>
              </Stack>
            </TextContainer>
          </Card>

          {stats && (
            <Card title="效果统计">
              <DataTable
                columnContentTypes={['text', 'text']}
                headings={['指标', '数值']}
                rows={statsRows}
              />
            </Card>
          )}

          {recommendations.length > 0 && (
            <Card title="推荐测试">
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text']}
                headings={['商品', '策略', '原因', '分数']}
                rows={recommendationRows}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Dashboard;
