// =============================================================================
// PIXEL TEXT STORYBOOK STORIES - 8-bit 風格文字元件範例
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import PixelText from './PixelText';
import './PixelText.scss';

const meta = {
  title: 'Components/PixelText',
  component: PixelText,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# PixelText

8-bit 風格的像素文字元件，使用 Three.js 渲染正方形粒子組成的文字。

## 特色
- 🎮 經典 8-bit 像素風格
- ⚡ 使用 Three.js 高效能渲染
- 🎨 可自訂顏色、大小和間距
- 📱 支援響應式設計
- ♿ 符合無障礙設計標準

## 使用方式
\`\`\`tsx
import { PixelText } from 'hds';

<PixelText 
  text="HELLO WORLD" 
  color="#00FF00" 
  pixelSize={6}
/>
\`\`\`

## 支援字符
- 英文字母 A-Z
- 數字 0-9  
- 空格

不支援的字符會顯示為空格並在控制台警告。
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: '要顯示的文字（支援 A-Z, 0-9, 空格）',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    pixelSize: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description: '每個像素的大小（像素）',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '4' },
      },
    },
    pixelGap: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
      description: '像素之間的間隔',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1' },
      },
    },
    color: {
      control: 'color',
      description: '像素顏色',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '#000000' },
      },
    },
    letterSpacing: {
      control: { type: 'range', min: 0, max: 10, step: 1 },
      description: '字母間距（像素單位）',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '2' },
      },
    },
    width: {
      control: { type: 'range', min: 100, max: 800, step: 50 },
      description: 'Canvas 寬度',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '400' },
      },
    },
    height: {
      control: { type: 'range', min: 50, max: 200, step: 10 },
      description: 'Canvas 高度',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '100' },
      },
    },
    backgroundColor: {
      control: 'color',
      description: '背景顏色（transparent 為透明）',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'transparent' },
      },
    },
    antialias: {
      control: 'boolean',
      description: '是否啟用抗鋸齒',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
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
} satisfies Meta<typeof PixelText>;

export default meta;
type Story = StoryObj<typeof meta>;

// 預設範例
export const Default: Story = {
  args: {
    text: 'HARRY',
    color: '#000000',
    pixelSize: 6,
    pixelGap: 1,
    letterSpacing: 2,
    width: 400,
    height: 100,
  },
};
