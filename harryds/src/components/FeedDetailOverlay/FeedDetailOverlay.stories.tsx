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
        component: `Appearance matches FeedCard when closed/initial state. When opened, first shows FeedCard at original size with PixelText loading in top-right corner (~2.5 seconds), after loading completes overlay switches to fixed + fullscreen, FeedCard expands to 75vh hero, article content displayed below. Entire content is scrollable, article max-width 1600px. Images in content use responsive mode to auto-adjust height.

## Loading Process
1. \`open=true\` → Overlay wraps FeedCard with \`position: relative\` (maintaining original size)
2. Top-right corner shows PixelText loading (text: "LOADING", progress: 0%-100%)
3. After loading completes, overlay switches to \`position: fixed + inset: 0\` (fills entire screen)
4. FeedCard first stretches to 100vh (pixelSize adjusts to 80)
5. FeedCard separates into background layer, FeedCardInfo displayed independently at 75vh hero bottom
6. Show article content

## PixelText Loading Features  
- 8-bit style "LOADING" text
- Text-box displays real-time progress percentage
- Always fixed in top-right corner (position: fixed)
- Compact design, non-intrusive to main content
- No background mask, completely transparent

## Position Behavior Details
- **During Loading**: 
  - Overlay: \`position: relative\` (only wraps FeedCard, doesn't fill screen)
  - Loading: \`position: fixed\` (top-right corner)
  - No backdrop
- **After Content Ready**: 
  - Overlay: \`position: fixed + inset: 0\` (fills entire screen)
  - Show backdrop
  - Scrollable browsing`,
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
    <div style={{ width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      <FeedDetailOverlay {...args} />
    </div>
  ),
  args: {
    open: false,
    heroHeightVH: 65,
    sizeWhenClosed: 'hero',
    src: demoSrc,
    padding: 40,
    infoMaxWidth: 1600,
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
    heroHeightVH: 65,
    sizeWhenClosed: 'hero',
    src: demoSrc,
    padding: 40,
    infoMaxWidth: 1600,
    primaryColor: items[0].primaryColor,
    secondaryColor: items[0].secondaryColor,
  },
  parameters: {
    docs: {
      description: {
        story: `Demonstrates complete opening process: overlay wraps FeedCard with relative positioning (original size), top-right corner fixed shows PixelText loading animation (~2.5 seconds), after loading completes overlay switches to fixed + fullscreen, FeedCard expands to hero size and displays complete content. Loading uses 8-bit style with "LOADING" text and dynamic progress percentage, no background mask design.`,
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
    heroHeightVH: 65,
    sizeWhenClosed: 'hero', 
    src: demoSrc,
    padding: 40,
    infoMaxWidth: 1600,
    primaryColor: items[0].primaryColor,
    secondaryColor: items[0].secondaryColor,
  },
  parameters: {
    docs: {
      description: {
        story: `Specifically demonstrates loading stage effects. When open=true is set:

1) overlay wraps FeedCard with position: relative (original size)
2) top-right corner shows PixelText loading
3) after loading completes, switches to fixed + fullscreen, background uses PixelImage (pixelSize=80, mask uses secondaryColor)
4) hero maintains 75vh, FeedCardInfo positioned at bottom
        `,
      },
    },
  },
};