// =============================================================================
// FEED CARD INFO STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import FeedCardInfo from './FeedCardInfo';
import type { FeedCardInfoData } from './FeedCardInfo';
import type { FeedCardSize } from './FeedCard';
import feed from './feed.json';

const items = (feed as any).items as Array<any>;

const meta = {
  title: 'Components/FeedCard/FeedCardInfo',
  component: FeedCardInfo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '顯示 FeedCard 文字資訊：二進位編號、標題、日期與標籤（標籤使用 PixelText text-box）。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object', description: '資料物件：{ id, heading, date, tags, category }' },
    size: { control: { type: 'radio' }, options: ['hero', 'med', 'sm', 'xs'], description: '尺寸預設（影響 id/date/tags/heading）' },
    idColor: { control: 'color', description: '二進位文字顏色' },
    dateColor: { control: 'color', description: '日期文字顏色' },
    tagPrimaryColor: { control: 'color', description: '標籤框背景色' },
    tagOnPrimaryColor: { control: 'color', description: '標籤框文字色' },
    idPixelSize: { control: { type: 'range', min: 1, max: 12, step: 1 }, description: '覆寫 id pixel size' },
    datePixelSize: { control: { type: 'range', min: 1, max: 12, step: 1 }, description: '覆寫 date pixel size' },
    tagsPixelSize: { control: { type: 'range', min: 1, max: 12, step: 1 }, description: '覆寫 tags pixel size' },
    headingFontSize: { control: { type: 'range', min: 12, max: 160, step: 2 }, description: '覆寫 heading 字級(px)' },
  },
} satisfies Meta<typeof FeedCardInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: {
      id: items[0].id,
      heading: items[0].heading,
      date: items[0].date,
      tags: items[0].tags,
      category: items[0].category,
    } as FeedCardInfoData,
    idColor: items[0].primaryColor,
    dateColor: items[0].primaryColor,
    headingColor: items[0].primaryColor,
    tagPrimaryColor: items[0].primaryColor,
    tagOnPrimaryColor: items[0].secondaryColor,
    size: 'hero' as FeedCardSize,
  },
};

export const Sizes: Story = {
  render: (args) => {
    const base = (args as any).data as FeedCardInfoData;
    return (
      <div style={{ display: 'grid', gap: 24 }}>
        <FeedCardInfo {...args} size="hero" data={{ ...base, heading: 'Hero Heading' }} />
        <FeedCardInfo {...args} size="med" data={{ ...base, heading: 'Med Heading' }} />
        <FeedCardInfo {...args} size="sm" data={{ ...base, heading: 'Small Heading' }} />
        <FeedCardInfo {...args} size="xs" data={{ ...base, heading: 'XS Heading' }} />
      </div>
    );
  },
  args: {
    data: {
      id: items[1].id,
      heading: items[1].heading,
      date: items[1].date,
      tags: items[1].tags,
      category: items[1].category,
    } as FeedCardInfoData,
    idColor: items[1].primaryColor,
    dateColor: items[1].primaryColor,
    headingColor: items[1].primaryColor,
    tagPrimaryColor: items[1].primaryColor,
    tagOnPrimaryColor: items[1].secondaryColor,
    size: 'hero' as FeedCardSize,
  },
};


