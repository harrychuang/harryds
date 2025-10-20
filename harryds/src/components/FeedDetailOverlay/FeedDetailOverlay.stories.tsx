// =============================================================================
// FEED DETAIL OVERLAY STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import FeedDetailOverlay from './FeedDetailOverlay';
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
        component: `Appearance matches FeedCard when closed/initial state. When opened, overlay switches to fixed + fullscreen with only hero section displayed.

## Opening Process
1. \`open=true\` → Overlay switches to \`position: fixed + inset: 0\` (fills entire screen)
2. FeedCard separates into background layer, FeedCardInfo displayed independently at 75vh hero bottom
3. Show backdrop

## Features
- Fixed full-screen overlay with backdrop
- 75vh hero section with FeedCardInfo
- Background adjusts based on scroll position
- Hero-only display (no content area)`,
      },
    },
    controls: {
      include: ['open', 'heroHeightVH', 'sizeWhenClosed', 'src', 'padding', 'infoMaxWidth', 'className'],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean', description: 'Open overlay or not' },
    heroHeightVH: { control: { type: 'range', min: 40, max: 100, step: 1 }, description: 'Hero height (vh)' },
    sizeWhenClosed: { control: { type: 'radio' }, options: ['hero', 'med', 'sm', 'xs'], description: 'FeedCard/Info size when closed' },
    src: { control: 'text', description: 'Background image URL (passed to FeedCard)' },
    padding: { control: { type: 'range', min: 0, max: 120, step: 2 }, description: 'FeedCard padding' },
    infoMaxWidth: { control: { type: 'number', min: 200, max: 2000, step: 50 }, description: 'FeedCardInfo max width (px)' },
    className: { control: 'text' },
  },
} satisfies Meta<typeof FeedDetailOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
    />
  ),
  args: {
    open: true,
    heroHeightVH: 65,
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
        story: `Demonstrates overlay with hero section only. Overlay switches to fixed + fullscreen, FeedCard expands to hero size with FeedCardInfo displayed at the bottom.`,
      },
    },
  },
};
