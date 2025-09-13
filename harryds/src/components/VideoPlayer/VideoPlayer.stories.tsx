import type { Meta, StoryObj } from '@storybook/react';
import { VideoPlayer } from './VideoPlayer';

const meta: Meta<typeof VideoPlayer> = {
  title: 'Components/VideoPlayer',
  component: VideoPlayer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
**VideoPlayer** 是一個支援現代影片播放功能的元件，具備載入狀態、錯誤處理和無障礙支援。

### 功能特色
- 🎬 支援多種影片格式（MP4、WebM、OGV）
- 🖼️ 支援 poster 預覽圖片
- ⚙️ 豐富的播放控制選項
- 🔄 載入狀態與錯誤處理
- ♿ 完整的無障礙支援
- 📱 響應式設計
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: '影片來源 URL',
    },
    poster: {
      control: 'text',
      description: '預覽圖片 URL',
    },
    alt: {
      control: 'text',
      description: '替代文字（用於無障礙）',
    },
    autoplay: {
      control: 'boolean',
      description: '是否自動播放',
    },
    loop: {
      control: 'boolean',
      description: '是否循環播放',
    },
    muted: {
      control: 'boolean',
      description: '是否靜音（建議自動播放時設為 true）',
    },
    controls: {
      control: 'boolean',
      description: '是否顯示播放控制項',
    },
    className: {
      control: 'text',
      description: '額外 CSS 類名',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 由於 Storybook 環境中沒有實際影片檔案，這些範例使用示意性 URL
// 在實際使用時，請替換為有效的影片 URL

// 容器樣式 - 給影片一個明確的尺寸容器
const containerStyle: React.CSSProperties = {
  width: 800,
  height: 450, // 16:9 比例
  borderRadius: 8,
  overflow: 'hidden',
};

export const Default: Story = {
  render: (args) => (
    <div style={containerStyle}>
      <VideoPlayer {...args} />
    </div>
  ),
  args: {
    src: 'https://download.samplelib.com/mp4/sample-5s.mp4',
    poster: 'https://via.placeholder.com/1280x720/000000/FFFFFF?text=Video+Poster',
    alt: '示範影片',
    controls: true,
    muted: true,
  },
};
