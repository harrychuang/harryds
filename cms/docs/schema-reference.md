# Strapi Schema 參考文件

這份文件提供了完整的 Strapi Content Type Schema JSON 參考，方便快速設置或備份。

## 📦 Feed Item Collection Type Schema

如果您想要快速設置，可以使用以下 schema。

### 檔案位置

建立以下目錄結構：

```
cms/
└── src/
    └── api/
        └── feed-item/
            └── content-types/
                └── feed-item/
                    └── schema.json
```

### schema.json 內容

由於 Strapi 的 schema 是自動生成的，建議先手動在管理面板中建立 Content Types（參考 `strapi-setup.md`），然後 Strapi 會自動生成對應的 schema 檔案。

生成後的 schema 檔案會位於上述位置，您可以：
1. 備份這個檔案以供未來使用
2. 在新的 Strapi 安裝中使用這個檔案快速重建結構

## 🔧 Component Schemas

Components 的 schema 也會自動生成在：

```
cms/
└── src/
    └── components/
        ├── feed/
        │   ├── heading.json
        │   ├── paragraph.json
        │   ├── image.json
        │   ├── video.json
        │   └── list.json
        └── project/
            ├── paragraph.json
            ├── quote.json
            ├── blockquote.json
            ├── image.json
            ├── section.json
            └── info.json
```

## 📋 Schema 結構說明

### Collection Type Schema 基本結構

```json
{
  "kind": "collectionType",
  "collectionName": "feed_items",
  "info": {
    "singularName": "feed-item",
    "pluralName": "feed-items",
    "displayName": "Feed Item",
    "description": "作品集項目（文章與專案）"
  },
  "options": {
    "draftAndPublish": true
  },
  "pluginOptions": {},
  "attributes": {
    // 欄位定義...
  }
}
```

### 欄位類型對照表

| 前端 Type | Strapi Field Type | Schema 設定 |
|-----------|-------------------|-------------|
| `string` | Text | `{ "type": "string" }` |
| `string (long)` | Text (Long) | `{ "type": "text" }` |
| `number` | Number | `{ "type": "integer" }` |
| `boolean` | Boolean | `{ "type": "boolean" }` |
| `string[]` | JSON | `{ "type": "json" }` |
| `enum` | Enumeration | `{ "type": "enumeration", "enum": [...] }` |
| `image` | Media | `{ "type": "media", "multiple": false, "allowedTypes": ["images"] }` |
| `video` | Media | `{ "type": "media", "multiple": false, "allowedTypes": ["videos"] }` |

### Component 欄位

```json
{
  "type": "component",
  "repeatable": false,
  "component": "project.info"
}
```

### Dynamic Zone 欄位

```json
{
  "type": "dynamiczone",
  "components": [
    "feed.heading",
    "feed.paragraph",
    "feed.image",
    "feed.video",
    "feed.list"
  ]
}
```

## 🔄 匯出與匯入 Schema

### 匯出現有 Schema

完成手動設置後，可以備份整個 `src` 資料夾：

```bash
cd cms
tar -czf strapi-schemas-backup.tar.gz src/
```

### 匯入 Schema 到新的 Strapi 專案

```bash
# 解壓縮 schema 備份
tar -xzf strapi-schemas-backup.tar.gz

# 重新啟動 Strapi
npm run develop
```

Strapi 會自動讀取 schema 檔案並建立對應的 Content Types。

## ⚠️ 注意事項

1. **不要手動編輯 schema JSON**（除非您非常熟悉 Strapi）
   - 建議使用管理面板的 Content-Type Builder
   - Strapi 會自動生成和更新 schema 檔案

2. **schema 檔案應該提交到版本控制**
   - 這些檔案應該被 git 追蹤
   - 方便團隊協作和部署

3. **修改 schema 後需要重新啟動**
   - 在管理面板中修改後，Strapi 會自動重新啟動
   - 手動修改檔案後需要手動重啟

4. **資料庫遷移**
   - Strapi 會自動處理資料庫 schema 的變更
   - 使用 SQLite 時，變更會立即生效
   - 使用 PostgreSQL/MySQL 時，建議先備份資料庫

## 🔍 檢查 Schema

檢查當前的 Content Types：

```bash
# 查看所有 schema 檔案
find src -name "schema.json" -o -name "*.json"
```

## 📚 參考資料

- [Strapi Schema 文件](https://docs.strapi.io/dev-docs/backend-customization/models)
- [Content-Type Builder](https://docs.strapi.io/user-docs/content-type-builder)
- [Components](https://docs.strapi.io/dev-docs/backend-customization/models#components)

