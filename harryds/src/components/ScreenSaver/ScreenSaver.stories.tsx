// =============================================================================
// SCREEN SAVER STORIES - Storybook 故事
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ScreenSaver } from './ScreenSaver';
import { mylifeImages } from './mylifeImages';

const meta: Meta<typeof ScreenSaver> = {
  title: 'components/ScreenSaver',
  component: ScreenSaver,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# ScreenSaver 螢幕保護程式

照片一張一張從畫面上方緩緩飄落的螢幕保護程式效果。

## 特色
- 🎨 **優雅的飄落動畫** - 照片緩慢、穩定地飄落
- ⚡ **效能優化** - 使用 CSS transform 動畫 + GPU 加速
- 📐 **自動填滿** - 自動 fit window width/height
- 🎛️ **高度可自訂** - 支援調整速度、大小、間隔等參數
- 🚫 **智慧防重疊** - 照片不會互相重疊
- 💾 **流量優化** - 預設只隨機載入 100 張圖片

## 注意
此元件為全螢幕覆蓋，請在 Canvas 模式下查看完整效果。
        `,
      },
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    images: {
      description: '照片 URL 陣列',
      control: false,
      table: {
        type: { summary: 'string[]' },
      },
    },
    randomCount: {
      description: '從中隨機挑選的照片數量',
      control: { type: 'number', min: 10, max: 500, step: 10 },
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '100' },
      },
    },
    spawnInterval: {
      description: '每隔多少秒產生一張新照片',
      control: { type: 'number', min: 0.5, max: 10, step: 0.5 },
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '3' },
      },
    },
    sizeRange: {
      description: '照片大小範圍 [min, max] (vw)',
      control: { type: 'object' },
      table: {
        type: { summary: '[number, number]' },
        defaultValue: { summary: '[10, 30]' },
      },
    },
    durationRange: {
      description: '飄落時間範圍 [min, max] (秒)',
      control: { type: 'object' },
      table: {
        type: { summary: '[number, number]' },
        defaultValue: { summary: '[20, 35]' },
      },
    },
    maxPhotos: {
      description: '最大同時顯示的照片數量',
      control: { type: 'number', min: 1, max: 30, step: 1 },
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '12' },
      },
    },
    backgroundColor: {
      description: '背景顏色',
      control: { type: 'color' },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '#000000' },
      },
    },
    zIndex: {
      description: 'CSS z-index 層級',
      control: { type: 'number', min: 1, max: 99999, step: 1 },
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '9999' },
      },
    },
    active: {
      description: '是否啟用',
      control: { type: 'boolean' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    showCloseButton: {
      description: '是否顯示關閉按鈕',
      control: { type: 'boolean' },
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    onClose: {
      description: '關閉時的回呼函數',
      action: 'closed',
      table: {
        type: { summary: '() => void' },
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ 
        width: '100%', 
        height: '100vh', 
        minHeight: '500px',
        position: 'relative',
        overflow: 'hidden',
        background: '#000'
      }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ScreenSaver>;

// 預設 - 使用 mylife 圖片（隨機 100 張）
export const Default: Story = {
  args: {
    images: mylifeImages,
    randomCount: 100,
    spawnInterval: 3,
    sizeRange: [10, 30],
    durationRange: [20, 35],
    maxPhotos: 12,
    active: true,
    showCloseButton: false,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
};

// 快速模式 - 更頻繁產生、更快飄落
export const FastMode: Story = {
  args: {
    images: mylifeImages,
    randomCount: 100,
    spawnInterval: 1,
    sizeRange: [8, 20],
    durationRange: [10, 18],
    maxPhotos: 20,
    active: true,
    showCloseButton: false,
    backgroundColor: '#000000',
  },
};

// 慢速模式 - 更緩慢優雅
export const SlowMode: Story = {
  args: {
    images: mylifeImages,
    randomCount: 50,
    spawnInterval: 5,
    sizeRange: [15, 35],
    durationRange: [30, 50],
    maxPhotos: 8,
    active: true,
    showCloseButton: false,
    backgroundColor: '#000000',
  },
};

// 互動式切換
export const Interactive: Story = {
  decorators: [
    (Story) => (
      <div style={{ 
        width: '100%', 
        minHeight: '300px',
        position: 'relative',
        background: '#111',
        padding: '20px'
      }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      story: {
        inline: false,
        iframeHeight: 300,
      },
    },
  },
  render: () => {
    const [isActive, setIsActive] = useState(false);

    return (
      <div>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>
          互動式螢幕保護程式
        </h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          點擊按鈕啟動螢幕保護程式，按 ESC 或點擊任意處關閉。
        </p>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          mylifeImages: {mylifeImages?.length || 0} 張（隨機使用 100 張）
        </p>
        <button
          onClick={() => setIsActive(true)}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          啟動螢幕保護程式
        </button>

        <ScreenSaver
          images={mylifeImages}
          active={isActive}
          onClose={() => setIsActive(false)}
          spawnInterval={3}
        />
      </div>
    );
  },
};
