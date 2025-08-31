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
        component: '初始/關閉時外觀與 FeedCard 相同；開啟後固定全螢幕，FeedCard 作為 75vh hero，下方顯示文章內容。',
      },
    },
    controls: {
      include: ['open', 'heroHeightVH', 'src', 'padding', 'className'],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean', description: '是否開啟 overlay' },
    heroHeightVH: { control: { type: 'range', min: 40, max: 100, step: 1 }, description: 'hero 高度（vh）' },
    src: { control: 'text', description: '背景圖片 URL（傳入 FeedCard）' },
    padding: { control: { type: 'range', min: 0, max: 120, step: 2 }, description: 'FeedCard padding' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof FeedDetailOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      <FeedDetailOverlay {...args} />
    </div>
  ),
  args: {
    open: false,
    heroHeightVH: 75,
    src: demoSrc,
    padding: 40,
    infoData: {
      id: items[0].id,
      heading: items[0].heading,
      date: items[0].date,
      tags: items[0].tags,
      category: items[0].category,
    } as FeedCardInfoData,
    primaryColor: items[0].primaryColor,
    secondaryColor: items[0].secondaryColor,
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
    src: demoSrc,
    padding: 40,
  },
};


