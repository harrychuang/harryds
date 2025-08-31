// =============================================================================
// LOGO STORYBOOK STORIES - 品牌標誌元件範例
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import Logo from './Logo';

const meta = {
  title: 'Components/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Harry Design Studio 的品牌標誌元件，使用 PixelText 實現 8-bit 風格的文字效果。

## 特色
- 🎮 8-bit 像素風格的品牌標誌
- 🏃 智能跑馬燈效果，展示完整的工作室資訊
- 🎭 支援亂碼解碼動畫效果
- 🎨 可自訂主題顏色
- 🔧 可調整各種視覺參數

## 使用方式
\`\`\`tsx
import { Logo } from 'hds';

// 基本使用 - 預設品牌標誌
<Logo />

// 返回按鈕樣式
<Logo type="back" />

// 自訂顏色
<Logo 
  type="default"
  primaryColor="#FF1246" 
  secondaryColor="#1B2350" 
/>

// 自訂設定  
<Logo 
  type="default"
  animated={true}
  marqueeEnabled={true}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'inline-radio' },
      options: ['default', 'back'],
      description: 'Logo 類型。"default" 顯示品牌標誌，"back" 顯示返回按鈕樣式',
      table: {
        type: { summary: 'LogoType' },
        defaultValue: { summary: 'default' },
      },
    },
    primaryColor: {
      control: { type: 'text' },
      description: '主色調（主文字顏色 & text-box 背景色）。可使用 CSS 變數，如 var(--hds-sys-color-theme-surface)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'HDS_TOKENS.themeSurface' },
      },
    },
    secondaryColor: {
      control: { type: 'text' },
      description: '次色調（text-box 文字顏色）。可使用 CSS 變數，如 var(--on-hds-sys-color-theme-surface)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'HDS_TOKENS.onThemeSurface' },
      },
    },

    animated: {
      control: 'boolean',
      description: '是否啟用動畫效果',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    marqueeEnabled: {
      control: 'boolean',
      description: '是否啟用跑馬燈效果',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },



    className: {
      control: 'text',
      description: '額外的 CSS 類名',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

// 預設範例 - 品牌標誌
export const Default: Story = {
  args: {
    type: 'default',
    animated: true,
    marqueeEnabled: true,
  },
};

// 返回按鈕樣式
export const Back: Story = {
  args: {
    type: 'back',
    animated: true,
    marqueeEnabled: false,
  },
};
