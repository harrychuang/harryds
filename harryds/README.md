# Harry Design System

Harry Design Studio 的 Storybook 開發環境，為 NOEINOI 2025 專案提供元件開發基礎。

## 快速開始

### 安裝依賴

```bash
npm install
```

### 啟動 Storybook

```bash
npm run storybook
```

Storybook 將在 http://localhost:6006 啟動。

## 專案結構

```
harryds/
├── .storybook/           # Storybook 配置
├── src/
│   ├── components/       # React 元件 (目前為空)
│   ├── styles/           # 全域樣式
│   │   └── globals.scss
│   ├── Welcome.stories.tsx # 歡迎頁面
│   └── index.ts          # 主要匯出檔案
└── package.json
```

## 開發指南

### 新增元件

1. 在 `src/components/` 中建立新資料夾 `ComponentName/`
2. 建立以下檔案：
   - `ComponentName.tsx` - 元件實作
   - `ComponentName.scss` - 元件樣式
   - `ComponentName.stories.tsx` - Storybook 故事
   - `index.ts` - 匯出檔案
3. 更新 `src/components/index.ts` 匯出新元件

### 元件範例結構

```typescript
// ComponentName.tsx
import React from 'react';
import './ComponentName.scss';

export interface ComponentNameProps {
  children: React.ReactNode;
}

export const ComponentName: React.FC<ComponentNameProps> = ({ children }) => {
  return <div className="hds-component-name">{children}</div>;
};
```

```typescript
// ComponentName.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta: Meta<typeof ComponentName> = {
  title: 'Components/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '範例內容',
  },
};
```

## 腳本說明

- `npm run storybook` - 啟動 Storybook 開發環境
- `npm run build-storybook` - 建置 Storybook 靜態檔案
- `npm run build` - 建置元件庫
- `npm run lint` - 檢查程式碼品質
- `npm run format` - 格式化程式碼

---

© 2025 Harry Design Studio / NOEIN Projects