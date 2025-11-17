# NOEINOI Portfolio CMS

這是 NOEINOI 作品集的 Strapi CMS 後端系統。

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設置環境變數

```bash
cp env-template.txt .env
```

然後編輯 `.env` 檔案，設定適當的密鑰：

```bash
# 生成隨機密鑰（執行 5 次，分別用於不同的設定）
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

將生成的密鑰填入 `.env` 的 `APP_KEYS`、`API_TOKEN_SALT`、`ADMIN_JWT_SECRET`、`TRANSFER_TOKEN_SALT` 和 `JWT_SECRET`。

**快速設置腳本：**

```bash
# macOS / Linux - 自動生成並設置密鑰
cat > .env << EOF
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
```

### 3. 建立 Content Types

首次啟動 Strapi 後，需要手動建立 Content Types，或使用我們提供的 schema 配置檔案。

執行以下命令來建立必要的資料夾結構：

```bash
npm run strapi generate
```

然後參考 `docs/strapi-setup.md` 來設置 Content Types。

### 4. 啟動開發伺服器

```bash
npm run develop
```

Strapi 管理面板將會在 http://localhost:1337/admin 開啟。

### 5. 建立管理員帳號

首次訪問時，您需要建立一個管理員帳號。

### 6. 匯入資料

在建立好所有 Content Types 後，執行以下命令匯入現有的專案資料：

```bash
npm run import-data
```

## 📁 Content Types 結構

### Feed Items (feed-item)

主要的內容類型，包含文章和專案資訊。

**欄位：**
- `heading` (Text, Required): 標題
- `date` (Text): 日期
- `tags` (JSON): 標籤陣列
- `category` (Enumeration): article 或 project
- `brand` (Text): 品牌名稱
- `primaryColor` (Text): 主要顏色
- `secondaryColor` (Text): 次要顏色
- `heroImage` (Media): 主圖片
- `content` (Dynamic Zone): 文章內容區塊
- `projectInfo` (Component): 專案詳細資訊

### Dynamic Zone: Content

文章內容支援以下區塊類型：

1. **feed.heading**: 標題區塊
   - `level` (Number): 1, 2, 或 3
   - `content` (Text): 標題文字

2. **feed.paragraph**: 段落區塊
   - `content` (Rich Text): 段落內容

3. **feed.image**: 圖片區塊
   - `image` (Media): 圖片
   - `alt` (Text): 替代文字

4. **feed.video**: 影片區塊
   - `video` (Media): 影片檔案
   - `poster` (Media): 預覽圖
   - `alt` (Text): 替代文字
   - `autoplay` (Boolean): 自動播放
   - `loop` (Boolean): 循環播放
   - `muted` (Boolean): 靜音
   - `controls` (Boolean): 顯示控制項

5. **feed.list**: 清單區塊
   - `items` (JSON): 清單項目陣列

### Component: Project Info

專案詳細資訊組件：

**欄位：**
- `client` (Text): 客戶名稱
- `project` (Text): 專案名稱
- `roles` (JSON): 角色陣列
- `description` (Text, Long): 專案描述
- `websiteUrl` (Text): 網站 URL
- `websiteLabel` (Text): 網站連結文字
- `mainImage` (Media): 主圖片
- `specialHeadingImage` (Media): 特殊標題圖片
- `sections` (Component, Repeatable): 專案章節

### Component: Project Section

專案章節組件：

**欄位：**
- `title` (Text, Required): 章節標題
- `content` (Dynamic Zone): 章節內容區塊

### Dynamic Zone: Project Section Content

章節內容支援以下區塊類型：

1. **project.paragraph**: 段落
   - `text` (Text, Long): 段落文字

2. **project.quote**: 引用
   - `text` (Text): 引用文字

3. **project.blockquote**: 區塊引用
   - `text` (Text, Long): 引用文字
   - `enableTypewriter` (Boolean): 啟用打字機效果

4. **project.image**: 圖片
   - `image` (Media): 圖片
   - `alt` (Text): 替代文字

## 🔧 API 設定

### 權限設定

在 Strapi 管理面板中：

1. 進入 **Settings** → **Users & Permissions plugin** → **Roles** → **Public**
2. 找到 **Feed-item** 權限
3. 勾選 `find` 和 `findOne`
4. 儲存

這將允許前端應用程式在未經身份驗證的情況下讀取資料。

## 📚 相關文件

- [Strapi 官方文件](https://docs.strapi.io/)
- [Content Type Builder](https://docs.strapi.io/user-docs/content-type-builder)
- [設置指南](./docs/strapi-setup.md)

## ⚙️ 開發命令

```bash
# 開發模式（自動重載）
npm run develop

# 生產模式啟動
npm run start

# 建置生產版本
npm run build

# 匯入資料
npm run import-data
```

## 🗄️ 資料庫

預設使用 SQLite 資料庫（`.tmp/data.db`），適合開發和小型應用。

如需使用 PostgreSQL、MySQL 或其他資料庫，請參考 [Strapi Database 文件](https://docs.strapi.io/dev-docs/configurations/database)。

## 📝 注意事項

1. `.env` 檔案包含敏感資訊，請勿提交到版本控制系統
2. `.tmp` 資料夾包含 SQLite 資料庫，建議定期備份
3. `public/uploads` 資料夾包含上傳的媒體檔案
4. 首次使用前請詳閱 `docs/strapi-setup.md` 的詳細設置說明

