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
│   │   ├── globals.scss  # 全域樣式和重置
│   │   └── tokens.scss   # Design Tokens
│   ├── Welcome.stories.tsx # 歡迎頁面
│   └── index.ts          # 主要匯出檔案
└── package.json
```

## Design Tokens

Harry Design System 採用雙層式 Design Tokens 架構，確保設計一致性和可維護性。

### 架構說明

#### 1. REF TOKENS（參考代幣）
基礎的設計值，定義原始的顏色、尺寸和字體大小：

```scss
// 顏色系統
--hds-ref-color-dark-100a: #111111;     // 純黑色
--hds-ref-color-dark-80a: rgba(17 17 17 / 0.8);  // 80% 透明度
// ... 其他透明度變化

--hds-ref-color-light-100a: #ffffff;    // 純白色
--hds-ref-color-light-80a: rgba(255 255 255 / 0.8); // 80% 透明度
// ... 其他透明度變化

// 品牌色彩
--hds-ref-color-brand-50: #111111;
--hds-ref-color-green-50: #1ade99;
--hds-ref-color-red-50: #f03fa6;
--hds-ref-color-yellow-50: #e1aa2b;
--hds-ref-color-blue-50: #4f72fd;

// 透明度系統
--hds-ref-opacity-90a: 90%;
--hds-ref-opacity-80a: 80%;
// ... 其他透明度值

// 尺寸系統（提供 px 和 rem 版本）
--hds-ref-size-5: 5px;
--hds-ref-size-5-rem: 0.3125rem;
// ... 其他尺寸
```

#### 2. SYS TOKENS（系統代幣）
語意化的代幣，將參考代幣對應到實際用途：

```scss
// 語意化顏色
--hds-sys-color-primary-default: var(--hds-ref-color-brand-50);
--hds-sys-color-secondary-default: var(--hds-ref-color-light-100a);
--hds-sys-color-success-default: var(--hds-ref-color-green-50);
--hds-sys-color-error-default: var(--hds-ref-color-red-50);
--hds-sys-color-info-default: var(--hds-ref-color-blue-50);
--hds-sys-color-warning-default: var(--hds-ref-color-yellow-50);

// 語意化透明度
--hds-sys-opacity-90a: var(--hds-ref-opacity-90a);
--hds-sys-opacity-80a: var(--hds-ref-opacity-80a);
// ... 其他透明度

// 語意化間距
--hds-sys-spacing-xs: var(--hds-ref-size-5);
--hds-sys-spacing-sm: var(--hds-ref-size-10);
--hds-sys-spacing-default: var(--hds-ref-size-15);
--hds-sys-spacing-med: var(--hds-ref-size-20);
// ... 其他間距

// 語意化字體大小（更新後的對應關係）
--hds-sys-font-size-xxs: var(--hds-ref-font-size-12);
--hds-sys-font-size-xs: var(--hds-ref-font-size-14);
--hds-sys-font-size-sm: var(--hds-ref-font-size-16);
--hds-sys-font-size-default: var(--hds-ref-font-size-18);
--hds-sys-font-size-med: var(--hds-ref-font-size-20);
--hds-sys-font-size-ex-med: var(--hds-ref-font-size-24);
--hds-sys-font-size-lg: var(--hds-ref-font-size-30);
--hds-sys-font-size-xl: var(--hds-ref-font-size-36);
--hds-sys-font-size-xxl: var(--hds-ref-font-size-46);
// ... 其他字體大小
```

### 使用方式

#### 在元件中使用
```scss
.hds-button {
  // 使用系統代幣（推薦）
  padding: var(--hds-sys-spacing-sm) var(--hds-sys-spacing-med);
  font-size: var(--hds-sys-font-size-default);
  background-color: var(--hds-sys-color-primary-default);
  
  // 特殊情況下使用參考代幣
  border-radius: var(--hds-ref-size-5);
  
  // 使用透明度系統
  opacity: var(--hds-sys-opacity-80a);
}
```

#### 命名規則
- **REF TOKENS**: `--hds-ref-{category}-{value}`
  - `category`: color, size, font-size, opacity
  - `value`: 具體數值或描述（如 dark-80a, size-20, green-50, opacity-90a）
  
- **SYS TOKENS**: `--hds-sys-{category}-{semantic}`
  - `category`: color, spacing, font-size, opacity
  - `semantic`: 語意化名稱（如 primary-default, spacing-lg, font-size-xl, opacity-80a）

### 設計原則

1. **一致性**：所有元件都使用相同的 tokens
2. **可維護性**：修改 REF TOKENS 即可全域更新
3. **語意化**：SYS TOKENS 提供清楚的使用意圖
4. **可擴展性**：可輕鬆新增新的顏色或尺寸變化
5. **響應式**：同時提供 px 和 rem 版本支援不同需求

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