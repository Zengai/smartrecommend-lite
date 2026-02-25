import React, { useState } from 'react';
import { Page, Layout, Navigation, Frame } from '@shopify/polaris';
import { HomeMajor, AnalyticsMajor, SettingsMajor } from '@shopify/polaris-icons';
import Dashboard from './Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  const [selected, setSelected] = useState('dashboard');

  const navigationItems = [
    {
      label: '仪表盘',
      icon: HomeMajor,
      selected: selected === 'dashboard',
      onClick: () => setSelected('dashboard'),
    },
    {
      label: '数据分析',
      icon: AnalyticsMajor,
      selected: selected === 'analytics',
      onClick: () => setSelected('analytics'),
    },
    {
      label: '设置',
      icon: SettingsMajor,
      selected: selected === 'settings',
      onClick: () => setSelected('settings'),
    },
  ];

  const renderContent = () => {
    switch (selected) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Frame
      navigation={<Navigation location="/" items={navigationItems} />}
    >
      {renderContent()}
    </Frame>
  );
}

export default App;
