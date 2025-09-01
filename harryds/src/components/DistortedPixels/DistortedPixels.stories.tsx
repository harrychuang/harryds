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
響應滾動的扭曲像素化圖片元件，當頁面滾動加速時產生垂直撕裂和像素化效果。

## 特色
- 🎮 響應滾動速度的動態像素化效果
- 🌊 垂直撕裂和扭曲動畫
- ⚡ 使用 Three.js 和自定義著色器高效能渲染
- 🎛️ 可調整靈敏度、強度和衰減速度
- 📱 支援響應式設計和行動裝置優化
- 🔧 內建調試模式顯示效果參數
- 🎨 支援多種物件填充模式（含 responsive 自動高度模式）
- 📐 responsive 模式實現類似 HTML img 的 width: 100%, height: auto 效果

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

// 響應式模式 - 類似 HTML img 的 width: 100%, height: auto
<DistortedPixels 
  src="/path/to/image.jpg"
  objectFit="responsive"
  onHeightChange={(height) => console.log('新高度:', height)}
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
      options: ['contain', 'cover', 'fill', 'responsive'],
      description: '圖片填充模式（responsive: 寬度 100%，高度根據圖片比例自動計算）',
      table: { type: { summary: 'DistortedPixelsObjectFit' }, defaultValue: { summary: 'cover' } },
    },
    maxPixelation: {
      control: { type: 'range', min: 0, max: 200, step: 10 },
      description: '最大像素化程度（0-200，數值越大像素塊越大）',
      table: { type: { summary: 'number' }, defaultValue: { summary: '150' } },
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
      control: { type: 'range', min: 0.5, max: 12, step: 0.5 },
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
    maxPixelation: 150,
    maxDistortion: 1.5,
    scrollSensitivity: 0.1,
    decaySpeed: 0.95,
    maxPixelRatio: 6,
    debug: false,
    className: 'scroll-hint',
  },
};

// Responsive 模式範例 - 寬度 100%，高度自動調整
export const ResponsiveMode: Story = {
  render: (args) => (
    <div style={{ 
      ...containerStyle, 
      height: '2000px', 
      paddingTop: '200px',
      backgroundColor: '#f5f5f5' 
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '600px', 
        margin: '0 auto',
        border: '2px dashed #ccc',
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>
          Responsive 模式：圖片會根據容器寬度自動調整高度
        </h3>
        <DistortedPixels 
          {...args}
          onHeightChange={(height) => {
            console.log('容器高度自動調整為:', height + 'px');
          }}
        />
      </div>
    </div>
  ),
  args: {
    src: demoImg,
    objectFit: 'responsive',
    direction: 'x',
    maxPixelation: 100,
    maxDistortion: 1.0,
    scrollSensitivity: 0.1,
    decaySpeed: 0.95,
    maxPixelRatio: 4,
    debug: true,
  },
};
