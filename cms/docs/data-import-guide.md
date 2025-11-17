# 📥 資料匯入指南

這份指南詳細說明如何將現有的 `shared/data/feed.json` 資料匯入到 Strapi CMS。

## 🎯 匯入腳本功能

匯入腳本 (`scripts/import-feed-data.js`) 會自動：

1. ✅ 讀取 `shared/data/feed.json` 中的所有專案資料
2. ✅ 上傳所有圖片到 Strapi Media Library
3. ✅ 轉換資料格式以符合 Strapi Content Type
4. ✅ 建立所有 Feed Items（包含完整的 Project Info）
5. ✅ 保持資料結構的完整性（sections, meta, images）

## 📋 前置需求

在執行匯入之前，請確保：

- [x] Strapi 已安裝並正在運行（`npm run develop`）
- [x] 已建立管理員帳號
- [x] 已完成所有 Content Types 的建立（參考 `strapi-setup.md`）
- [x] 已設置 API 權限（Public role 的 find 和 findOne）
- [x] 已建立 API Token 並加入到 `.env` 檔案

## 🔑 步驟 1: 建立 API Token

### 1.1 在 Strapi 管理面板中建立 Token

1. 登入 Strapi 管理面板：http://localhost:1337/admin
2. 進入 **Settings** (左下角齒輪圖示)
3. 點擊 **API Tokens**
4. 點擊 **Create new API Token**

### 1.2 設定 Token

| 欄位 | 值 |
|------|---|
| **Name** | `Import Script` |
| **Description** | `用於匯入 feed.json 資料的腳本` |
| **Token duration** | `Unlimited` 或 `90 days` |
| **Token type** | `Full access` |

### 1.3 儲存並複製 Token

1. 點擊 **Save**
2. **重要**：立即複製顯示的 Token（只會顯示一次！）
3. 將 Token 加入到 `.env` 檔案：

```bash
# 編輯 cms/.env 檔案，加入以下行：
STRAPI_API_TOKEN=你複製的_token_字串
```

## 🚀 步驟 2: 執行匯入

### 2.1 確保 Strapi 正在運行

在一個終端視窗中：

```bash
cd cms
npm run develop
```

### 2.2 在新的終端視窗執行匯入

```bash
# 開啟新的終端視窗
cd cms
npm run import-data
```

## 📊 匯入過程

匯入腳本會顯示詳細的進度：

```
🚀 開始匯入 Feed 資料到 Strapi

Strapi URL: http://localhost:1337
資料來源: ../shared/data/feed.json

📊 找到 7 個項目

============================================================

📝 處理項目: AI News APP (ID: 1)
  📸 上傳主圖片...
  ✅ 上傳成功: demo/nownews/demo-nownews-bg.jpg (ID: 1)
  🔧 處理專案資訊...
  ✅ 上傳成功: demo/nownews/demo-nownews-01.jpg (ID: 2)
  ✅ 上傳成功: demo/nownews/demo-nownews-hero-img.png (ID: 3)
  ✅ 上傳成功: demo/nownews/demo-nownews-02.jpg (ID: 4)
  ✅ 建立成功! (Strapi ID: 1)
============================================================

... (其他項目)

✨ 匯入完成！

成功: 7 個
失敗: 0 個
總共: 7 個

🎉 您可以在 Strapi 管理面板中查看匯入的資料：
   http://localhost:1337/admin/content-manager/collection-types/api::feed-item.feed-item
```

## 🔍 驗證匯入結果

### 驗證 1: 在管理面板中查看

訪問 Feed Items 列表：
```
http://localhost:1337/admin/content-manager/collection-types/api::feed-item.feed-item
```

檢查：
- ✅ 所有項目都已建立
- ✅ 標題、日期、標籤等基本資訊正確
- ✅ 主圖片已上傳
- ✅ 專案資訊完整（點擊項目查看詳細內容）

### 驗證 2: 檢查 Media Library

訪問 Media Library：
```
http://localhost:1337/admin/plugins/upload
```

檢查：
- ✅ 所有圖片都已上傳
- ✅ 圖片可以正常預覽
- ✅ 圖片數量正確（每個專案約 4-6 張圖）

### 驗證 3: 測試 API

在瀏覽器中訪問：
```
http://localhost:1337/api/feed-items?populate=deep
```

或使用更精確的 populate：
```
http://localhost:1337/api/feed-items?populate[heroImage][fields][0]=url&populate[projectInfo][populate][mainImage][fields][0]=url&populate[projectInfo][populate][specialHeadingImage][fields][0]=url&populate[projectInfo][populate][sections][populate]=*
```

檢查：
- ✅ 回傳 JSON 格式的資料
- ✅ 包含所有項目
- ✅ 圖片 URL 正確（格式：`/uploads/...`）
- ✅ projectInfo 結構完整

## 🔧 進階選項

### 重新匯入資料

如果需要重新匯入資料：

1. **刪除現有資料**：
   - 在 Strapi 管理面板中，進入 Feed Items
   - 選擇所有項目並刪除

2. **清空 Media Library**（可選）：
   - 進入 Media Library
   - 刪除所有上傳的圖片

3. **重新執行匯入腳本**：
   ```bash
   npm run import-data
   ```

### 部分匯入

如果只想匯入特定項目，可以修改 `shared/data/feed.json`，暫時移除不需要的項目。

### 自訂匯入腳本

匯入腳本位於 `scripts/import-feed-data.js`，您可以根據需求修改：

- 修改 Strapi URL
- 調整資料轉換邏輯
- 加入額外的驗證
- 自訂錯誤處理

## ⚠️ 常見問題

### 問題 1: 401 Unauthorized

**錯誤訊息：**
```
❌ 建立失敗: 401 Unauthorized
```

**原因：**
- API Token 未設置或錯誤
- Token 權限不足

**解決方案：**
1. 檢查 `.env` 檔案中的 `STRAPI_API_TOKEN`
2. 確認 Token 類型為 `Full access`
3. 重新建立 Token 並更新 `.env`

### 問題 2: 圖片上傳失敗

**錯誤訊息：**
```
⚠️ 圖片不存在: /path/to/image.jpg
```

**原因：**
- 圖片檔案路徑不正確
- 圖片檔案不存在

**解決方案：**
1. 檢查 `portfolio/assets/` 資料夾中的圖片
2. 確認 `feed.json` 中的圖片路徑正確
3. 確保圖片檔案存在

### 問題 3: 重複的圖片

**現象：**
- 重新執行匯入時，圖片被重複上傳

**說明：**
- 這是正常的，Strapi 允許重複的圖片
- 如需清理，可在 Media Library 中手動刪除舊圖片

**解決方案：**
- 在重新匯入前，先清空 Media Library
- 或使用匯入腳本的緩存機制（圖片只在同一次執行中上傳一次）

### 問題 4: Content Type 不存在

**錯誤訊息：**
```
❌ Strapi 請求失敗: HTTP 404
```

**原因：**
- Content Types 尚未建立
- Content Type 名稱不匹配

**解決方案：**
1. 確認已完成 Content Types 建立（參考 `strapi-setup.md`）
2. 檢查 API 端點是否正確：`/api/feed-items`
3. 確認 Collection Type 的 API ID 為 `feed-item`

## 📊 資料對應說明

### Feed Item 基本欄位

| feed.json | Strapi Field | 說明 |
|-----------|--------------|------|
| `id` | (自動生成) | Strapi 會自動分配新的 ID |
| `heading` | `heading` | 標題 |
| `date` | `date` | 日期字串 |
| `tags` | `tags` | JSON 陣列 |
| `category` | `category` | 'article' 或 'project' |
| `brand` | `brand` | 品牌名稱 |
| `primaryColor` | `primaryColor` | 主要顏色 |
| `secondaryColor` | `secondaryColor` | 次要顏色 |
| `heroImage` | `heroImage` | Media 關聯 |

### Project Info 欄位

| feed.json | Strapi Component | 說明 |
|-----------|------------------|------|
| `projectInfo` | `project.info` | 專案資訊組件 |
| `projectInfo.client` | `client` | 客戶名稱 |
| `projectInfo.project` | `project` | 專案名稱 |
| `projectInfo.roles` | `roles` | 角色陣列（JSON） |
| `projectInfo.description` | `description` | 專案描述 |
| `projectInfo.mainImage` | `mainImage` | 主圖片 (Media) |
| `projectInfo.specialHeadingImage` | `specialHeadingImage` | 特殊標題圖 (Media) |
| `projectInfo.sections` | `sections` | 章節陣列 (Repeatable Component) |

### Project Section Content 類型對應

| feed.json type | Strapi Component | 欄位 |
|----------------|------------------|------|
| `paragraph` | `project.paragraph` | `text` |
| `quote` | `project.quote` | `text` |
| `blockquote` | `project.blockquote` | `text`, `enableTypewriter` |
| `image` | `project.image` | `image` (Media), `alt` |

## 🎉 下一步

匯入成功後，您可以：

1. **在前端專案中測試**
   ```bash
   cd ../portfolio
   npm run dev
   ```

2. **在 Strapi 中編輯內容**
   - 修改文字內容
   - 更換圖片
   - 調整專案資訊

3. **新增更多內容**
   - 手動在 Strapi 中新增專案
   - 或修改 `feed.json` 後重新匯入

## 📚 相關文件

- [README.md](../README.md) - 專案概覽
- [quick-start.md](./quick-start.md) - 快速開始指南
- [strapi-setup.md](./strapi-setup.md) - Content Types 設置指南

## 💡 小技巧

- 匯入腳本會自動處理重複圖片（在同一次執行中）
- 如果某個項目匯入失敗，其他項目仍會繼續處理
- 建議在正式環境前先測試匯入流程
- 保留 `feed.json` 作為資料備份

