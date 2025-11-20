# 資料來源切換功能

## 功能說明

此功能允許在開發和測試時，快速在本地 locales 資料和 Strapi API 資料之間切換，無需修改程式碼。

## 使用方式

### 1. 透過 UI 切換

在 Home 頁面的導航列中，會有一個切換按鈕：
- **`API`** - 使用 Strapi API 資料（預設）
- **`LOC`** - 使用本地 locales 資料

點擊按鈕即可切換資料來源。設定會自動保存到 `localStorage`，下次開啟頁面時會記住您的選擇。

### 2. 程式化切換

如果需要在程式碼中控制資料來源，可以使用 `DataSourceContext`：

```typescript
import { useDataSource } from '../contexts/DataSourceContext';

function MyComponent() {
  const { dataSource, setDataSource, toggleDataSource } = useDataSource();
  
  // 查看當前資料來源
  console.log(dataSource); // 'local' 或 'strapi'
  
  // 設定資料來源
  setDataSource('local');   // 切換到本地資料
  setDataSource('strapi');  // 切換到 Strapi 資料
  
  // 切換資料來源
  toggleDataSource();       // 在 local 和 strapi 之間切換
}
```

## 資料來源說明

### Strapi API（預設）
- 資料來源：從 Strapi CMS 後端 API 取得
- 優點：即時更新、支援媒體管理、多語言自動處理
- 使用場景：正式環境、測試最新資料

### 本地 Locales
- 資料來源：`src/i18n/locales/{語言}/projects.json`
- 優點：不需要網路連線、載入快速、便於離線開發
- 使用場景：離線開發、測試前端功能、無 Strapi 環境時

## 實作架構

### 核心檔案

1. **`src/contexts/DataSourceContext.tsx`**
   - 管理資料來源狀態（local / strapi）
   - 提供切換功能和狀態管理

2. **`src/hooks/useLocalProjects.ts`**
   - 從 i18n locales 載入專案資料
   - 處理本地圖片路徑解析
   - 轉換資料格式為 FeedItem

3. **`src/hooks/useStrapiProjects.ts`**
   - 從 Strapi API 取得專案資料
   - 處理多語言和圖片 URL

4. **`src/hooks/useProjects.ts`**
   - 統一的資料介面
   - 根據 DataSourceContext 自動選擇資料來源
   - 返回相同格式的資料結構

### 整合方式

在 `App.tsx` 中使用 `DataSourceProvider` 包裹應用：

```tsx
import { DataSourceProvider } from './contexts/DataSourceContext';

function App() {
  return (
    <DataSourceProvider>
      {/* 其他 Providers 和組件 */}
    </DataSourceProvider>
  );
}
```

在需要專案資料的組件中使用 `useProjects` hook：

```tsx
import { useProjects } from '../hooks/useProjects';

function Home() {
  const { items, loading, error, dataSource } = useProjects();
  
  // items 的資料結構與格式完全相同，無論資料來自哪裡
  // dataSource 可以用來顯示當前資料來源（可選）
}
```

## 資料格式

兩種資料來源都會轉換為相同的 `FeedItem` 格式：

```typescript
interface FeedItem {
  id: number;
  heading: string;
  date: string;
  tags: string[];
  category: string;
  brand?: string;
  primaryColor?: string;
  secondaryColor?: string;
  heroImage?: string;
  projectInfo?: ProjectInfo;
}
```

## 注意事項

1. **圖片路徑處理**
   - Strapi 資料：使用完整的 URL 或相對於 Strapi 伺服器的路徑
   - 本地資料：使用 Vite 的 `import.meta.glob` 解析 assets 目錄中的圖片

2. **多語言支援**
   - Strapi：多語言資料儲存在同一個物件的不同屬性中
   - 本地：不同語言有獨立的 JSON 檔案

3. **資料同步**
   - 本地 locales 資料需要手動更新
   - Strapi 資料會自動從 API 取得最新版本

4. **開發建議**
   - 開發前端 UI 時使用本地資料（快速、離線）
   - 測試 CMS 整合時使用 Strapi 資料
   - 部署前確保兩種資料來源都能正常運作

## 未來擴充

如果需要擴充到其他頁面（如 Articles），可以：

1. 建立類似的 `useLocalArticles` hook
2. 建立統一的 `useArticles` hook
3. 在對應頁面使用新的 hook

範例：

```typescript
// src/hooks/useArticles.ts
export function useArticles() {
  const { dataSource } = useDataSource();
  
  const strapiData = useStrapiArticles();
  const localData = useLocalArticles();
  
  return dataSource === 'local' ? localData : strapiData;
}
```

