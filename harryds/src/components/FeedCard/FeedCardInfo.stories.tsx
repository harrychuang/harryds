// =============================================================================
// FEED CARD INFO STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import FeedCardInfo from './FeedCardInfo';
import type { FeedCardInfoData } from './FeedCardInfo';
import type { FeedCardSize } from './FeedCard';
import feed from '../../../../shared/data/feed.json';

const items = (feed as any).items as Array<any>;

const meta = {
  title: 'Components/FeedCard/FeedCardInfo',
  component: FeedCardInfo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Display FeedCard text information: binary ID, title, date, and tags (tags use PixelText text-box).',
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
    data: { control: 'object', description: 'Data object: { id, heading, date, tags, category }' },
    size: { control: { type: 'radio' }, options: ['hero', 'med', 'sm', 'xs'], description: 'Size preset (affects id/date/tags/heading)' },
    hovered: { control: 'boolean', description: 'Override hover state (true/false)' },
    primaryColor: { control: 'color', description: 'Primary color (hover text color + tag box background)' },
    secondaryColor: { control: 'color', description: 'Secondary color (hover tag box text color)' },
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




