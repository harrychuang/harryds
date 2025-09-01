// =============================================================================
// FEED CARD STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import FeedCard from './FeedCard';
import FeedCardInfo from './FeedCardInfo';
import feed from '../../../../shared/data/feed.json';

const items = (feed as any).items as Array<any>;

const meta = {
  title: 'Components/FeedCard',
  component: FeedCard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '以 PixelImage 作為背景的卡片。滿寬（max 1600px），內容水平置中，預設 padding 40px，FeedCardInfo 預設 max-width 1600px。',
      },
    },
    controls: {
      include: ['src', 'size', 'height', 'padding', 'infoMaxWidth', 'className'],
      exclude: ['children'],
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
    infoMaxWidth: { control: { type: 'number', min: 200, max: 2000, step: 50 }, description: 'FeedCardInfo 最大寬度（px）' },
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

export const Default: Story = {
  render: (args) => (
    <div style={frameStyle}>
      <FeedCard {...args} />
    </div>
  ),
  args: {
    src: new URL(`../../../assets/imgs/${items[0].heroImage}`, import.meta.url).href,
    size: 'hero',
    secondaryColor: items[0].secondaryColor,
    padding: 40,
    infoMaxWidth: 1600,
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