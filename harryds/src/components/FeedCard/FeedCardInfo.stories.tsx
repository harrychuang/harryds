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
    controls: {
      exclude: [
        'index', 'heading', 'dateRange', 'tags', 'className', 'style', 
        'pixelGap', 'letterSpacing', 'idColor', 'dateColor', 'headingColor',
        'tagPrimaryColor', 'tagOnPrimaryColor', 'idPixelSize', 'datePixelSize',
        'tagsPixelSize', 'headingFontSize', 'tagsTextBoxPadding'
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: { control: 'object', description: '資料物件：{ id, heading, date, tags, category }' },
    size: { control: { type: 'radio' }, options: ['hero', 'med', 'sm', 'xs'], description: '尺寸預設（影響 id/date/tags/heading）' },
    hovered: { control: 'boolean', description: '覆寫 hover 狀態（true/false）' },
    primaryColor: { control: 'color', description: '主色（hover 文字色 + 標籤框背景）' },
    secondaryColor: { control: 'color', description: '次色（hover 標籤框文字色）' },
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
    hovered: false,
    primaryColor: items[0].primaryColor,
    secondaryColor: items[0].secondaryColor,
    size: 'hero' as FeedCardSize,
  },
};




