// =============================================================================
// PIXEL IMAGE 2D STORYBOOK STORIES - 2D Canvas 圖片像素化元件範例
// 使用 2D Canvas API 替代 WebGL，解決 context 限制問題
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import PixelImage2D from './PixelImage2D';
// 使用 Vite 原生 URL 匯入，避免別名在 Storybook 快取下解析失敗
const demoImg = new URL('../../../assets/imgs/project-demo.jpg', import.meta.url).href;

const meta = {
  title: 'Components/PixelImage2D',
  component: PixelImage2D,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '以 2D Canvas API 將圖片像素化，解決 WebGL context 限制問題。保持與 PixelImage 相同的 API，適合在多個實例同時使用的場景。',
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
      description: '是否顯示像素外框（2D Canvas 版本暫不支援邊緣檢測）',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: false } },
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
      table: { type: { summary: 'number' }, defaultValue: { summary: 0.8 } },
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
    hoverActive: {
      control: 'boolean',
      description: '由父元件控制的 hover 狀態，為 true 時觸發 hoverPixelToOne 行為',
      table: { type: { summary: 'boolean' } },
    },
  },
} satisfies Meta<typeof PixelImage2D>;

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
      <PixelImage2D {...args} />
    </div>
  ),
  args: {
    src: demoImg,
    pixelSize: 80,
    hoverPixelToOne: true,
    hoverPixelDuration: 500,
    desaturateUntilHover: true,
    outline: false,
    objectFit: 'cover',
    maskColor: '',
    maskOpacity: 0.8,
    maxPixelRatio: 1.5,
  },
};

export const DesaturateUntilHover: Story = {
  render: (args) => (
    <div style={containerStyle}>
      <PixelImage2D {...args} />
    </div>
  ),
  args: {
    src: demoImg,
    pixelSize: 40,
    outline: false,
    objectFit: 'cover',
    hoverPixelToOne: true,
    hoverPixelDuration: 500,
    desaturateUntilHover: true,
    maskColor: '',
    maskOpacity: 0.8,
    maxPixelRatio: 1.5,
  },
};

export const HighPixelSize: Story = {
  render: (args) => (
    <div style={containerStyle}>
      <PixelImage2D {...args} />
    </div>
  ),
  args: {
    src: demoImg,
    pixelSize: 15,
    hoverPixelToOne: true,
    hoverPixelDuration: 800,
    desaturateUntilHover: false,
    objectFit: 'cover',
    maxPixelRatio: 1.5,
  },
};

export const ColorfulWithoutDesaturate: Story = {
  render: (args) => (
    <div style={containerStyle}>
      <PixelImage2D {...args} />
    </div>
  ),
  args: {
    src: demoImg,
    pixelSize: 25,
    hoverPixelToOne: true,
    hoverPixelDuration: 300,
    desaturateUntilHover: false,
    objectFit: 'cover',
    maskColor: '#ff6b6b',
    maskOpacity: 0.3,
    maxPixelRatio: 1.5,
  },
};

export const ControlledHover: Story = {
  render: (args) => (
    <div style={containerStyle}>
      <PixelImage2D {...args} />
    </div>
  ),
  args: {
    src: demoImg,
    pixelSize: 50,
    hoverPixelToOne: true,
    hoverPixelDuration: 1000,
    desaturateUntilHover: true,
    objectFit: 'cover',
    hoverActive: false,
    maskOpacity: 0.9,
    maxPixelRatio: 1.5,
  },
};

export const MultipleInstances: Story = {
  name: '多個實例（解決 WebGL context 限制）',
  render: (args) => (
    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 300,
            height: 200,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <PixelImage2D
            {...args}
            pixelSize={20 + i * 10}
            hoverPixelDuration={300 + i * 100}
          />
        </div>
      ))}
    </div>
  ),
  args: {
    src: demoImg,
    pixelSize: 30,
    hoverPixelToOne: true,
    desaturateUntilHover: true,
    objectFit: 'cover',
    maxPixelRatio: 1.5,
  },
};
