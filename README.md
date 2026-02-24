# SmartRecommend Lite

Shopify 个性化推荐应用，面向小商家，零风险，按效果付费。

## 产品特性

- 🎯 **个性化推荐**: 协同过滤 + 内容推荐 + 混合推荐
- 💰 **零风险**: 基础版免费，只有产生效果才收费
- ⚡ **开箱即用**: 1 分钟安装，无需配置
- 📊 **透明可追踪**: 实时看板，每个推荐、每个点击都可追踪
- 💸 **阶梯式定价**: 点击少、加购中、转化多

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite
- **前端**: React + Shopify Polaris
- **托管**: Vercel / Render
- **Shopify API**: @shopify/shopify-api

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# Shopify 配置
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_APP_URL=https://your-app-url.com
SHOPIFY_REDIRECT_URI=https://your-app-url.com/auth/callback

# 应用配置
NODE_ENV=development
PORT=3000
SESSION_SECRET=your_session_secret_here
```

### 启动开发服务器

```bash
npm run dev
```

这会同时启动后端和前端开发服务器。

### 单独启动后端

```bash
npm run dev:backend
```

### 单独启动前端

```bash
npm run dev:frontend
```

## 项目结构

```
smartrecommend-lite/
├── backend/
│   ├── config/
│   │   └── index.js          # 配置模块
│   ├── utils/
│   │   └── logger.js        # 日志工具
│   ├── services/
│   │   ├── database.js      # SQLite 数据库服务
│   │   └── recommendation.js # 推荐引擎
│   ├── server.js            # 服务器
│   └── shopify-client.js    # Shopify 客户端
├── frontend/
│   ├── package.json         # 前端配置
│   └── src/
│       └── App.jsx          # React 组件
├── data/                    # SQLite 数据库目录
├── package.json             # 项目配置
├── .env.example            # 环境变量示例
├── .gitignore              # Git 忽略
└── README.md               # 本文件
```

## 推荐算法

### 四种推荐策略

| 策略 | 权重 | 说明 |
|------|------|------|
| 协同过滤 | 40% | 基于用户行为 |
| 内容推荐 | 35% | 基于商品特征 |
| 流行度推荐 | 25% | 基于购买次数 |
| 混合推荐 | 100% | 综合最优（推荐使用） |

## 定价模式

| 事件类型 | 价格（示例） |
|---------|-------------|
| 点击 | $0.01/次 |
| 加购 | $0.05/次 |
| 转化 | 销售额的 5% |

## API 端点

### OAuth
- `GET /auth` - 开始 OAuth 流程
- `GET /auth/callback` - OAuth 回调

### 健康检查
- `GET /health` - 健康检查

## 开发

### 提交代码

```bash
git add .
git commit -m "feat: your feature description"
git push
```

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 目标用户

小商家、中长尾商家（月销售额 < $5k）

## 成功标准

收入指标 > 成本指标

## 许可证

MIT

## 联系方式

- GitHub: https://github.com/Zengai/smartrecommend-lite
