// =============================================================================
// FEED CARD INFO STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import FeedCardInfo from './FeedCardInfo';
import type { FeedCardSize } from './FeedCard';

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
    index: { control: { type: 'number', min: 0, max: 255, step: 1 }, description: '數字索引，會顯示成 8 位二進位' },
    heading: { control: 'text', description: '標題' },
    dateRange: { control: 'text', description: '日期區間' },
    tags: { control: 'object', description: '標籤字串陣列' },
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
    index: 1,
    heading: 'Heading',
    dateRange: 'July 24, 2025 - June 25, 2026',
    tags: ['UX', 'Design System', 'Three.js'],
    size: 'hero' as FeedCardSize,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <FeedCardInfo {...args} size="hero" heading="Hero Heading" />
      <FeedCardInfo {...args} size="med" heading="Med Heading" />
      <FeedCardInfo {...args} size="sm" heading="Small Heading" />
      <FeedCardInfo {...args} size="xs" heading="XS Heading" />
    </div>
  ),
  args: {
    index: 7,
    heading: 'Heading',
    dateRange: 'July 24, 2025 - June 25, 2026',
    tags: ['UX', 'Design System', 'Three.js'],
    size: 'hero' as FeedCardSize,
  },
};


