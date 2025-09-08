// =============================================================================
// PIXEL IMAGE STORYBOOK STORIES - 圖片像素化元件範例
// 參考 three.js RenderPixelatedPass 示例
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import PixelImage from './PixelImage';
import PixelImage2D from './PixelImage2D';
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
          'Pixelates images using Three.js RenderPixelatedPass. Component automatically fills the outer container (fit div) with controllable pixel size and outline borders.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'Image URL (supports cross-origin)',
      table: { type: { summary: 'string' } },
    },
    pixelSize: {
      control: { type: 'range', min: 1, max: 80, step: 1 },
      description: 'Pixel size (larger value = chunkier)',
      table: { type: { summary: 'number' }, defaultValue: { summary: 80 } },
    },
    outline: {
      control: 'boolean',
      description: 'Show pixel outline',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: true } },
    },
    normalEdgeStrength: {
      control: { type: 'range', min: 0, max: 2, step: 0.05 },
      description: 'Outline: Normal edge strength',
    },
    depthEdgeStrength: {
      control: { type: 'range', min: 0, max: 2, step: 0.05 },
      description: 'Outline: Depth edge strength',
    },
    normalTolerance: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Outline: Normal tolerance',
    },
    depthTolerance: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Outline: Depth tolerance',
    },
    maxPixelRatio: {
      control: { type: 'range', min: 0.5, max: 4, step: 0.25 },
      description: 'DPR limit (prevents high pixel ratio burden on mobile devices)',
      table: { type: { summary: 'number' }, defaultValue: { summary: 1.5 } },
    },
    maskColor: {
      control: 'color',
      description: 'Mask color (empty = use default theme mask token)',
      table: { type: { summary: 'string' }, defaultValue: { summary: '' } },
    },
    maskOpacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Mask opacity (hover interpolates to this value)',
      table: { type: { summary: 'number' }, defaultValue: { summary: 0.8 } },
    },
    objectFit: {
      control: { type: 'radio' },
      options: ['contain', 'cover', 'fill'],
      description: 'Image fitting mode (equivalent to CSS object-fit)',
    },
    hoverPixelToOne: {
      control: 'boolean',
      description: 'On mouse hover, pixel size eases to 1, restores on leave',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: false } },
    },
    hoverPixelDuration: {
      control: { type: 'range', min: 0, max: 2000, step: 20 },
      description: 'Mouse hover pixel interpolation animation duration (milliseconds)',
      table: { type: { summary: 'number' }, defaultValue: { summary: 500 } },
    },
    desaturateUntilHover: {
      control: 'boolean',
      description:
        'Minimize saturation (grayscale) in non-hover state. Restore original colors when hoverPixelToOne is enabled and on hover',
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
    maskColor: '',
    maskOpacity: 0.8,
    maxPixelRatio: 1.5,
  },
};

export const Canvas2D: Story = {
  name: '2D Canvas',
  render: (args) => (
    <div style={containerStyle}>
      <PixelImage2D {...args} />
    </div>
  ),
  args: {
    src: demoImg,
    pixelSize: 20,
    hoverPixelToOne: false,
    hoverPixelDuration: 600,
    desaturateUntilHover: false,
    outline: false, // 2D Canvas 版本不支援邊緣檢測
    objectFit: 'cover',
    maskColor: '',
    maskOpacity: 0.8,
    maxPixelRatio: 1.5,
  },
};

export const Compare: Story = {
  name: 'WebGL vs 2D Canvas',
  render: (args) => (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <div>
        <h3 style={{ marginBottom: '10px', textAlign: 'center' }}>WebGL</h3>
        <div style={containerStyle}>
          <PixelImage {...args} />
        </div>
      </div>
      <div>
        <h3 style={{ marginBottom: '10px', textAlign: 'center' }}>2D Canvas</h3>
        <div style={containerStyle}>
          <PixelImage2D {...args} />
        </div>
      </div>
    </div>
  ),
  args: {
    src: demoImg,
    pixelSize: 40,
    hoverPixelToOne: true,
    hoverPixelDuration: 500,
    desaturateUntilHover: true,
    outline: true,
    normalEdgeStrength: 0.2,
    depthEdgeStrength: 0.3,
    normalTolerance: 0.2,
    depthTolerance: 0.1,
    objectFit: 'cover',
    maskColor: '',
    maskOpacity: 0.8,
    maxPixelRatio: 1.5,
  },
};


