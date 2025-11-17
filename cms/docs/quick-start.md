# 🚀 快速開始指南

這個指南將帶你快速完成從零到完整設置 Strapi CMS 並匯入資料的所有步驟。

## 📋 前置需求

- Node.js 18.x 或更高版本
- npm 6.x 或更高版本

## 🔧 步驟 1: 安裝 Strapi

```bash
cd cms
npm install
```

安裝過程可能需要幾分鐘，請耐心等待。

## 🔑 步驟 2: 設置環境變數

建立 `.env` 檔案：

```bash
# 複製範例檔案
cp .env.example .env
```

生成隨機密鑰：

```bash
# macOS / Linux
node -e "console.log('APP_KEYS=' + require('crypto').randomBytes(32).toString('base64') + ',' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('API_TOKEN_SALT=' + require('crypto').randomBytes(16).toString('base64'))"
node -e "console.log('ADMIN_JWT_SECRET=' + require('crypto').randomBytes(16).toString('base64'))"
node -e "console.log('TRANSFER_TOKEN_SALT=' + require('crypto').randomBytes(16).toString('base64'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(16).toString('base64'))"
```

將生成的密鑰複製到 `.env` 檔案中對應的位置。

`.env` 檔案範例：

```env
HOST=0.0.0.0
PORT=1337

APP_KEYS=your_generated_key_1,your_generated_key_2
API_TOKEN_SALT=your_generated_salt
ADMIN_JWT_SECRET=your_generated_secret
TRANSFER_TOKEN_SALT=your_generated_salt
JWT_SECRET=your_generated_secret

DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

## 🚀 步驟 3: 啟動 Strapi

```bash
npm run develop
```

首次啟動會：
1. 建立資料庫
2. 自動在瀏覽器中開啟管理面板 (http://localhost:1337/admin)

## 👤 步驟 4: 建立管理員帳號

在開啟的管理面板中：

1. 填寫您的資訊：
   - First name
   - Last name
   - Email
   - Password (至少 8 個字元)

2. 點擊 **Let's start**

## 📦 步驟 5: 建立 Content Types

這是最重要的步驟！請按照以下兩種方式之一進行：

### 方式 A: 手動建立（推薦用於學習）

詳細請參考 [`strapi-setup.md`](./strapi-setup.md)，其中包含完整的圖文步驟。

**建立順序：**
1. 先建立所有 Components（feed 和 project 類別）
2. 再建立 Feed Item Collection Type

### 方式 B: 使用 Schema JSON（快速）

如果您已有 schema JSON 檔案：

1. 將 schema 檔案放到 `src/api/feed-item/content-types/feed-item/schema.json`
2. 重新啟動 Strapi：按 `Ctrl+C` 停止，然後再執行 `npm run develop`

## 🔓 步驟 6: 設置 API 權限

1. 在管理面板中，進入 **Settings** (左下角齒輪圖示)
2. 點擊 **Users & Permissions plugin** → **Roles**
3. 點擊 **Public** role
4. 找到 **Feed-item** 區塊
5. 勾選：
   - ✅ `find`
   - ✅ `findOne`
6. 點擊右上角的 **Save** 按鈕

## 🔑 步驟 7: 建立 API Token（用於資料匯入）

1. 進入 **Settings** → **API Tokens**
2. 點擊 **Create new API Token**
3. 設定：
   - **Name**: `Import Script`
   - **Token duration**: `Unlimited` （或選擇適當的期限）
   - **Token type**: `Full access`
4. 點擊 **Save**
5. **重要**: 複製顯示的 Token（只會顯示一次！）
6. 將 Token 加入到 `.env` 檔案：

```env
STRAPI_API_TOKEN=你複製的_token_字串
```

## 📥 步驟 8: 匯入資料

確保 Strapi 仍在運行，開啟新的終端視窗：

```bash
cd cms
npm run import-data
```

腳本會：
1. 讀取 `shared/data/feed.json`
2. 上傳所有圖片到 Strapi
3. 建立所有 Feed Items

匯入過程可能需要幾分鐘，取決於圖片數量。

## ✅ 步驟 9: 驗證

### 9.1 在管理面板中查看

訪問：http://localhost:1337/admin/content-manager/collection-types/api::feed-item.feed-item

您應該會看到所有匯入的專案。

### 9.2 測試 API

在瀏覽器中訪問：

```
http://localhost:1337/api/feed-items?populate=*
```

您應該會看到 JSON 格式的資料。

## 🎨 步驟 10: 連接前端

更新 portfolio 專案的 `.env.local`：

```bash
cd ../portfolio
cp env.example .env.local
```

編輯 `.env.local`：

```env
VITE_STRAPI_URL=http://localhost:1337
```

啟動 portfolio：

```bash
npm run dev
```

前端應該會從 Strapi 讀取資料並正常顯示！

## 📚 常見問題

### Q: Strapi 啟動失敗

**A:** 檢查：
- Node.js 版本是否符合要求（18.x+）
- `.env` 檔案是否正確設置
- 3001 port 是否被佔用

### Q: 匯入資料時出現 401 錯誤

**A:** 檢查：
- API Token 是否正確設置在 `.env` 中
- Token 是否有 Full access 權限

### Q: 前端無法讀取資料

**A:** 檢查：
- Strapi 是否正在運行
- API 權限是否已設置（步驟 6）
- `.env.local` 中的 `VITE_STRAPI_URL` 是否正確

### Q: 圖片無法顯示

**A:** 檢查：
- 圖片是否成功上傳到 Strapi（在 Media Library 中查看）
- `VITE_STRAPI_URL` 是否正確設置

## 🎉 完成！

恭喜！您已經成功設置了完整的 Strapi CMS 系統。

## 📖 進階主題

- [完整 Content Types 設置說明](./strapi-setup.md)
- [自訂 API 端點](https://docs.strapi.io/dev-docs/backend-customization/routes)
- [使用 PostgreSQL 資料庫](https://docs.strapi.io/dev-docs/configurations/database#postgresql-configuration)
- [部署到生產環境](https://docs.strapi.io/dev-docs/deployment)

## 💡 實用命令

```bash
# 開發模式（有熱重載）
npm run develop

# 生產模式啟動
npm run start

# 建置生產版本
npm run build

# 重新匯入資料（會覆蓋現有資料）
npm run import-data
```

## 🆘 需要幫助？

- [Strapi 官方文件](https://docs.strapi.io/)
- [Strapi Discord 社群](https://discord.strapi.io/)
- [專案 README](../README.md)

