# ✨ 下一步該做什麼？

您的 Strapi CMS 專案結構已經準備完成！以下是接下來的步驟。

## 🎯 立即開始（5 分鐘快速測試）

想要最快速地看到結果？執行以下命令：

```bash
# 1. 進入 cms 資料夾
cd cms

# 2. 安裝依賴（第一次需要，約 2-3 分鐘）
npm install

# 3. 設置環境變數（自動生成密鑰）
cat > .env << 'EOF'
HOST=0.0.0.0
PORT=1337

APP_KEYS=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"),$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
API_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")
ADMIN_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")
TRANSFER_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")

DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
EOF

# 4. 啟動 Strapi（會自動開啟瀏覽器）
npm run develop
```

接下來會自動開啟瀏覽器到 http://localhost:1337/admin

**首次啟動時需要：**
1. 建立管理員帳號（設置 Email 和 Password）
2. 按照 `docs/strapi-setup.md` 建立 Content Types
3. 建立 API Token（Settings → API Tokens）
4. 將 Token 加入 `.env` 檔案：`STRAPI_API_TOKEN=your_token`
5. 執行 `npm run import-data` 匯入資料

## 📚 完整指南（如果想要深入了解）

### 選項 A：快速開始（推薦新手）
```bash
cd cms
```
然後開啟：[`docs/quick-start.md`](./docs/quick-start.md)

### 選項 B：完整學習（推薦深入理解）
```bash
cd cms
```
依序閱讀：
1. [`INSTALLATION.md`](./INSTALLATION.md) - 了解安裝選項
2. [`docs/strapi-setup.md`](./docs/strapi-setup.md) - 詳細設置 Content Types
3. [`docs/data-import-guide.md`](./docs/data-import-guide.md) - 匯入資料

## 🗂️ 檔案結構說明

```
cms/
├── 📖 開始使用.md              ← 【從這裡開始】
├── 📖 INSTALLATION.md         ← 安裝指南總覽
├── 📖 README.md               ← 專案概覽
├── 📖 NEXT-STEPS.md           ← 本文件
│
├── 📁 docs/                   ← 詳細文件
│   ├── quick-start.md         ← 快速開始（推薦）
│   ├── strapi-setup.md        ← Content Types 設置
│   ├── data-import-guide.md   ← 資料匯入指南
│   └── schema-reference.md    ← Schema 參考
│
├── 📁 scripts/                ← 工具腳本
│   └── import-feed-data.js    ← 資料匯入腳本
│
├── 📄 package.json            ← npm 設定
├── 📄 env-template.txt        ← 環境變數範本
├── 📄 .gitignore              ← Git 忽略設定
└── 📄 .npmrc                  ← npm 設定

```

## ⚡ 常用命令速查

```bash
# 安裝依賴（首次需要）
npm install

# 啟動開發伺服器（有熱重載）
npm run develop

# 匯入資料（Content Types 建立後）
npm run import-data

# 生產模式啟動
npm run start

# 建置
npm run build
```

## 🎯 完整設置流程（30 分鐘）

以下是完整的設置流程，建議按順序進行：

### 第 1 步：安裝 Strapi（5 分鐘）
```bash
cd cms
npm install
```

### 第 2 步：設置環境變數（1 分鐘）
```bash
cp env-template.txt .env
# 編輯 .env，設置密鑰（或使用上面的自動生成腳本）
```

### 第 3 步：啟動 Strapi（1 分鐘）
```bash
npm run develop
```

### 第 4 步：建立管理員帳號（1 分鐘）
- 瀏覽器會自動開啟
- 填寫 Email、Password 等資訊

### 第 5 步：建立 Content Types（15 分鐘）
📖 詳細步驟：[`docs/strapi-setup.md`](./docs/strapi-setup.md)

**建立順序：**
1. Feed Components (feed.heading, feed.paragraph, feed.image, feed.video, feed.list)
2. Project Components (project.paragraph, project.quote, project.blockquote, project.image, project.section, project.info)
3. Feed Item Collection Type

### 第 6 步：設置 API 權限（1 分鐘）
- Settings → Users & Permissions → Roles → Public
- 勾選 Feed-item 的 `find` 和 `findOne`

### 第 7 步：建立 API Token（2 分鐘）
- Settings → API Tokens → Create new API Token
- Name: `Import Script`
- Token type: `Full access`
- 複製 Token 並加入到 `.env`：
  ```
  STRAPI_API_TOKEN=your_copied_token
  ```

### 第 8 步：匯入資料（5 分鐘）
```bash
# 在新的終端視窗
npm run import-data
```

### 第 9 步：驗證（1 分鐘）
- 管理面板：http://localhost:1337/admin/content-manager/collection-types/api::feed-item.feed-item
- API 測試：http://localhost:1337/api/feed-items?populate=deep

### 第 10 步：連接前端（3 分鐘）
```bash
cd ../portfolio
cp env.example .env.local
# 編輯 .env.local，設置：
# VITE_STRAPI_URL=http://localhost:1337

npm run dev
```

## 🎉 完成後可以做什麼？

✅ **在 Strapi 管理面板中：**
- 編輯專案內容
- 上傳新圖片
- 新增更多專案
- 管理所有內容

✅ **在前端專案中：**
- 瀏覽作品集
- 查看專案詳情
- 測試響應式設計

✅ **進階功能：**
- 設置正式資料庫（PostgreSQL/MySQL）
- 部署到雲端服務
- 自訂 API 端點
- 整合其他服務

## 🆘 遇到問題？

### 問題 1: npm install 失敗
→ 檢查 Node.js 版本：`node --version`（需要 18.x+）

### 問題 2: Strapi 無法啟動
→ 檢查 `.env` 檔案是否正確設置

### 問題 3: Content Types 建立錯誤
→ 參考 [`docs/strapi-setup.md`](./docs/strapi-setup.md) 詳細步驟

### 問題 4: 資料匯入失敗
→ 檢查：
- Strapi 是否正在運行
- API Token 是否正確設置
- Content Types 是否都已建立

### 問題 5: 前端無法讀取資料
→ 檢查：
- API 權限是否已設置
- `.env.local` 中的 `VITE_STRAPI_URL` 是否正確

## 📚 推薦閱讀順序

1. **首次使用：**
   - [`開始使用.md`](./開始使用.md) - 了解整體架構
   - [`docs/quick-start.md`](./docs/quick-start.md) - 快速完成設置

2. **深入學習：**
   - [`INSTALLATION.md`](./INSTALLATION.md) - 安裝選項說明
   - [`docs/strapi-setup.md`](./docs/strapi-setup.md) - Content Types 詳解
   - [`docs/data-import-guide.md`](./docs/data-import-guide.md) - 資料匯入細節

3. **參考文件：**
   - [`docs/schema-reference.md`](./docs/schema-reference.md) - Schema 結構
   - [`README.md`](./README.md) - API 和功能說明

## 💡 小提示

- 📌 **建議收藏**：`docs/quick-start.md` 的常見問題章節
- 🔖 **常用連結**：將 http://localhost:1337/admin 加入書籤
- 💾 **記得備份**：`.env` 檔案包含重要密鑰
- 🎯 **測試環境**：建議先在本地完整測試後再部署

## 🚀 準備好了嗎？

現在就開始吧！執行：

```bash
cd cms
npm install
```

然後打開 [`docs/quick-start.md`](./docs/quick-start.md) 跟著步驟進行。

祝您使用愉快！🎊

