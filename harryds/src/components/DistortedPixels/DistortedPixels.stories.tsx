// =============================================================================
// DISTORTED PIXELS STORYBOOK STORIES - 響應滾動的扭曲像素化圖片範例
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import DistortedPixels from './DistortedPixels';
import './DistortedPixels.scss';

// 使用 Vite 原生 URL 匯入
const demoImg = new URL('../../../assets/imgs/project-demo.jpg', import.meta.url).href;

const meta = {
  title: 'Components/DistortedPixels',
  component: DistortedPixels,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# DistortedPixels

響應滾動的扭曲像素化圖片元件，當頁面滾動加速時產生垂直撕裂和像素化效果。

## 特色
- 🎮 響應滾動速度的動態像素化效果
- 🌊 垂直撕裂和扭曲動畫
- ⚡ 使用 Three.js 和自定義著色器高效能渲染
- 🎛️ 可調整靈敏度、強度和衰減速度
- 📱 支援響應式設計和行動裝置優化
- 🔧 內建調試模式顯示效果參數
- 🎨 支援多種物件填充模式

## 使用方式

\`\`\`tsx
import { DistortedPixels } from 'hds';

// 基本使用
<DistortedPixels 
  src="/path/to/image.jpg"
/>

// 自訂效果參數
<DistortedPixels 
  src="/path/to/image.jpg"
  maxPixelation={80}
  maxDistortion={1.5}
  scrollSensitivity={2.0}
  decaySpeed={0.98}
  objectFit="cover"
/>

// 開啟調試模式
<DistortedPixels 
  src="/path/to/image.jpg"
  debug={true}
/>
\`\`\`

## 效果原理

1. **滾動檢測**: 監聽頁面滾動事件，計算滾動速度
2. **像素化**: 根據滾動速度動態調整圖片的像素化程度
3. **垂直扭曲**: 使用著色器產生從上到下的撕裂效果
4. **平滑衰減**: 效果會隨時間自然衰減回正常狀態

## 注意事項

- 元件需要滾動頁面才能看到效果，在 Storybook 中可能效果有限
- 建議在實際頁面中測試以獲得最佳體驗
- 在行動裝置上會自動降低效果強度以確保效能
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: { type: 'radio' },
      options: ['y', 'x'],
      description: '扭曲方向：y 垂直拉扯、x 水平拉扯',
      table: { type: { summary: "'x' | 'y'" }, defaultValue: { summary: 'x' } },
    },
    src: {
      control: 'text',
      description: '圖片 URL（支援跨來源）',
      table: { type: { summary: 'string' } },
    },
    objectFit: {
      control: { type: 'radio' },
      options: ['contain', 'cover', 'fill'],
      description: '圖片填充模式（相當於 CSS object-fit）',
      table: { type: { summary: 'DistortedPixelsObjectFit' }, defaultValue: { summary: 'cover' } },
    },
    maxPixelation: {
      control: { type: 'range', min: 0, max: 200, step: 10 },
      description: '最大像素化程度（0-200，數值越大像素塊越大）',
      table: { type: { summary: 'number' }, defaultValue: { summary: '80' } },
    },
    maxDistortion: {
      control: { type: 'range', min: 0, max: 3, step: 0.1 },
      description: '最大扭曲強度（0-3）',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1.5' } },
    },
    scrollSensitivity: {
      control: { type: 'range', min: 0.1, max: 5, step: 0.1 },
      description: '滾動響應靈敏度（數值越大越敏感）',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0.3' } },
    },
    decaySpeed: {
      control: { type: 'range', min: 0.9, max: 0.999, step: 0.001 },
      description: '效果衰減速度（數值越大衰減越快，0.9-0.999）',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0.95' } },
    },
    maxPixelRatio: {
      control: { type: 'range', min: 0.5, max: 4, step: 0.25 },
      description: 'DPR 上限（避免行動裝置過高像素比造成負擔）',
      table: { type: { summary: 'number' }, defaultValue: { summary: '4' } },
    },
    debug: {
      control: 'boolean',
      description: '是否啟用調試模式（顯示效果參數）',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    className: {
      control: 'text',
      description: '額外的 CSS 類名',
      table: { type: { summary: 'string' }, defaultValue: { summary: '""' } },
    },
  },
} satisfies Meta<typeof DistortedPixels>;

export default meta;
type Story = StoryObj<typeof meta>;

// 容器樣式
const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '80vh',
  margin: '0',
  padding: '20px'
};

const imageContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '500px',
  borderRadius: '8px'
};

// 預設範例
export const Default: Story = {
  render: (args) => (
    <div style={{ ...containerStyle, height: '2000px', paddingTop: '200px' }}>
      <div style={imageContainerStyle}>
        <DistortedPixels {...args} />
      </div>
    </div>
  ),
  args: {
    src: demoImg,
    objectFit: 'cover',
    direction: 'x',
    maxPixelation: 80,
    maxDistortion: 1.5,
    scrollSensitivity: 0.3,
    decaySpeed: 0.95,
    maxPixelRatio: 4,
    debug: false,
    className: 'scroll-hint',
  },
};
