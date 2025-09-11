# NOEINOI 2025

## 專案概述

NOEINOI 2025 是 Harry Design Studio 的個人作品集專案，展示創新的設計和技術實現。本專案整合了現代前端技術、3D 視覺效果，以及可重用的設計系統，為訪客提供沉浸式的作品展示體驗。

## AI Agent 開發指南

⚠️ **重要提醒：未來的 AI Agent 在開發此專案時，請務必先詳細閱讀本文件中的規範和說明，確保遵循既定的架構原則和開發標準。**

## 專案結構

```
dev/
├── README.md                    # 專案說明文件
├── portfolio/                   # 主要作品集應用
│   ├── src/
│   │   ├── components/         # React 元件
│   │   ├── styles/            # SCSS 樣式文件
│   │   ├── assets/            # 靜態資源
│   │   ├── pages/             # 頁面元件
│   │   ├── hooks/             # 自定義 React Hooks
│   │   ├── utils/             # 工具函數
│   │   └── three/             # Three.js 3D 相關
│   ├── public/                # 公開資源
│   └── package.json
├── harryds/                    # Harry Design System 元件庫
│   ├── src/
│   │   ├── components/        # 可重用元件
│   │   │   ├── Button/        # 按鈕元件
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.scss
│   │   │   │   ├── Button.stories.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Card/          # 卡片元件
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Card.scss
│   │   │   │   ├── Card.stories.tsx
│   │   │   │   └── index.ts
│   │   │   └── ...            # 其他元件，結構相同
│   │   ├── tokens/            # 設計 tokens (顏色、字型、間距等)
│   │   ├── styles/            # 全域樣式和 mixins
│   │   └── utils/             # 樣式工具函數
│   ├── .storybook/            # Storybook 配置
│   └── package.json
├── shared/                     # 共用資源
│   ├── styles/                # 共用 SCSS 變數和 mixins
│   ├── types/                 # TypeScript 類型定義
│   └── constants/             # 常數定義
├── docs/                      # 專案文件
├── tests/                     # 測試文件
└── config/                    # 配置文件
```

## 開始使用

### 環境需求

- Node.js (建議版本 18.x 或更高)
- npm 或 yarn
- Git
- 支援 WebGL 的現代瀏覽器 (用於 Three.js 3D 效果)

### 安裝步驟

1. 複製專案到本地
```bash
git clone [repository-url]
cd "noeinoi 2025/dev"
```

2. 安裝主專案依賴
```bash
cd portfolio
npm install
```

3. 安裝 Harry Design System 依賴
```bash
cd ../harryds
npm install
```

4. 啟動設計系統 (Storybook)
```bash
npm run storybook
```

5. 啟動作品集開發環境
```bash
cd ../portfolio
npm run dev
```

## 開發指南

### 程式碼規範

- 使用 TypeScript 進行開發
- 遵循 ESLint 配置規則
- 使用 Prettier 格式化程式碼
- 撰寫單元測試覆蓋核心功能

### 開發原則

#### 可重用性優先
- **元件共用**: 所有 UI 元件必須設計為可重用，避免重複開發
- **樣式共用**: CSS/SCSS 變數、mixins 和工具類別需要集中管理
- **設計 Token**: 使用統一的設計 token 系統管理顏色、字型、間距等
- **元件庫**: 所有元件都要在 Storybook 中建立文件和範例

#### 技術棧限制
- **前端框架**: 僅使用 React + TypeScript
- **樣式**: 僅使用 SCSS，禁止使用 CSS-in-JS 或其他樣式方案
- **3D 效果**: 僅使用 Three.js，禁止使用 CSS 3D Transform
- **元件文件**: 使用 Storybook 進行元件開發和文件化

### 分支管理

- `main` - 主分支，穩定版本
- `develop` - 開發分支
- `feature/*` - 功能分支
- `hotfix/*` - 緊急修復分支

### 提交規範

使用 Conventional Commits 規範：

```
feat: 新增功能
fix: 修復錯誤
docs: 文件更新
style: 程式碼格式調整
refactor: 程式碼重構
test: 測試相關
chore: 其他雜項
```

## 功能特色

### 作品集核心功能
- [ ] 響應式作品展示頁面
- [ ] 互動式 3D 視覺效果 (Three.js)
- [ ] 作品分類和篩選系統
- [ ] 個人簡介和聯絡資訊
- [ ] 專案詳細頁面

### 設計系統
- [ ] 可重用元件庫
- [ ] 統一的設計 token 系統
- [ ] Storybook 文件化
- [ ] 響應式設計規範
- [ ] 無障礙設計支援

### 技術特色
- [ ] Three.js 3D 場景整合
- [ ] 平滑的頁面轉場效果
- [ ] 效能優化和懶加載
- [ ] SEO 友善結構
- [ ] 行動裝置優化

## 技術架構

### 前端技術棧

#### 核心技術
- **React 18+** - 主要前端框架
- **TypeScript** - 型別安全的 JavaScript
- **SCSS** - CSS 預處理器，支援變數和 mixins
- **Three.js** - 3D 圖形和動畫效果
- **React Router** - 客戶端路由管理

#### 開發工具
- **Vite** - 快速的建置工具
- **Storybook** - 元件開發和文件化
- **ESLint + Prettier** - 程式碼品質和格式化
- **Jest + Testing Library** - 單元測試框架

#### 設計系統架構
- **Design Tokens**: 統一的設計變數系統
- **Component Library**: 可重用的 React 元件
- **SCSS Architecture**: 模組化的樣式架構
  - `_variables.scss` - 全域變數
  - `_mixins.scss` - 可重用的樣式函數
  - `_utilities.scss` - 工具類別
  - `_base.scss` - 基礎樣式重置

### 靜態網站架構

由於這是個人作品集專案，採用靜態網站生成方式：
- **部署**: Vercel / Netlify / GitHub Pages
- **內容管理**: 靜態檔案 + Markdown
- **圖片優化**: 響應式圖片和懶加載
- **SEO**: 靜態生成的 meta 標籤和結構化資料

## 開發工作流程

### Harry Design System 優先開發
1. **設計 Token 定義**: 在 `harryds/src/tokens/` 中定義顏色、字型、間距等
2. **元件開發**: 在 `harryds/src/components/ComponentName/` 中開發可重用元件
3. **Stories 撰寫**: 在每個元件資料夾中撰寫 `ComponentName.stories.tsx`
4. **樣式驗證**: 確保元件在不同狀態下的視覺一致性

### 元件開發標準結構
每個元件都應該遵循以下資料夾結構：
```
harryds/src/components/ComponentName/
├── ComponentName.tsx        # 元件主體
├── ComponentName.scss       # 元件樣式
├── ComponentName.stories.tsx # Storybook 故事
├── ComponentName.test.tsx   # 單元測試
└── index.ts                 # 匯出檔案
```

### 作品集開發流程
1. **引用 HarryDS**: 從 Harry Design System 匯入所需元件和樣式
2. **頁面組合**: 使用現有元件組合頁面，避免重複開發
3. **3D 效果整合**: 使用 Three.js 添加互動式 3D 元素
4. **效能優化**: 確保 3D 效果不影響整體效能

## 部署

### 開發環境

#### 啟動 Harry Design System
```bash
cd harryds
npm run storybook  # 訪問 http://localhost:6006
```

#### 啟動作品集
```bash
cd portfolio
npm run dev        # 訪問 http://localhost:5173
```

### 生產環境
```bash
# 建置 Harry Design System
cd harryds
npm run build

# 建置作品集
cd ../portfolio
npm run build

# 部署到靜態主機
npm run deploy
```

## 測試

### Harry Design System 測試
```bash
cd harryds
npm test                    # 元件單元測試
npm run test:visual         # 視覺回歸測試 (Storybook)
npm run test:a11y           # 無障礙測試
```

### 作品集測試
```bash
cd portfolio
npm test                    # 單元測試
npm run test:coverage       # 測試覆蓋率
npm run test:e2e            # 端對端測試
npm run test:performance    # 效能測試
```

## 元件庫使用指南

### 從 Harry Design System 匯入元件
```typescript
// 正確的匯入方式
import { Button, Card, Typography } from 'hds';
import { colors, spacing, typography } from 'hds/tokens';

// 錯誤：不要直接複製元件程式碼到作品集中
```

### 樣式變數使用
```scss
// 使用設計 token
@import '@shared/styles/variables';

.my-component {
  color: $color-primary;
  margin: $spacing-md;
  font-size: $font-size-lg;
  
  // 使用共用 mixin
  @include responsive-breakpoint('tablet') {
    font-size: $font-size-xl;
  }
}
```

### Three.js 整合範例
```typescript
// 在 portfolio/src/three/ 中組織 3D 相關程式碼
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three';
import { useThree } from '@react-three/fiber';

// 確保 3D 效果不影響主要內容的載入
const LazyThreeScene = lazy(() => import('./ThreeScene'));
```

## 重要開發注意事項

### ⚠️ 共用性原則
- **絕對禁止重複開發**: 開發任何新功能前，必須先檢查設計系統中是否已有相似元件
- **樣式統一性**: 所有樣式變數必須來自 `shared/styles/` 或 `harryds/tokens/`
- **元件擴展**: 如需修改現有元件，應該擴展原有元件而非創建新的
- **文件更新**: 新增或修改元件時，必須同步更新 Storybook 文件

### 🎨 設計系統工作流程
1. **Token First**: 任何視覺變更都應該從設計 token 開始
2. **Component Second**: 基於 token 開發或修改元件
3. **Story Third**: 在 Storybook 中記錄元件的所有變體
4. **Integration Last**: 將元件整合到作品集中

### 🚀 效能考量
- **Three.js 最佳化**: 3D 場景必須支援降級和懶加載
- **程式碼分割**: 大型 3D 模型和複雜動畫需要動態匯入
- **響應式載入**: 根據裝置效能調整 3D 品質

## 貢獻指南

### 開發流程
1. 檢查 Harry Design System 是否有相關元件
2. 如無相關元件，先在 `harryds/` 中開發
3. 在元件資料夾中撰寫 `.stories.tsx` 文件
4. 創建功能分支 (`git checkout -b feature/component-name`)
5. 提交變更 (`git commit -m 'feat: add reusable component'`)
6. 推送到分支並開啟 Pull Request

### Code Review 檢查清單
- [ ] 是否重用了現有元件？
- [ ] 是否使用了統一的設計 token？
- [ ] 是否更新了 Storybook 文件？
- [ ] Three.js 效果是否有效能優化？
- [ ] 是否通過無障礙測試？

## 版本歷史

### v1.0.0 (計劃中)
- 初始版本發布
- 核心功能實現

## 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

## 專案資源

### Harry Design System 文件
- **Storybook**: [本地開發時訪問 http://localhost:6006](http://localhost:6006)
- **設計 Token**: `harryds/src/tokens/`
- **元件文件**: 各元件資料夾中的 `.stories.tsx` 檔案

### 技術文件
- **Three.js 官方文件**: [threejs.org](https://threejs.org/)
- **React 文件**: [react.dev](https://react.dev/)
- **SCSS 指南**: [sass-lang.com](https://sass-lang.com/)

## 聯絡資訊

- **設計師**: Harry Design Studio
- **專案類型**: 個人作品集網站
- **開發年份**: 2025

## 致謝

感謝所有為此專案貢獻的開發者和設計師。特別感謝開源社群提供的優秀工具和框架。

---

© 2025 Harry Design Studio / NOEIN Projects. All rights reserved.

---

## 📋 AI Agent 快速參考

當 AI Agent 需要開發此專案時，請記住：

1. ✅ **必須先讀取此 README**
2. ✅ **優先使用 Harry Design System 中的現有元件**
3. ✅ **使用 React + SCSS + TypeScript**
4. ✅ **3D 效果僅使用 Three.js**
5. ✅ **在 Storybook 中記錄所有元件**
6. ❌ **禁止重複開發相似功能**
7. ❌ **禁止使用 CSS-in-JS 或其他樣式方案**
8. ❌ **禁止使用 CSS 3D Transform**

## Strapi（CMS）整合

### 目錄建議

- CMS 專案建議放在 `dev/cms/` 目錄。

### 建立專案（開發用 SQLite）

```bash
cd "/Users/HarryChuang/Dropbox/Works/NOEIN Projects/noeinoi 2025/dev"
npx create-strapi-app@latest cms --quickstart --no-run
cd cms
npm install
npm run develop  # 首次啟動會建立 Admin 帳號
```

### 建立內容模型（依 UI 建立或參考樣板）

- Collection Type: `feed-item`
  - `heading` (string, required)
  - `date` (string, required)
  - `tags` (json)
  - `category` (enum: project, article, required)
  - `brand` (string)
  - `primaryColor` (string)
  - `secondaryColor` (string)
  - `heroImage` (media, single)
  - `content` (dynamic zone: `feed.heading`, `feed.paragraph`, `feed.image`, `feed.list`)

- Components（Dynamic Zone 用）：
  - `feed.heading` { level: enum(1,2,3), content: text }
  - `feed.paragraph` { content: richtext }
  - `feed.image` { image: media single, alt: string }
  - `feed.list` { items: json(string[]) }

樣板 JSON 位置：`dev/cms-models/`（僅作參考，請在 Strapi Admin 中建立或依 Strapi 檔案結構放置）。

### 開放公開讀取權限（僅前台瀏覽用）

- Strapi Admin → Settings → Roles → Public
  - 勾選 `feed-item` 的 `find`, `findOne`
  - 勾選 `upload` 的讀取權限（至少 `find`, `findOne`）

### 前端環境變數（portfolio）

在 `portfolio/.env` 設定：

```bash
VITE_STRAPI_URL=http://localhost:1337
```

前端會優先向 `VITE_STRAPI_URL` 讀取，失敗時回退至 `shared/data/feed.json`。

### 圖片與 URL

- 前端自動將 Strapi 回傳的相對路徑（如 `/uploads/...`）拼接為完整 URL。
- 若未設定 `VITE_STRAPI_URL`，將直接使用相對路徑（可能導致圖片無法跨源載入）。

### 匯入初始資料（可選）

- 可撰寫腳本將 `shared/data/feed.json` 轉入 Strapi，或於 Admin 以手動方式建立內容與上傳圖片。

