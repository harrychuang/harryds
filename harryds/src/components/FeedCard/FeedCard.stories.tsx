// =============================================================================
// FEED CARD STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import FeedCard from './FeedCard';
import FeedCardInfo from './FeedCardInfo';
import feed from './feed.json';

const items = (feed as any).items as Array<any>;

const meta = {
  title: 'Components/FeedCard',
  component: FeedCard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '以 PixelImage 作為背景的卡片。滿寬（max 1600px），內容置左下，預設 padding 40px。',
      },
    },
    controls: {
      include: ['src', 'size', 'height', 'padding', 'className'],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    src: { control: 'text', description: '背景圖片 URL' },
    size: {
      control: { type: 'radio' },
      options: ['hero', 'med', 'sm', 'xs'],
      description: '卡片尺寸（預設高度：hero 600 / med 500 / sm 400 / xs 240）',
    },
    height: { control: { type: 'number', min: 100, max: 1200, step: 10 }, description: '覆寫高度（px）' },
    padding: { control: { type: 'range', min: 0, max: 120, step: 2 }, description: '內距（px）' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof FeedCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// const contentBoxStyle: React.CSSProperties = {
//   color: '#fff',
//   background: 'rgba(0,0,0,0.35)',
//   padding: '12px 16px',
//   borderRadius: 4,
//   lineHeight: 1.3,
// };

const frameStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
};

export const Hero: Story = {
  render: (args) => (
    <div style={frameStyle}>
      <FeedCard {...args} />
    </div>
  ),
  args: {
    src: new URL(items[0].heroImage, import.meta.url).href,
    size: 'hero',
    secondaryColor: items[0].secondaryColor,
    padding: 40,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FeedCardInfo
          data={{ id: items[0].id, heading: items[0].heading, date: items[0].date, tags: items[0].tags, category: items[0].category }}
          primaryColor={items[0].primaryColor}
          secondaryColor={items[0].secondaryColor}
        />
      </div>
    ),
  },
};

export const Med: Story = {
  render: (args) => (
    <div style={frameStyle}>
      <FeedCard {...args} />
    </div>
  ),
  args: {
    src: new URL(items[1].heroImage, import.meta.url).href,
    size: 'med',
    secondaryColor: items[1].secondaryColor,
    padding: 40,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FeedCardInfo
          size="med"
          data={{ id: items[1].id, heading: items[1].heading, date: items[1].date, tags: items[1].tags, category: items[1].category }}
          primaryColor={items[1].primaryColor}
          secondaryColor={items[1].secondaryColor}
        />
      </div>
    ),
  },
};

export const Sm: Story = {
  render: (args) => (
    <div style={frameStyle}>
      <FeedCard {...args} />
    </div>
  ),
  args: {
    src: new URL(items[2].heroImage, import.meta.url).href,
    size: 'sm',
    secondaryColor: items[2].secondaryColor,
    padding: 40,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FeedCardInfo
          size="sm"
          data={{ id: items[2].id, heading: items[2].heading, date: items[2].date, tags: items[2].tags, category: items[2].category }}
          primaryColor={items[2].primaryColor}
          secondaryColor={items[2].secondaryColor}
        />
      </div>
    ),
  },
};

export const Xs: Story = {
  render: (args) => (
    <div style={frameStyle}>
      <FeedCard {...args} />
    </div>
  ),
  args: {
    src: new URL(items[3].heroImage, import.meta.url).href,
    size: 'xs',
    secondaryColor: items[3].secondaryColor,
    padding: 40,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FeedCardInfo
          size="xs"
          data={{ id: items[3].id, heading: items[3].heading, date: items[3].date, tags: items[3].tags, category: items[3].category }}
          primaryColor={items[3].primaryColor}
          secondaryColor={items[3].secondaryColor}
        />
      </div>
    ),
  },
};

// 展示自動 size 對應功能的新 story
export const AutoSizeSync: Story = {
  render: (args) => (
    <div style={frameStyle}>
      <FeedCard {...args} />
    </div>
  ),
  args: {
    src: new URL(items[2].heroImage, import.meta.url).href,
    size: 'sm',
    secondaryColor: items[2].secondaryColor,
    padding: 40,
    children: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* FeedCardInfo 沒有設定 size，會自動從 FeedCard 的 size context 中獲取 'sm' */}
        <FeedCardInfo
          data={{ id: items[2].id, heading: items[2].heading, date: items[2].date, tags: items[2].tags, category: items[2].category }}
          primaryColor={items[2].primaryColor}
          secondaryColor={items[2].secondaryColor}
        />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '展示自動 size 對應功能：FeedCardInfo 沒有設定 size prop，會自動從父層 FeedCard 的 size context 中獲取 "sm"。',
      },
    },
  },
};


