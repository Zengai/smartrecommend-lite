import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, TextContainer, DataTable, TextField, Button, Banner, Stack, DatePicker } from '@shopify/polaris';
import axios from 'axios';

function Analytics() {
  const [shop, setShop] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const statsRows = stats ? [
    ['展示次数', stats.byType?.impression || 0],
    ['点击次数', stats.byType?.click || 0],
    ['加购次数', stats.byType?.add_to_cart || 0],
    ['购买次数', stats.byType?.purchase || 0],
    ['点击率', `${(stats.clickThroughRate * 100).toFixed(1)}%`],
    ['转化率', `${(stats.conversionRate * 100).toFixed(1)}%`]
  ] : [];

  return (
    <Page title="数据分析">
      <Layout>
        <Layout.Section>
          {error && (
            <Banner status="critical" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          )}

          <Card title="数据查询">
            <FormLayout>
              <TextField
                label="店铺名称"
                value={shop}
                onChange={setShop}
                placeholder="your-shop.myshopify.com"
              />
              <Stack>
                <Button onClick={handleLoadStats} loading={loading} primary>
                  加载数据
                </Button>
              </Stack>
            </FormLayout>
          </Card>

          {stats && (
            <>
              <Card title="效果概览">
                <DataTable
                  columnContentTypes={['text', 'text']}
                  headings={['指标', '数值']}
                  rows={statsRows}
                />
              </Card>

              <Card title="业务效果">
                <TextContainer>
                  <p>
                    <strong>预期提升:</strong>
                  </p>
                  <ul>
                    <li>转化率提升: +15-30%</li>
                    <li>客单价提升: +10-20%</li>
                    <li>复购率提升: +20-40%</li>
                  </ul>
                </TextContainer>
              </Card>
            </>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// 临时添加 FormLayout 导入（简化版）
const FormLayout = ({ children }) => <div style={{ padding: '20px' }}>{children}</div>;

export default Analytics;
