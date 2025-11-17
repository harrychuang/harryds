# Strapi Content Types 設置指南

本指南將引導您在 Strapi 中建立完整的 Content Types 結構，以支援 NOEINOI 作品集專案。

## 🎯 Content Types 架構概覽

```
feed-item (Collection Type)
├── 基本欄位 (heading, date, tags, category, brand, colors)
├── heroImage (Media)
├── content (Dynamic Zone)
│   ├── feed.heading
│   ├── feed.paragraph
│   ├── feed.image
│   ├── feed.video
│   └── feed.list
└── projectInfo (Component)
    ├── 基本欄位 (client, project, roles, description)
    ├── 圖片欄位 (mainImage, specialHeadingImage)
    └── sections (Repeatable Component)
        ├── title
        └── content (Dynamic Zone)
            ├── project.paragraph
            ├── project.quote
            ├── project.blockquote
            └── project.image
```

## 📝 詳細設置步驟

### 步驟 1: 建立 Feed Components

首先建立所有需要的 Components（因為 Collection Type 會依賴這些 Components）。

#### 1.1 建立 Category: `feed`

在 Content-Type Builder 中：
1. 點擊 **Create new component**
2. 選擇 **Create a new category**
3. 輸入 category 名稱: `feed`

#### 1.2 建立 `feed.heading` Component

**Component 名稱:** `heading`  
**Category:** `feed`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `level` | Number | - Format: integer<br>- Default: 1<br>- Min: 1, Max: 3 |
| `content` | Text | - Type: Short text<br>- Required: ✓ |

#### 1.3 建立 `feed.paragraph` Component

**Component 名稱:** `paragraph`  
**Category:** `feed`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `content` | Rich Text | - Required: ✓ |

#### 1.4 建立 `feed.image` Component

**Component 名稱:** `image`  
**Category:** `feed`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `image` | Media | - Type: Single media<br>- Allowed types: images<br>- Required: ✓ |
| `alt` | Text | - Type: Short text |

#### 1.5 建立 `feed.video` Component

**Component 名稱:** `video`  
**Category:** `feed`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `video` | Media | - Type: Single media<br>- Allowed types: videos<br>- Required: ✓ |
| `poster` | Media | - Type: Single media<br>- Allowed types: images |
| `alt` | Text | - Type: Short text |
| `autoplay` | Boolean | - Default: false |
| `loop` | Boolean | - Default: false |
| `muted` | Boolean | - Default: true |
| `controls` | Boolean | - Default: true |

#### 1.6 建立 `feed.list` Component

**Component 名稱:** `list`  
**Category:** `feed`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `items` | JSON | - Required: ✓ |

### 步驟 2: 建立 Project Components

#### 2.1 建立 Category: `project`

1. 點擊 **Create new component**
2. 選擇 **Create a new category**
3. 輸入 category 名稱: `project`

#### 2.2 建立 `project.paragraph` Component

**Component 名稱:** `paragraph`  
**Category:** `project`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `text` | Text | - Type: Long text<br>- Required: ✓ |

#### 2.3 建立 `project.quote` Component

**Component 名稱:** `quote`  
**Category:** `project`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `text` | Text | - Type: Short text<br>- Required: ✓ |

#### 2.4 建立 `project.blockquote` Component

**Component 名稱:** `blockquote`  
**Category:** `project`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `text` | Text | - Type: Long text<br>- Required: ✓ |
| `enableTypewriter` | Boolean | - Default: false |

#### 2.5 建立 `project.image` Component

**Component 名稱:** `image`  
**Category:** `project`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `image` | Media | - Type: Single media<br>- Allowed types: images<br>- Required: ✓ |
| `alt` | Text | - Type: Short text |

#### 2.6 建立 `project.section` Component

**Component 名稱:** `section`  
**Category:** `project`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `title` | Text | - Type: Short text<br>- Required: ✓ |
| `content` | Dynamic Zone | - Components:<br>&nbsp;&nbsp;- `project.paragraph`<br>&nbsp;&nbsp;- `project.quote`<br>&nbsp;&nbsp;- `project.blockquote`<br>&nbsp;&nbsp;- `project.image` |

### 步驟 3: 建立 Project Info Component

#### 3.1 建立 `project.info` Component

**Component 名稱:** `info`  
**Category:** `project`

**欄位：**

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `client` | Text | - Type: Short text |
| `project` | Text | - Type: Short text |
| `roles` | JSON | - (將儲存字串陣列) |
| `description` | Text | - Type: Long text |
| `websiteUrl` | Text | - Type: Short text |
| `websiteLabel` | Text | - Type: Short text |
| `mainImage` | Media | - Type: Single media<br>- Allowed types: images |
| `specialHeadingImage` | Media | - Type: Single media<br>- Allowed types: images |
| `sections` | Component | - Type: Repeatable<br>- Component: `project.section` |

### 步驟 4: 建立 Feed Item Collection Type

現在所有的 Components 都已建立，可以建立主要的 Collection Type。

#### 4.1 建立 `feed-item` Collection Type

1. 在 Content-Type Builder 中，點擊 **Create new collection type**
2. Display name: `Feed Item`
3. API ID (Singular): `feed-item`
4. API ID (Plural): `feed-items`

#### 4.2 添加欄位到 Feed Item

按照以下順序添加欄位：

| 欄位名稱 | 類型 | 設定 |
|---------|------|------|
| `heading` | Text | - Type: Short text<br>- Required: ✓ |
| `date` | Text | - Type: Short text<br>- Required: ✓ |
| `tags` | JSON | - Required: ✓ |
| `category` | Enumeration | - Values: `article`, `project`<br>- Required: ✓<br>- Default: `project` |
| `brand` | Text | - Type: Short text |
| `primaryColor` | Text | - Type: Short text |
| `secondaryColor` | Text | - Type: Short text |
| `heroImage` | Media | - Type: Single media<br>- Allowed types: images |
| `content` | Dynamic Zone | - Components:<br>&nbsp;&nbsp;- `feed.heading`<br>&nbsp;&nbsp;- `feed.paragraph`<br>&nbsp;&nbsp;- `feed.image`<br>&nbsp;&nbsp;- `feed.video`<br>&nbsp;&nbsp;- `feed.list` |
| `projectInfo` | Component | - Type: Single<br>- Component: `project.info` |

#### 4.3 儲存並重新啟動

點擊 **Save** 後，Strapi 會要求重新啟動伺服器。點擊 **Restart** 並等待伺服器重新啟動。

### 步驟 5: 設置 API 權限

為了讓前端應用程式能夠讀取資料，需要設置適當的權限：

1. 進入 **Settings** → **Users & Permissions plugin** → **Roles**
2. 點擊 **Public** role
3. 展開 **Feed-item** 權限
4. 勾選：
   - ✅ `find`
   - ✅ `findOne`
5. 點擊 **Save**

### 步驟 6: 測試 API

在瀏覽器中訪問以下 URL 測試 API：

```
http://localhost:1337/api/feed-items?populate=*
```

如果設置正確，應該會看到 JSON 格式的回應（目前是空陣列，因為還沒有資料）。

## ✅ 驗證清單

- [ ] 所有 feed 類別的 components 已建立
- [ ] 所有 project 類別的 components 已建立
- [ ] feed-item Collection Type 已建立並包含所有欄位
- [ ] API 權限已正確設置
- [ ] API 端點可以正常訪問

## 🎉 下一步

Content Types 設置完成後，您可以：

1. 手動在 Strapi 管理面板中新增內容
2. 或使用我們提供的資料匯入腳本來批量匯入現有的專案資料

執行以下命令來匯入資料：

```bash
npm run import-data
```

## 💡 提示

- 如果在建立過程中遇到錯誤，可以刪除有問題的 Component 或 Collection Type 後重新建立
- Dynamic Zone 的 Components 必須先建立才能在 Dynamic Zone 中選擇
- 建議按照本指南的順序建立，以避免依賴問題
- 可以在 Strapi 管理面板中隨時編輯和調整 Content Types

## 📚 參考資源

- [Strapi Content-Type Builder](https://docs.strapi.io/user-docs/content-type-builder)
- [Strapi Components](https://docs.strapi.io/user-docs/content-type-builder/creating-a-component)
- [Strapi Dynamic Zones](https://docs.strapi.io/user-docs/content-type-builder/creating-a-dynamic-zone)

