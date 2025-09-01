// =============================================================================
// FEED DETAIL OVERLAY STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import FeedDetailOverlay from './FeedDetailOverlay';
import type { FeedContentBlock } from '../../types/feed';
import type { FeedCardInfoData } from '../FeedCard/FeedCardInfo';
import feed from '../../../../shared/data/feed.json';

const items = (feed as any).items as Array<any>;
const demoSrc = new URL(`../../../assets/imgs/${items[0].heroImage}`, import.meta.url).href;

const meta = {
  title: 'Components/FeedDetailOverlay',
  component: FeedDetailOverlay,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `初始/關閉時外觀與 FeedCard 相同；開啟後會先以原始尺寸顯示 FeedCard 並在視窗右上角顯示 PixelText loading（約 2.5 秒），loading 完成後 overlay 切換為 fixed + 全螢幕，FeedCard 擴展為 75vh hero，下方顯示文章內容。整個內容可滾動，文章 max-width 1600px。內容中的圖片使用 responsive 模式自動調整高度。

## Loading 流程
1. \`open=true\` → Overlay 以 \`position: relative\` 包覆 FeedCard（保持原始尺寸）
2. 視窗右上角顯示 PixelText loading（文字："LOADING"，進度：0%-100%）
3. Loading 完成後 overlay 切換為 \`position: fixed + inset: 0\`（佔滿全螢幕）
4. FeedCard 先拉高到 100vh（pixelSize 調整為 80）
5. FeedCard 分離為背景層，FeedCardInfo 獨立顯示在 75vh hero 底部
6. 顯示文章內容

## PixelText Loading 特色  
- 8-bit 風格的 "LOADING" 文字
- Text-box 顯示即時進度百分比
- 始終固定在視窗右上角（position: fixed）
- 緊湊設計，不干擾主要內容
- 無背景遮罩，完全透明

## Position 行為詳細
- **Loading 期間**: 
  - Overlay: \`position: relative\`（只包覆 FeedCard，不佔滿畫面）
  - Loading: \`position: fixed\`（視窗右上角）
  - 無 backdrop
- **內容準備後**: 
  - Overlay: \`position: fixed + inset: 0\`（佔滿全螢幕）
  - 顯示 backdrop
  - 可滾動瀏覽`,
      },
    },
    controls: {
      include: ['open', 'heroHeightVH', 'sizeWhenClosed', 'src', 'padding', 'infoMaxWidth', 'className'],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean', description: '是否開啟 overlay' },
    heroHeightVH: { control: { type: 'range', min: 40, max: 100, step: 1 }, description: 'hero 高度（vh）' },
    sizeWhenClosed: { control: { type: 'radio' }, options: ['hero', 'med', 'sm', 'xs'], description: '關閉時 FeedCard/Info 尺寸' },
    src: { control: 'text', description: '背景圖片 URL（傳入 FeedCard）' },
    padding: { control: { type: 'range', min: 0, max: 120, step: 2 }, description: 'FeedCard padding' },
    infoMaxWidth: { control: { type: 'number', min: 200, max: 2000, step: 50 }, description: 'FeedCardInfo 最大寬度（px）' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof FeedDetailOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      <FeedDetailOverlay {...args} />
    </div>
  ),
  args: {
    open: false,
    heroHeightVH: 75,
    sizeWhenClosed: 'hero',
    src: demoSrc,
    padding: 40,
    infoMaxWidth: 1400,
    primaryColor: items[0].primaryColor,
    secondaryColor: items[0].secondaryColor,
    infoData: {
      id: items[0].id,
      heading: items[0].heading,
      date: items[0].date,
      tags: items[0].tags,
      category: items[0].category,
    } as FeedCardInfoData,
  },
};

export const Opened: Story = {
  render: (args) => (
    <FeedDetailOverlay
      {...args}
      infoData={{
        id: items[0].id,
        heading: items[0].heading,
        date: items[0].date,
        tags: items[0].tags,
        category: items[0].category,
      }}
      contentBlocks={(items[0].content as FeedContentBlock[] | undefined)?.map((b) => {
        if (b.type === 'image') {
          // 將相對圖片名映射至實際 URL
          return { ...b, src: new URL(`../../../assets/imgs/${b.src}`, import.meta.url).href };
        }
        return b;
      })}
    />
  ),
  args: {
    open: true,
    heroHeightVH: 75,
    sizeWhenClosed: 'hero',
    src: demoSrc,
    padding: 40,
    infoMaxWidth: 1400,
    primaryColor: items[0].primaryColor,
    secondaryColor: items[0].secondaryColor,
  },
  parameters: {
    docs: {
      description: {
        story: `展示完整的開啟流程：overlay 以 relative positioning 包覆 FeedCard（原始尺寸），視窗右上角固定顯示 PixelText loading 動畫（約 2.5 秒），loading 完成後 overlay 切換為 fixed + 全螢幕，FeedCard 擴展為 hero 尺寸並顯示完整內容。Loading 使用 8-bit 風格，包含 "LOADING" 文字和動態進度百分比，無背景遮罩設計。`,
      },
    },
  },
};

export const LoadingDemo: Story = {
  render: (args) => {
    // 這個 story 專門用來展示 loading 階段
    return (
      <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
        <FeedDetailOverlay
          {...args}
          infoData={{
            id: items[0].id,
            heading: items[0].heading,
            date: items[0].date,
            tags: items[0].tags,
            category: items[0].category,
          }}
        />
      </div>
    );
  },
  args: {
    open: true,
    heroHeightVH: 75,
    sizeWhenClosed: 'hero', 
    src: demoSrc,
    padding: 40,
    infoMaxWidth: 1400,
    primaryColor: items[0].primaryColor,
    secondaryColor: items[0].secondaryColor,
  },
  parameters: {
    docs: {
      description: {
        story: `專門展示 loading 階段的效果。當設置 open=true 時：

1) overlay 以 position: relative 包覆 FeedCard（原始尺寸）
2) 右上角顯示 PixelText loading
3) loading 完成後切換為 fixed + 全螢幕，背景使用 PixelImage（pixelSize=80、遮罩使用 secondaryColor）
4) hero 維持 75vh，FeedCardInfo 置於底部
        `,
      },
    },
  },
};