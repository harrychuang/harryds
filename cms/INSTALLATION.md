# 🎯 Strapi CMS 安裝指南

這是專為 NOEINOI Portfolio 專案設計的 Strapi CMS 安裝指南。

## 📖 三種安裝方式

根據您的需求和時間，選擇最適合的方式：

### 1️⃣ 快速安裝（推薦新手）⚡

**預計時間：15-20 分鐘**

適合：
- 想要快速看到結果
- 第一次使用 Strapi
- 只需要基本功能

👉 請參考：[`docs/quick-start.md`](./docs/quick-start.md)

### 2️⃣ 完整手動安裝（推薦學習）📚

**預計時間：30-45 分鐘**

適合：
- 想要了解 Strapi 的運作方式
- 需要自訂 Content Types
- 想要學習 Strapi 的架構

👉 請參考：[`docs/strapi-setup.md`](./docs/strapi-setup.md)

### 3️⃣ 使用備份 Schema（推薦團隊）🔄

**預計時間：10 分鐘**

適合：
- 已有現成的 schema 備份
- 團隊協作環境
- 快速部署到新環境

👉 請參考：[`docs/schema-reference.md`](./docs/schema-reference.md)

## 🚀 安裝步驟概覽

所有安裝方式都包含以下核心步驟：

```
1. 安裝依賴包 (npm install)
   ↓
2. 設置環境變數 (.env)
   ↓
3. 啟動 Strapi (npm run develop)
   ↓
4. 建立管理員帳號
   ↓
5. 建立 Content Types
   ↓
6. 設置 API 權限
   ↓
7. 匯入資料 (npm run import-data)
   ↓
8. 連接前端專案
```

## 📋 前置需求檢查

開始之前，請確保您的環境符合以下需求：

```bash
# 檢查 Node.js 版本（需要 18.x 或更高）
node --version

# 檢查 npm 版本（需要 6.x 或更高）
npm --version
```

如果版本不符，請先更新：
- [Node.js 官方下載](https://nodejs.org/)
- 推薦使用 LTS 版本

## 🎯 選擇您的安裝路徑

### 適合新手 → 快速安裝

```bash
cd cms
npm install
cp env-template.txt .env
# 編輯 .env 設置密鑰
npm run develop
# 按照指南完成後續步驟
```

👉 完整步驟：[docs/quick-start.md](./docs/quick-start.md)

### 想要深入學習 → 完整手動安裝

```bash
cd cms
npm install
# 按照詳細指南一步步設置
```

👉 完整步驟：[docs/strapi-setup.md](./docs/strapi-setup.md)

### 已有 Schema 備份 → 使用備份安裝

```bash
cd cms
npm install
# 解壓 schema 備份
tar -xzf strapi-schemas-backup.tar.gz
npm run develop
```

👉 完整步驟：[docs/schema-reference.md](./docs/schema-reference.md)

## 🔧 安裝後設置

### 連接前端專案

完成 Strapi 設置後，需要設置前端專案：

```bash
# 進入 portfolio 資料夾
cd ../portfolio

# 複製環境變數範本
cp env.example .env.local

# 編輯 .env.local
# 設置: VITE_STRAPI_URL=http://localhost:1337
```

### 驗證安裝

1. **檢查 Strapi 管理面板**
   - 訪問：http://localhost:1337/admin
   - 確認可以看到 Feed Items

2. **檢查 API**
   - 訪問：http://localhost:1337/api/feed-items?populate=*
   - 應該看到 JSON 資料

3. **檢查前端**
   ```bash
   cd portfolio
   npm run dev
   ```
   - 訪問：http://localhost:5173
   - 確認資料正確顯示

## 🆘 遇到問題？

### 常見問題速查

| 問題 | 可能原因 | 解決方案 |
|------|---------|---------|
| 無法啟動 Strapi | Port 1337 被佔用 | 修改 `.env` 中的 `PORT` |
| 匯入資料失敗 | API Token 未設置 | 檢查 `.env` 中的 `STRAPI_API_TOKEN` |
| 前端無法讀取資料 | API 權限未設置 | 檢查 Public role 的權限設置 |
| 圖片無法顯示 | URL 設置錯誤 | 檢查 `VITE_STRAPI_URL` |

### 詳細除錯指南

每個安裝指南都包含詳細的除錯步驟：
- [Quick Start 常見問題](./docs/quick-start.md#-常見問題)
- [Strapi Setup 除錯](./docs/strapi-setup.md)

### 需要更多幫助？

- 📖 [Strapi 官方文件](https://docs.strapi.io/)
- 💬 [Strapi Discord](https://discord.strapi.io/)
- 📝 [專案 Issues](../../README.md)

## 📚 相關文件

- [README.md](./README.md) - 專案概覽
- [docs/quick-start.md](./docs/quick-start.md) - 快速開始指南
- [docs/strapi-setup.md](./docs/strapi-setup.md) - 完整設置指南
- [docs/schema-reference.md](./docs/schema-reference.md) - Schema 參考文件

## ✨ 下一步

完成安裝後，您可以：

1. 📝 在 Strapi 中新增更多內容
2. 🎨 自訂前端顯示方式
3. 🚀 部署到生產環境
4. 📊 設置資料庫（PostgreSQL/MySQL）

祝您使用愉快！🎉

