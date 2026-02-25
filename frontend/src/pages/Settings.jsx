import React, { useState, useEffect } from 'react';
import { Page, Layout, Card, FormLayout, TextField, ChoiceList, Button, Banner, Stack } from '@shopify/polaris';
import axios from 'axios';

function Settings() {
  const [shop, setShop] = useState('');
  const [settings, setSettings] = useState({
    recommendationStrategy: 'hybrid',
    recommendationLimit: 4,
    showPrice: true,
    showVendor: false,
    widgetTitle: 'You May Also Like'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!shop) {
      setError('请输入店铺名称');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: 调用保存设置的 API
      // const response = await axios.post('/api/settings', { shop, settings });
      
      setSuccess('设置保存成功！');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="设置">
      <Layout>
        <Layout.Section>
          {success && (
            <Banner status="success" onDismiss={() => setSuccess(null)}>
              <p>{success}</p>
            </Banner>
          )}
          
          {error && (
            <Banner status="critical" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          )}

          <Card title="店铺设置">
            <FormLayout>
              <TextField
                label="店铺名称"
                value={shop}
                onChange={setShop}
                placeholder="your-shop.myshopify.com"
                helpText="输入你的 Shopify 店铺域名"
              />
            </FormLayout>
          </Card>

          <Card title="推荐设置">
            <FormLayout>
              <ChoiceList
                title="推荐策略"
                choices={[
                  { label: '混合推荐（推荐）', value: 'hybrid' },
                  { label: '协同过滤', value: 'collaborative' },
                  { label: '内容推荐', value: 'content' },
                  { label: '流行度推荐', value: 'popularity' }
                ]}
                selected={[settings.recommendationStrategy]}
                onChange={(selected) => setSettings({ ...settings, recommendationStrategy: selected[0] })}
              />
              
              <TextField
                label="推荐商品数量"
                type="number"
                value={settings.recommendationLimit.toString()}
                onChange={(value) => setSettings({ ...settings, recommendationLimit: parseInt(value) || 4 })}
                min={2}
                max={12}
                helpText="显示的推荐商品数量（2-12）"
              />
              
              <TextField
                label="推荐区域标题"
                value={settings.widgetTitle}
                onChange={(value) => setSettings({ ...settings, widgetTitle: value })}
                helpText="显示在推荐商品上方的标题"
              />
              
              <ChoiceList
                title="显示选项"
                choices={[
                  { label: '显示价格', value: 'showPrice' },
                  { label: '显示品牌', value: 'showVendor' }
                ]}
                selected={[
                  ...(settings.showPrice ? ['showPrice'] : []),
                  ...(settings.showVendor ? ['showVendor'] : [])
                ]}
                onChange={(selected) => setSettings({
                  ...settings,
                  showPrice: selected.includes('showPrice'),
                  showVendor: selected.includes('showVendor')
                })}
                allowMultiple
              />
            </FormLayout>
          </Card>

          <Card>
            <Stack distribution="trailing">
              <Button onClick={handleSave} loading={loading} primary>
                保存设置
              </Button>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Settings;
