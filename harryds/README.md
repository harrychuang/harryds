# Harry Design System

Harry Design Studio 的可重用元件庫，為 NOEINOI 2025 專案提供基礎元件。

## 快速開始

### 安裝依賴

```bash
npm install
```

### 啟動 Storybook

```bash
npm run storybook
```

Storybook 將在 http://localhost:6006 啟動，您可以在此瀏覽所有元件。

## 專案結構

```
harryds/
├── .storybook/           # Storybook 配置
├── src/
│   ├── components/       # React 元件
│   │   ├── Button/       # 按鈕元件
│   │   │   ├── Button.tsx
│   │   │   ├── Button.scss
│   │   │   ├── Button.stories.tsx
│   │   │   └── index.ts
│   │   └── Card/         # 卡片元件
│   │       ├── Card.tsx
│   │       ├── Card.scss
│   │       ├── Card.stories.tsx
│   │       └── index.ts
│   ├── styles/           # 全域樣式
│   │   └── globals.scss
│   └── index.ts          # 主要匯出檔案
└── package.json
```

## 可用元件

### Button
- 支援 3 種變體：`primary`, `secondary`, `ghost`
- 支援 3 種大小：`sm`, `md`, `lg`
- 支援禁用狀態

### Card
- 支援 3 種變體：`default`, `outlined`, `elevated`
- 可組合的子元件：`CardHeader`, `CardBody`, `CardFooter`

## 使用方式

```typescript
import { Button, Card, CardHeader, CardBody, CardFooter } from '@harryds/components';

// 使用元件
<Button variant="primary" size="lg">
  點擊我
</Button>

<Card>
  <CardHeader>
    <h3>卡片標題</h3>
  </CardHeader>
  <CardBody>
    <p>卡片內容</p>
  </CardBody>
  <CardFooter>
    <Button size="sm">動作</Button>
  </CardFooter>
</Card>
```

## 開發指南

### 新增元件

1. 在 `src/components/` 中建立新資料夾
2. 建立以下檔案：
   - `ComponentName.tsx` - 元件實作
   - `ComponentName.scss` - 元件樣式
   - `ComponentName.stories.tsx` - Storybook 故事
   - `index.ts` - 匯出檔案
3. 更新 `src/components/index.ts` 匯出新元件

## 腳本說明

- `npm run storybook` - 啟動 Storybook 開發環境
- `npm run build-storybook` - 建置 Storybook 靜態檔案
- `npm run build` - 建置元件庫
- `npm run lint` - 檢查程式碼品質
- `npm run format` - 格式化程式碼

---

© 2025 Harry Design Studio / NOEIN Projects