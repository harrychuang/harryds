// =============================================================================
// FEED CARD STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import FeedCard from './FeedCard';

const demoImg = new URL('../../../assets/imgs/project-demo.jpg', import.meta.url).href;

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

const contentBoxStyle: React.CSSProperties = {
  color: '#fff',
  background: 'rgba(0,0,0,0.35)',
  padding: '12px 16px',
  borderRadius: 4,
  lineHeight: 1.3,
};

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
    src: demoImg,
    size: 'hero',
    padding: 40,
    children: (
      <div style={contentBoxStyle}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>HERO FEED CARD</div>
        <div style={{ fontSize: 14 }}>內容置左下，背景使用 PixelImage</div>
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
    src: demoImg,
    size: 'med',
    padding: 40,
    children: (
      <div style={contentBoxStyle}>MEDIUM - 500px 高</div>
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
    src: demoImg,
    size: 'sm',
    padding: 40,
    children: (
      <div style={contentBoxStyle}>SMALL - 400px 高</div>
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
    src: demoImg,
    size: 'xs',
    padding: 40,
    children: (
      <div style={contentBoxStyle}>XS - 240px 高</div>
    ),
  },
};


