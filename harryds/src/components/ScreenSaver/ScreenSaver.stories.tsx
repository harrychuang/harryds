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
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ScreenSaver>;

// 預設 - 使用 mylife 圖片
export const Default: Story = {
  args: {
    images: mylifeImages,
    spawnInterval: 3,
    active: true,
    showCloseButton: false,
    backgroundColor: '#000000',
  },
};

// 互動式切換
export const Interactive: Story = {
  render: () => {
    const [isActive, setIsActive] = useState(false);

    return (
      <div style={{ padding: '40px' }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>
          互動式螢幕保護程式
        </h2>
        <p style={{ color: '#888', marginBottom: '20px' }}>
          點擊按鈕啟動螢幕保護程式，按 ESC 或點擊任意處關閉。
        </p>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          mylifeImages: {mylifeImages?.length || 0} 張
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
