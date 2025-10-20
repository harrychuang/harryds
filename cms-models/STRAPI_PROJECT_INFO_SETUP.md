# Strapi Project Info 結構設定指南

這份文檔說明如何在 Strapi 中設定 ProjectInfo 結構，以對應 `feed.json` 的資料格式。

## 📋 目錄

1. [Components 結構](#components-結構)
2. [Feed Item Content Type 更新](#feed-item-content-type-更新)
3. [範例資料](#範例資料)

---

## 1. Components 結構

### 📁 Project Section Content Components

在 Strapi 中創建以下 Components（位於 `project` 類別）：

#### 1.1 `project.paragraph`
```json
{
  "displayName": "Project Paragraph",
  "category": "project",
  "attributes": {
    "text": {
      "type": "text",
      "required": true
    }
  }
}
```

#### 1.2 `project.quote`
```json
{
  "displayName": "Project Quote",
  "category": "project",
  "attributes": {
    "text": {
      "type": "text",
      "required": true
    }
  }
}
```

#### 1.3 `project.blockquote`
```json
{
  "displayName": "Project Blockquote",
  "category": "project",
  "attributes": {
    "text": {
      "type": "text",
      "required": true
    },
    "enableTypewriter": {
      "type": "boolean",
      "default": false
    }
  }
}
```

#### 1.4 `project.image`
```json
{
  "displayName": "Project Image",
  "category": "project",
  "attributes": {
    "image": {
      "type": "media",
      "multiple": false,
      "required": true,
      "allowedTypes": ["images"]
    },
    "alt": {
      "type": "string"
    }
  }
}
```

---

### 📁 Project Section Component

#### `project.section`
```json
{
  "displayName": "Project Section",
  "category": "project",
  "attributes": {
    "title": {
      "type": "string",
      "required": true
    },
    "content": {
      "type": "dynamiczone",
      "components": [
        "project.paragraph",
        "project.quote",
        "project.blockquote",
        "project.image"
      ]
    }
  }
}
```

---

### 📁 Project Info Component

#### `project.info`
```json
{
  "displayName": "Project Info",
  "category": "project",
  "attributes": {
    "client": {
      "type": "string"
    },
    "project": {
      "type": "string"
    },
    "roles": {
      "type": "json"
    },
    "description": {
      "type": "text"
    },
    "websiteUrl": {
      "type": "string"
    },
    "websiteLabel": {
      "type": "string"
    },
    "mainImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "specialHeadingImage": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "sections": {
      "type": "component",
      "repeatable": true,
      "component": "project.section"
    }
  }
}
```

---

## 2. Feed Item Content Type 更新

更新 `feed-item` Content Type，添加 `projectInfo` 欄位：

```json
{
  "kind": "collectionType",
  "collectionName": "feed_items",
  "info": {
    "singularName": "feed-item",
    "pluralName": "feed-items",
    "displayName": "Feed Item",
    "description": ""
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "heading": {
      "type": "string",
      "required": true
    },
    "date": {
      "type": "string",
      "required": true
    },
    "tags": {
      "type": "json"
    },
    "category": {
      "type": "enumeration",
      "enum": ["article", "project"],
      "required": true
    },
    "brand": {
      "type": "string"
    },
    "primaryColor": {
      "type": "string"
    },
    "secondaryColor": {
      "type": "string"
    },
    "heroImage": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["images"]
    },
    "content": {
      "type": "dynamiczone",
      "components": [
        "feed.heading",
        "feed.paragraph",
        "feed.image",
        "feed.video",
        "feed.list"
      ]
    },
    "projectInfo": {
      "type": "component",
      "repeatable": false,
      "component": "project.info"
    }
  }
}
```

---

## 3. 範例資料

### 完整的 Feed Item 範例（對應 feed.json）

```json
{
  "heading": "Shopmatic Design System",
  "date": "Jan 01, 2025 - Jun 30, 2025",
  "tags": ["UI", "UX", "DEV"],
  "category": "project",
  "brand": "Shopmatic",
  "primaryColor": "#FF1650",
  "secondaryColor": "#151648",
  "heroImage": "<上傳圖片>",
  "projectInfo": {
    "client": "awwrated",
    "project": "Design System",
    "roles": ["UIUX Design", "Design System", "Development"],
    "description": "Introducing the Shopmatic Design System: a framework to streamline design and enhance user experience...",
    "websiteUrl": "https://awwrated.com",
    "websiteLabel": "VISIT WEBSITE",
    "mainImage": "<上傳 demo-shopmatic-01.jpg>",
    "specialHeadingImage": "<上傳 project-awwrated-heading-img.png>",
    "sections": [
      {
        "title": "Scope",
        "content": [
          {
            "__component": "project.paragraph",
            "text": "The Shopmatic Design System optimizes design processes..."
          },
          {
            "__component": "project.paragraph",
            "text": "Designed for collaboration and consistency..."
          },
          {
            "__component": "project.image",
            "image": "<上傳 demo-shopmatic-02.jpg>",
            "alt": "Shopmatic Design System Interface"
          }
        ]
      },
      {
        "title": "Impact",
        "content": [
          {
            "__component": "project.paragraph",
            "text": "The Shopmatic Design System has a significant impact..."
          },
          {
            "__component": "project.quote",
            "text": "\"Rating Credibility\" Rule: Weighted by the number of raters..."
          },
          {
            "__component": "project.blockquote",
            "text": "The Shopmatic Design System ensures a cohesive, user-friendly experience...",
            "enableTypewriter": true
          },
          {
            "__component": "project.image",
            "image": "<上傳 demo-shopmatic-03.jpg>"
          }
        ]
      },
      {
        "title": "GET IN TOUCH",
        "content": [
          {
            "__component": "project.paragraph",
            "text": "If you're interested in the Shopmatic Design System..."
          },
          {
            "__component": "project.paragraph",
            "text": "Don't hesitate to contact me at harrychuang23@gmail.com."
          }
        ]
      }
    ]
  }
}
```

---

## 🎯 資料流程

```
Strapi CMS
  ↓
strapiClient.ts (mapProjectInfo)
  ↓
FeedItem.projectInfo (TypeScript 類型)
  ↓
Home.tsx (傳入 FeedDetailOverlay)
  ↓
FeedDetailOverlay.tsx (渲染)
```

---

## ⚙️ 設定步驟

1. **在 Strapi Content-Type Builder 中**：
   - 創建所有 `project.*` Components
   - 更新 `feed-item` Content Type 添加 `projectInfo` 欄位

2. **重啟 Strapi**：
   ```bash
   cd cms
   npm run develop
   ```

3. **在 Strapi Admin 中**：
   - 創建或編輯 Feed Items
   - 使用 `projectInfo` 欄位添加專案資訊
   - 上傳對應的圖片（mainImage, specialHeadingImage）
   - 添加 sections 與內容

4. **測試 Portfolio**：
   - 確保 `.env` 中設定了 `VITE_STRAPI_URL`
   - 啟動 portfolio：`npm run dev`
   - 檢查 console 是否有 Strapi 映射的 log

---

## 📝 注意事項

- `roles` 欄位在 Strapi 中使用 JSON 類型，格式為：`["Role 1", "Role 2", "Role 3"]`
- 圖片會自動通過 `strapiClient.ts` 的 `resolveMediaUrl` 轉換為完整 URL
- `enableTypewriter` 為 true 的 blockquote 會觸發打字機效果
- Email 會自動被識別並轉換為可點擊連結

---

## 🔄 與 feed.json 的對應

| feed.json | Strapi Component |
|-----------|------------------|
| `projectInfo` | `project.info` |
| `projectInfo.sections` | `project.section[]` |
| `section.content (paragraph)` | `project.paragraph` |
| `section.content (quote)` | `project.quote` |
| `section.content (blockquote)` | `project.blockquote` |
| `section.content (image)` | `project.image` |

---

## ✅ 驗證清單

- [ ] 所有 `project.*` Components 已創建
- [ ] `feed-item` Content Type 已添加 `projectInfo` 欄位
- [ ] Strapi 已重啟
- [ ] 測試資料已輸入
- [ ] Portfolio 可以正確顯示專案資訊
- [ ] 左側 meta 區域顯示正確（Client, Project, Roles）
- [ ] 主圖片和特殊主圖顯示正確
- [ ] Sections 內容正確渲染
- [ ] 打字機效果正常運作

---

完成後，Strapi 的資料結構就會與 `feed.json` 完全一致！🎉

