# Strapi CMS 設定總結

## ✅ 已完成

1. ✅ **Strapi 部署到 Linode** (`https://172.104.73.171`)
2. ✅ **建立 Project Content Type** (支援多語言 JSON)
3. ✅ **匯入 8 個專案資料** (en, ja, zh-Hant)
4. ✅ **上傳 41 張圖片** 到 Media Library
5. ✅ **建立 `useStrapiProjects` hook** 來取得資料
6. ✅ **修改 `Home.tsx`** 使用 Strapi API
7. ✅ **更新 `.env`** 設定 Strapi URL

## ⚠️ 待完成

### 1. 設定 Strapi Public API 權限

**目前狀態：** API 無法公開存取（需要認證）

**解決方法：** 在 Strapi Admin 中設定權限

#### 步驟：

1. 登入 `https://172.104.73.171/admin`
2. 前往 **Settings** → **Users & Permissions Plugin** → **Roles**
3. 點擊 **"Public"** 角色
4. 往下滾動找到 **Project** 區塊
5. 勾選以下權限：
   - ✅ `find` - 允許取得專案列表
   - ✅ `findOne` - 允許取得單一專案
6. 同樣在 **Upload** 區塊勾選：
   - ✅ `find` - 允許取得上傳檔案
7. 點擊右上角 **"Save"**

**如果沒看到 Project:**
- 重新整理頁面（Ctrl+Shift+R）
- 或檢查 Strapi 是否正確載入 API（`pm2 logs strapi`）

---

## 📊 資料結構說明

### Strapi 儲存格式（多語言 JSON）

```json
{
  "title": {
    "en": "AI News APP",
    "ja": "AI News APP",
    "zh-Hant": "AI News APP"
  },
  "description": {
    "en": "Introducing...",
    "ja": "Shopmatic デザイン...",
    "zh-Hant": "介紹..."
  },
  "content": {
    "en": { "project": "...", "sections": {...} },
    "ja": { "project": "...", "sections": {...} },
    "zh-Hant": { "project": "...", "sections": {...} }
  }
}
```

### 前端使用方式

`useStrapiProjects` hook 會：
1. 自動取得所有專案
2. 根據當前語言 (`i18n.language`) 解析多語言 JSON
3. 轉換為 `FeedItem` 格式供前端使用
4. 當語言切換時自動重新解析資料

```typescript
// 在 Home.tsx 中
const { items, loading, error } = useStrapiProjects();

// items 會根據當前語言自動顯示對應的標題、描述等
// 語言切換時會自動更新
```

---

## 🚀 測試步驟

### 1. 設定 Public 權限後測試 API

```bash
# 測試是否可以公開存取
curl -k "https://172.104.73.171/api/projects?pagination[pageSize]=1"

# 應該會看到 JSON 回應，不是 403 Forbidden
```

### 2. 啟動 Portfolio 前端

```bash
cd portfolio
npm run dev
```

### 3. 檢查瀏覽器

1. 開啟 `http://localhost:5173`
2. 打開開發者工具 Console
3. 應該會看到：
   - ✅ 8 個專案卡片
   - ✅ 根據當前語言顯示對應的標題
   - ✅ 圖片正確載入
   - ✅ 點擊卡片可以看到詳細資訊

### 4. 測試語言切換

1. 點擊右上角的語言選單（EN / ZH / JP）
2. 切換語言
3. 專案標題、描述、內容應該會自動更新為對應語言

---

## 🔧 疑難排解

### 問題：API 403 Forbidden
**解決：** 檢查 Public 角色的 Project 權限是否已勾選

### 問題：圖片無法載入
**解決：** 檢查 `.env` 中的 `VITE_STRAPI_URL` 是否正確設定

### 問題：資料格式錯誤
**解決：** 檢查 `useStrapiProjects` hook 的資料轉換邏輯

### 問題：語言切換沒反應
**解決：** hook 會在語言切換時自動重新解析資料，檢查 Console 是否有錯誤

---

## 📝 下一步

設定完 Public 權限後：

1. ✅ 測試 API 端點
2. ✅ 啟動前端測試
3. ✅ 確認多語言切換正常
4. ✅ 檢查圖片載入
5. ✅ 測試專案詳細頁面

完成後，你的 Portfolio 就完全由 Strapi 驅動了！🎉

