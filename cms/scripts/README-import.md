# 資料同步指南

本目錄包含將 portfolio 專案中的多語言資料同步到 Strapi CMS 的腳本。

## 📋 可用腳本

| 腳本 | 說明 | 指令 |
|------|------|------|
| `import-projects.mjs` | 同步專案資料 | `npm run import-projects` |
| `import-articles.mjs` | 同步文章資料 | `npm run import-articles` |
| - | 同步所有資料 | `npm run import-all` |

## 📋 功能說明

這些腳本會將 portfolio 專案中的多語言資料**同步**到 Strapi CMS：

- ✅ 讀取 `en`, `ja`, `zh-Hant` 三種語言的資料
- ✅ 將多語言資料合併成單一 JSON 結構
- ✅ **智慧檢查**：自動檢查資料是否已存在（使用 `slug` 識別）
- ✅ **更新已存在的資料**：不會產生重複資料
- ✅ **建立新資料**：只有新的資料才會被建立
- ✅ **圖片去重**：已上傳的圖片會跳過，不會重複上傳
- ✅ 自動發布 entries

## 🚀 使用方法

### 1. 取得 Strapi API Token

1. 登入 Strapi Admin: `https://172.104.73.171/admin`
2. 前往 **Settings** → **API Tokens**
3. 點擊 **"Create new API Token"**
4. 設定：
   - **Name**: Import Script
   - **Token duration**: Unlimited (或選擇適合的期限)
   - **Token type**: Full access
5. 點擊 **"Save"**
6. **複製** 顯示的 Token（只會顯示一次！）

### 2. 在本地執行同步腳本

```bash
# 進入 cms 目錄
cd cms

# 確保已安裝依賴
npm install

# 設定環境變數並執行同步
STRAPI_API_TOKEN=your-token-here npm run import-projects
```

或者使用環境變數檔案：

```bash
# 建立 .env 檔案
echo "STRAPI_API_TOKEN=your-token-here" >> .env
echo "STRAPI_URL=http://172.104.73.171:1337" >> .env

# 執行同步
npm run import-projects
```

### 同步流程說明

腳本執行時會：
1. 先從 Strapi 取得所有已存在的資料和圖片
2. 比對本地 i18n 資料與 Strapi 資料
3. **新資料** → 建立 (POST)
4. **已存在的資料** → 更新 (PUT)
5. **已存在的圖片** → 跳過上傳

### 同步專案

```bash
npm run import-projects
```

### 同步文章

```bash
npm run import-articles
```

### 同步所有資料

```bash
npm run import-all
```

### 3. 在伺服器上執行（選項）

如果要直接在 Linode 伺服器上執行：

```bash
# SSH 到伺服器
ssh root@172.104.73.171

# 進入 Strapi 目錄
cd /var/www/strapi

# 確保 scripts 目錄存在
mkdir -p scripts

# 上傳腳本檔案（在本地執行）
scp cms/scripts/import-projects.mjs root@172.104.73.171:/var/www/strapi/scripts/

# 上傳 portfolio 資料（在本地執行）
scp -r portfolio/src/i18n root@172.104.73.171:/tmp/
scp -r portfolio/assets/imgs root@172.104.73.171:/tmp/

# 回到伺服器執行同步
cd /var/www/strapi
STRAPI_API_TOKEN=your-token npm run import-projects
```

## 📊 資料結構說明

### Projects 資料結構

#### 輸入資料 (projects.json)

```json
{
  "1": {
    "heading": "AI News APP",
    "date": "Jan 01, 2025 - PRESENT",
    "tags": ["UI", "UX"],
    "category": "project",
    "brand": "NOWNEWS",
    "primaryColor": "#FBC92B",
    "secondaryColor": "#18181A",
    "heroImage": "demo/nownews/demo-nownews-bg.jpg",
    "projectInfo": {
      "project": "Streaming Ratings Guide",
      "description": "...",
      "websiteUrl": "https://awwrated.com",
      "meta": [...],
      "sections": {...}
    }
  }
}
```

#### 輸出資料 (Strapi Project)

```json
{
  "title": { "en": "...", "ja": "...", "zh-Hant": "..." },
  "slug": "ai-news-app",
  "description": { "en": "...", "ja": "...", "zh-Hant": "..." },
  "coverImage": 1,
  "date": "Jan 01, 2025 - PRESENT",
  "tags": ["UI", "UX"],
  "categories": ["project"],
  "brand": "NOWNEWS",
  "primaryColor": "#FBC92B",
  "secondaryColor": "#18181A",
  "meta": { "en": [...], "ja": [...], "zh-Hant": [...] },
  "content": { "en": {...}, "ja": {...}, "zh-Hant": {...} },
  "images": [2, 3, 4, 5]
}
```

### Articles 資料結構

#### 輸入資料 (articles.json)

```json
{
  "1": {
    "heading": "設計系統：\n產品協作的解方",
    "subtitle": "作為產品人，我很喜歡用這張圖...",
    "date": "2024 年 11 月 11 日",
    "tags": ["設計系統", "產品設計"],
    "category": "article",
    "url": "",
    "images": ["articles/00/topics-0.1.jpg", "articles/00/topics-0.2.jpg"],
    "content": {
      "paragraph1": "...",
      "paragraph2": "...",
      "paragraph3": "..."
    }
  }
}
```

#### 輸出資料 (Strapi Article)

```json
{
  "title": { "en": "...", "ja": "...", "zh-Hant": "..." },
  "slug": "design-system-product-collaboration",
  "subtitle": { "en": "...", "ja": "...", "zh-Hant": "..." },
  "date": "2024 年 11 月 11 日",
  "tags": ["設計系統", "產品設計"],
  "category": "article",
  "url": "",
  "content": { "en": {...}, "ja": {...}, "zh-Hant": {...} },
  "coverImage": 1,
  "images": [1, 2]
}
```

## 🔧 package.json 設定

在 `cms/package.json` 中的 scripts：

```json
{
  "scripts": {
    "import-projects": "node scripts/import-projects.mjs",
    "import-articles": "node scripts/import-articles.mjs",
    "import-all": "node scripts/import-projects.mjs && node scripts/import-articles.mjs"
  }
}
```

## ⚠️ 注意事項

1. **API Token 安全**：不要將 Token 提交到 Git
2. **圖片路徑**：腳本會從 `portfolio/assets/imgs/` 讀取圖片
3. **網路連線**：同步過程需要穩定的網路連線
4. **執行時間**：取決於資料數量和圖片大小，可能需要幾分鐘
5. **可重複執行**：腳本支援重複執行，不會產生重複的資料
   - 使用 `slug` 作為唯一識別符
   - 已存在的資料會被更新，不會重複建立
   - 已上傳的圖片會被跳過，不會重複上傳
6. **Strapi 需要先建立 Article Content Type**：如果 Strapi 尚未有 `Article` 內容類型，需要先在 Strapi Admin 中建立

## 🐛 疑難排解

### 錯誤：找不到圖片
- 檢查 `portfolio/assets/imgs/` 目錄是否存在
- 確認圖片路徑與 projects.json 中的路徑一致

### 錯誤：API Token 無效
- 確認 Token 是否正確複製
- 檢查 Token 是否已過期
- 確認 Token 有 Full access 權限

### 錯誤：無法連線到 Strapi
- 確認 Strapi 是否正在運行：`pm2 status strapi`
- 檢查 STRAPI_URL 是否正確
- 確認防火牆設定

## 📝 後續步驟

同步完成後：

1. 前往 Strapi Admin 查看同步的資料
2. 檢查資料是否正確
3. 測試 API 端點：
   - `GET /api/projects`
   - `GET /api/articles`
4. 在前端使用多語言資料：
   ```javascript
   // 取得專案
   const project = await fetchProject(slug);
   const title = project.attributes.title[locale]; // 'en', 'ja', 'zh-Hant'
   
   // 取得文章
   const article = await fetchArticle(slug);
   const articleTitle = article.attributes.title[locale];
   ```

## 🔄 工作流程建議

### 同步專案

1. **在本地編輯** `portfolio/src/i18n/locales/` 中的 `projects.json`
2. **執行同步腳本** `npm run import-projects`
3. **在 Strapi Admin 確認** 資料已正確同步

### 同步文章

1. **在本地編輯** `portfolio/src/i18n/locales/` 中的 `articles.json`
2. **執行同步腳本** `npm run import-articles`
3. **在 Strapi Admin 確認** 資料已正確同步

### 同步所有資料

```bash
npm run import-all
```

這會依序執行 `import-projects` 和 `import-articles`。
