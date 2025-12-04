import type { Meta, StoryObj } from '@storybook/react';
import { PixelIcon } from './PixelIcon';

const meta: Meta<typeof PixelIcon> = {
  title: 'Components/Typography/PixelIcon',
  component: PixelIcon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    symbol: {
      control: 'text',
      description: '要顯示的符號字符',
    },
    pixelSize: {
      control: { type: 'range', min: 1, max: 8, step: 1 },
      description: '每個像素的大小',
    },
    pixelGap: {
      control: { type: 'range', min: 0, max: 4, step: 1 },
      description: '像素之間的間隔',
    },
    color: {
      control: 'color',
      description: '圖示顏色',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PixelIcon>;

// 向下箭頭 (Dropdown 用)
export const ChevronDown: Story = {
  args: {
    symbol: '↧',
    pixelSize: 2,
    color: '#111111',
  },
};

// 關閉 (Modal 用)
export const Close: Story = {
  args: {
    symbol: '×',
    pixelSize: 2,
    color: '#111111',
  },
};

// 箭頭系列
export const Arrows: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <PixelIcon symbol="↑" pixelSize={2} />
      <PixelIcon symbol="↓" pixelSize={2} />
      <PixelIcon symbol="←" pixelSize={2} />
      <PixelIcon symbol="→" pixelSize={2} />
    </div>
  ),
};

// Chevron 系列
export const Chevrons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <PixelIcon symbol="↥" pixelSize={2} />
      <PixelIcon symbol="↧" pixelSize={2} />
      <PixelIcon symbol="↤" pixelSize={2} />
      <PixelIcon symbol="↦" pixelSize={2} />
    </div>
  ),
};

// 三角形系列
export const Triangles: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <PixelIcon symbol="▲" pixelSize={2} />
      <PixelIcon symbol="▼" pixelSize={2} />
      <PixelIcon symbol="◀" pixelSize={2} />
      <PixelIcon symbol="▶" pixelSize={2} />
    </div>
  ),
};

// 幾何形狀
export const Shapes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <PixelIcon symbol="●" pixelSize={2} />
      <PixelIcon symbol="◆" pixelSize={2} />
      <PixelIcon symbol="◼" pixelSize={2} />
      <PixelIcon symbol="◻" pixelSize={2} />
    </div>
  ),
};

// 其他符號
export const Symbols: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <PixelIcon symbol="♥" pixelSize={2} />
      <PixelIcon symbol="✉" pixelSize={2} />
      <PixelIcon symbol="☀" pixelSize={2} />
      <PixelIcon symbol="☽" pixelSize={2} />
    </div>
  ),
};

// 不同尺寸
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <PixelIcon symbol="♥" pixelSize={1} />
      <PixelIcon symbol="♥" pixelSize={2} />
      <PixelIcon symbol="♥" pixelSize={3} />
      <PixelIcon symbol="♥" pixelSize={4} />
    </div>
  ),
};

// 帶間隔
export const WithGap: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <PixelIcon symbol="♥" pixelSize={3} pixelGap={0} />
      <PixelIcon symbol="♥" pixelSize={3} pixelGap={1} />
      <PixelIcon symbol="♥" pixelSize={3} pixelGap={2} />
    </div>
  ),
};

// 不同顏色
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <PixelIcon symbol="♥" pixelSize={3} color="#111111" />
      <PixelIcon symbol="♥" pixelSize={3} color="#f03fa6" />
      <PixelIcon symbol="♥" pixelSize={3} color="#1ade99" />
      <PixelIcon symbol="♥" pixelSize={3} color="#4f72fd" />
    </div>
  ),
};

