import type { Meta, StoryObj } from '@storybook/react';
import { PixelationImg } from './PixelationImg';
import { useState } from 'react';

const meta: Meta<typeof PixelationImg> = {
  title: 'Components/Media/PixelationImg',
  component: PixelationImg,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: '圖片來源 URL',
    },
    pixelSize: {
      control: { type: 'range', min: 1, max: 100, step: 1 },
      description: '像素大小（數值越大越粗）',
    },
    hoverToOriginal: {
      control: 'boolean',
      description: '滑鼠懸停時是否將像素大小緩動至目標值',
    },
    hoverPixelSize: {
      control: { type: 'range', min: 0, max: 20, step: 1 },
      description: 'hover 時的目標像素大小（數值越小越清晰，0 為完全清晰）',
    },
    hoverDuration: {
      control: { type: 'range', min: 100, max: 2000, step: 50 },
      description: '懸停動畫時長（毫秒）',
    },
    desaturateUntilHover: {
      control: 'boolean',
      description: '非 hover 狀態為灰階，hover 時恢復色彩',
    },
    objectFit: {
      control: 'select',
      options: ['cover', 'contain', 'fill'],
      description: '圖片填滿方式',
    },
    maxPixelRatio: {
      control: { type: 'range', min: 1, max: 3, step: 0.5 },
      description: 'DPR 上限',
    },
    maskColor: {
      control: 'color',
      description: '遮罩顏色',
    },
    maskOpacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: '遮罩不透明度',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用像素化效果',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PixelationImg>;

// 預設範例
export const Default: Story = {
  args: {
    src: 'https://picsum.photos/800/600',
    pixelSize: 40,
    hoverToOriginal: true,
    hoverPixelSize: 1,
    hoverDuration: 400,
    desaturateUntilHover: false,
    objectFit: 'cover',
    maxPixelRatio: 2,
  },
  render: (args) => (
    <div style={{ width: 400, height: 300 }}>
      <PixelationImg {...args} />
    </div>
  ),
};

// 灰階效果
export const WithDesaturate: Story = {
  args: {
    src: 'https://picsum.photos/800/600?random=1',
    pixelSize: 30,
    hoverToOriginal: true,
    hoverDuration: 500,
    desaturateUntilHover: true,
    maskOpacity: 0.4,
  },
  render: (args) => (
    <div style={{ width: 400, height: 300 }}>
      <PixelationImg {...args} />
    </div>
  ),
};

// 不同像素大小
export const PixelSizeVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {[10, 20, 40, 60, 80].map((size) => (
        <div key={size} style={{ textAlign: 'center' }}>
          <div style={{ width: 200, height: 150, marginBottom: 8 }}>
            <PixelationImg
              src={`https://picsum.photos/400/300?random=${size}`}
              pixelSize={size}
              hoverToOriginal={true}
            />
          </div>
          <span style={{ fontSize: 12, color: '#666' }}>pixelSize: {size}</span>
        </div>
      ))}
    </div>
  ),
};

// 多個實例 - 效能測試
export const MultipleInstances: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        width: 800,
      }}
    >
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} style={{ width: '100%', aspectRatio: '4/3' }}>
          <PixelationImg
            src={`https://picsum.photos/400/300?random=${i + 100}`}
            pixelSize={30 + (i % 4) * 10}
            hoverToOriginal={true}
            hoverDuration={300 + (i % 3) * 100}
            desaturateUntilHover={i % 2 === 0}
          />
        </div>
      ))}
    </div>
  ),
};

// 大量實例效能測試
export const PerformanceTest: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: 16, color: '#666', fontSize: 14 }}>
        此測試包含 36 個 PixelationImg 實例，所有動畫由單一渲染管理器處理
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 8,
          width: 900,
        }}
      >
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} style={{ width: '100%', aspectRatio: '1' }}>
            <PixelationImg
              src={`https://picsum.photos/200/200?random=${i + 200}`}
              pixelSize={20 + (i % 5) * 10}
              hoverToOriginal={true}
              hoverDuration={400}
            />
          </div>
        ))}
      </div>
    </div>
  ),
};

// Object Fit 變化
export const ObjectFitVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      {(['cover', 'contain', 'fill'] as const).map((fit) => (
        <div key={fit} style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 200,
              height: 200,
              border: '1px solid #ccc',
              marginBottom: 8,
            }}
          >
            <PixelationImg
              src="https://picsum.photos/600/400?random=fit"
              pixelSize={25}
              objectFit={fit}
              hoverToOriginal={true}
            />
          </div>
          <span style={{ fontSize: 12, color: '#666' }}>{fit}</span>
        </div>
      ))}
    </div>
  ),
};

// 受控 Hover 狀態
export const ControlledHover: Story = {
  render: function ControlledHoverStory() {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 400, height: 300, marginBottom: 16 }}>
          <PixelationImg
            src="https://picsum.photos/800/600?random=ctrl"
            pixelSize={50}
            hoverToOriginal={true}
            hoverDuration={600}
            desaturateUntilHover={true}
            hoverActive={isHovered}
          />
        </div>
        <button
          onClick={() => setIsHovered(!isHovered)}
          style={{
            padding: '8px 24px',
            fontSize: 14,
            cursor: 'pointer',
            backgroundColor: isHovered ? '#2196f3' : '#f5f5f5',
            color: isHovered ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            transition: 'all 0.2s',
          }}
        >
          {isHovered ? 'Deactivate Hover' : 'Activate Hover'}
        </button>
      </div>
    );
  },
};

// 自定義遮罩
export const CustomMask: Story = {
  args: {
    src: 'https://picsum.photos/800/600?random=mask',
    pixelSize: 35,
    hoverToOriginal: true,
    hoverDuration: 400,
    maskColor: 'rgba(255, 100, 100, 0.5)',
    maskOpacity: 0.6,
  },
  render: (args) => (
    <div style={{ width: 400, height: 300 }}>
      <PixelationImg {...args} />
    </div>
  ),
};

// 禁用狀態
export const Disabled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 200, height: 150, marginBottom: 8 }}>
          <PixelationImg
            src="https://picsum.photos/400/300?random=dis1"
            pixelSize={40}
            hoverToOriginal={true}
            disabled={false}
          />
        </div>
        <span style={{ fontSize: 12, color: '#666' }}>正常</span>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 200, height: 150, marginBottom: 8 }}>
          <PixelationImg
            src="https://picsum.photos/400/300?random=dis1"
            pixelSize={40}
            hoverToOriginal={true}
            disabled={true}
          />
        </div>
        <span style={{ fontSize: 12, color: '#666' }}>禁用（顯示原圖）</span>
      </div>
    </div>
  ),
};

