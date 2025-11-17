# 專案資料匯入指南

## 📋 功能說明

這個腳本會將 portfolio 專案中的多語言資料匯入到 Strapi CMS：

- ✅ 讀取 `en`, `ja`, `zh-Hant` 三種語言的專案資料
- ✅ 將多語言資料合併成單一 JSON 結構
- ✅ 上傳所有圖片到 Strapi Media Library
- ✅ 建立 Project entries 並自動發布

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

### 2. 在本地執行匯入腳本

```bash
# 進入 cms 目錄
cd cms

# 確保已安裝依賴
npm install

# 設定環境變數並執行匯入
STRAPI_API_TOKEN=your-token-here npm run import-projects
```

或者使用環境變數檔案：

```bash
# 建立 .env 檔案
echo "STRAPI_API_TOKEN=your-token-here" >> .env
echo "STRAPI_URL=https://172.104.73.171" >> .env

# 執行匯入
npm run import-projects
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
scp cms/scripts/import-projects.js root@172.104.73.171:/var/www/strapi/scripts/

# 上傳 portfolio 資料（在本地執行）
scp -r portfolio/src/i18n root@172.104.73.171:/tmp/
scp -r portfolio/assets/imgs root@172.104.73.171:/tmp/

# 回到伺服器執行匯入
cd /var/www/strapi
STRAPI_API_TOKEN=your-token npm run import-projects
```

## 📊 資料結構說明

### 輸入資料 (projects.json)

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

### 輸出資料 (Strapi Project)

```json
{
  "title": {
    "en": "AI News APP",
    "ja": "AI News APP",
    "zh-Hant": "AI News APP"
  },
  "slug": "ai-news-app",
  "description": {
    "en": "...",
    "ja": "...",
    "zh-Hant": "..."
  },
  "coverImage": 1,
  "date": "Jan 01, 2025 - PRESENT",
  "tags": ["UI", "UX"],
  "categories": ["project"],
  "brand": "NOWNEWS",
  "primaryColor": "#FBC92B",
  "secondaryColor": "#18181A",
  "meta": {
    "en": [...],
    "ja": [...],
    "zh-Hant": [...]
  },
  "content": {
    "en": {...},
    "ja": {...},
    "zh-Hant": {...}
  },
  "images": [2, 3, 4, 5]
}
```

## 🔧 package.json 設定

在 `cms/package.json` 中新增 script：

```json
{
  "scripts": {
    "import-projects": "node scripts/import-projects.js"
  }
}
```

## ⚠️ 注意事項

1. **API Token 安全**：不要將 Token 提交到 Git
2. **圖片路徑**：腳本會從 `portfolio/assets/imgs/` 讀取圖片
3. **網路連線**：匯入過程需要穩定的網路連線
4. **執行時間**：取決於專案數量和圖片大小，可能需要幾分鐘
5. **重複匯入**：如果重複執行，會建立重複的專案（可手動刪除）

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

匯入完成後：

1. 前往 Strapi Admin 查看匯入的專案
2. 檢查資料是否正確
3. 測試 API 端點：`GET /api/projects`
4. 在前端使用多語言資料：
   ```javascript
   const project = await fetchProject(slug);
   const title = project.attributes.title[locale]; // 'en', 'ja', 'zh-Hant'
   ```

