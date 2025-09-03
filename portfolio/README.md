# Portfolio (Harry Design Studio)

這是工作室網站前端（React + Vite + TypeScript）。目前使用「方案 A（Monorepo 直連）」從 `@harryds/` 引用元件。

## 開發環境

- Node 18+
- 套件管理：npm（或支援 npm workspaces 的替代品）

### 安裝與啟動

```bash
npm install
npm run dev
```

## 元件引用（方案 A）

本專案以 Vite alias 連結至設計系統原始碼：
- `vite.config.ts`
  - `hds -> ../harryds/src`
  - `server.fs.allow` 允許讀取 monorepo 上層目錄
- `tsconfig.json` 透過 `paths` 對應同一路徑

使用方式（範例）：
```tsx
import { PixelText } from 'hds';

export function Example() {
  return (
    <PixelText text="HARRY" textEnabled pixelSize={4} width={360} height={60} />
  );
}
```

如需沿用設計系統的全域樣式，可在入口檔加：
```ts
import '../harryds/src/styles/globals.scss';
```

未來切換至「方案 B（Workspaces 套件化）」時，維持 `from 'hds'` 的匯入即可，調整在封裝與安裝（見下方「升級至方案 B」）。

## 路由結構

- `/`：首頁（作品）
- `/about`：關於

使用 `react-router-dom@6`。入口：`src/App.tsx`。

## 主題（Theme）

- 支援 `light` / `dark`
- 預設跟隨系統偏好（`prefers-color-scheme`）
- 使用者切換後記錄於 `localStorage`
- 實作於 `src/theme/useTheme.ts`
- HTML `<html>` 會加上 `theme="dark"`（供 HDS token 監聽），同時 `body[data-theme=...]` 控制頁面基底色彩

## 多國語系（i18n）

- 使用 `i18next` + `react-i18next` + `i18next-browser-languagedetector`
- 語系：繁中（`zh-Hant`）、英文（`en`）、日文（`ja`）
- 偵測順序：`?lang=xx` → `localStorage` → `navigator` → `htmlTag`
- 語系檔：`src/i18n/locales/*.json`
- 初始化：`src/i18n/index.ts`

切換語系（範例）：
```ts
import i18n from './i18n';
i18n.changeLanguage('en');
```

## 部署建議

若以 SPA 靜態部署：
- 產出：`npm run build` → `dist/`
- Nginx 範例（SPA fallback）：
```nginx
location / { try_files $uri $uri/ /index.html; }
```

若部署在子路徑（如 `/studio/`）：
- `vite.config.ts` 設定 `base: '/studio/'`

雲端平台（建議）：
- Vercel / Netlify / Cloudflare Pages
  - 指向 `portfolio/`
  - Build Command: `npm run build`
  - Output: `dist`

## 升級至方案 B（Workspaces 套件化）

- 根目錄 `package.json` 建立 workspaces：
```json
{
  "private": true,
  "workspaces": ["harryds", "portfolio"]
}
```
- `harryds/package.json` 設定 `name: "hds"` 與 `main/module/types/exports`，並輸出 `dist/`
- `portfolio/package.json` 依賴改為：
```json
{
  "dependencies": {
    "hds": "workspace:*"
  }
}
```
- 移除本專案的 Vite alias 與 TS paths 對 `hds` 的映射
- 若集中輸出 CSS，入口引入 `import 'hds/dist/style.css'`

## 資料夾結構（節選）

```
portfolio/
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  └─ About.tsx
│  ├─ theme/
│  │  └─ useTheme.ts
│  ├─ i18n/
│  │  ├─ index.ts
│  │  └─ locales/{zh-Hant,en,ja}.json
│  └─ styles/
│     └─ globals.scss
```

## 相依性說明

- React 18、React Router 6
- i18next、react-i18next、語言自動偵測
- three / @types/three：供 `hds` 元件（如 `PixelText`、`PixelImage` 等）在開發期使用

## 注意事項

- 目前採 A 方案，需確保 `harryds/` 與 `portfolio/` 同在 monorepo，且本機/CI 能存取 `../harryds`。
- 如引用音效/圖片跨網域，記得設定 CORS。

---
© 2025 Harry Design Studio / NOEIN Projects
