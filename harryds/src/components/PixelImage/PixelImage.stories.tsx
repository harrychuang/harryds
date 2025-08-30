// =============================================================================
// PIXEL IMAGE STORYBOOK STORIES - 圖片像素化元件範例
// 參考 three.js RenderPixelatedPass 示例
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import PixelImage from './PixelImage';
// 使用 Vite 原生 URL 匯入，避免別名在 Storybook 快取下解析失敗
const demoImg = new URL('../../../assets/imgs/project-demo.jpg', import.meta.url).href;

const meta = {
  title: 'Components/PixelImage',
  component: PixelImage,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '以 Three.js 的 RenderPixelatedPass 將圖片像素化。元件會自動填滿外層容器（fit div），並可控制像素大小與輪廓外框。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: '圖片 URL（支援跨來源）',
      table: { type: { summary: 'string' } },
    },
    pixelSize: {
      control: { type: 'range', min: 1, max: 80, step: 1 },
      description: '像素尺寸（數值越大越粗）',
      table: { type: { summary: 'number' }, defaultValue: { summary: 80 } },
    },
    outline: {
      control: 'boolean',
      description: '是否顯示像素外框',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: true } },
    },
    normalEdgeStrength: {
      control: { type: 'range', min: 0, max: 2, step: 0.05 },
      description: '外框：法線邊緣強度',
    },
    depthEdgeStrength: {
      control: { type: 'range', min: 0, max: 2, step: 0.05 },
      description: '外框：深度邊緣強度',
    },
    normalTolerance: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: '外框：法線容差',
    },
    depthTolerance: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: '外框：深度容差',
    },
    maxPixelRatio: {
      control: { type: 'range', min: 0.5, max: 4, step: 0.25 },
      description: 'DPR 上限（避免行動裝置過高像素比造成負擔）',
      table: { type: { summary: 'number' }, defaultValue: { summary: 1.5 } },
    },
    maskColor: {
      control: 'color',
      description: '遮罩顏色（留空 = 使用預設 theme mask token）',
      table: { type: { summary: 'string' }, defaultValue: { summary: '' } },
    },
    maskOpacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: '遮罩不透明度（hover 補間到此值）',
      table: { type: { summary: 'number' }, defaultValue: { summary: 0.85 } },
    },
    objectFit: {
      control: { type: 'radio' },
      options: ['contain', 'cover', 'fill'],
      description: '圖片填充模式（相當於 CSS object-fit）',
    },
    hoverPixelToOne: {
      control: 'boolean',
      description: '滑鼠懸停時像素大小緩動至 1，移開恢復',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: false } },
    },
    hoverPixelDuration: {
      control: { type: 'range', min: 0, max: 2000, step: 20 },
      description: '滑鼠懸停像素補間動畫時長（毫秒）',
      table: { type: { summary: 'number' }, defaultValue: { summary: 500 } },
    },
    desaturateUntilHover: {
      control: 'boolean',
      description:
        '非 hover 狀態將彩度降至最低（灰階），當 hoverPixelToOne 開啟且滑鼠懸停時恢復原色',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: true } },
    },
  },
} satisfies Meta<typeof PixelImage>;

export default meta;
type Story = StoryObj<typeof meta>;

const containerStyle: React.CSSProperties = {
  width: 800,
  height: 400,
  borderRadius: 0,
  overflow: 'hidden',
};

export const Default: Story = {
  render: (args) => (
    <div style={containerStyle}>
      <PixelImage {...args} />
    </div>
  ),
  args: {
    src: demoImg,
    pixelSize: 80,
    hoverPixelToOne: true,
    hoverPixelDuration: 500,
    desaturateUntilHover: true,
    outline: true,
    normalEdgeStrength: 0.2,
    depthEdgeStrength: 0.3,
    normalTolerance: 0.2,
    depthTolerance: 0.1,
    objectFit: 'cover',
    maskColor: 'var(--hds-sys-color-theme-mask)',
    maskOpacity: 0.85,
    maxPixelRatio: 1.5,
  },
};

export const DesaturateUntilHover: Story = {
  render: (args) => (
    <div style={containerStyle}>
      <PixelImage {...args} />
    </div>
  ),
  args: {
    src: demoImg,
    pixelSize: 40,
    outline: true,
    objectFit: 'cover',
    hoverPixelToOne: true,
    hoverPixelDuration: 500,
    desaturateUntilHover: true,
    maskColor: 'var(--hds-sys-color-theme-mask)',
    maskOpacity: 0.85,
    maxPixelRatio: 1.5,
  },
};


