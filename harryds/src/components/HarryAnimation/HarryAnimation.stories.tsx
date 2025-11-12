// =============================================================================
// HARRY ANIMATION - STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import { HarryAnimation } from './HarryAnimation';

const meta: Meta<typeof HarryAnimation> = {
  title: 'Components/HarryAnimation',
  component: HarryAnimation,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    frameDuration: {
      control: { type: 'number', min: 100, max: 2000, step: 50 },
      description: '每幀的持續時間（毫秒）',
      if: { arg: 'autoPlay', truthy: true },
    },
    width: {
      control: 'text',
      description: '圖片寬度',
    },
    height: {
      control: 'text',
      description: '圖片高度',
    },
    autoPlay: {
      control: 'boolean',
      description: '是否自動播放',
    },
    objectFit: {
      control: 'select',
      options: ['fill', 'contain', 'cover', 'none', 'scale-down'],
      description: '圖片填充模式',
    },
    frame: {
      control: { type: 'number', min: 0, max: 9, step: 1 },
      description: '手動控制當前影格（0-9）',
      if: { arg: 'autoPlay', truthy: false },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HarryAnimation>;

export const Default: Story = {
  args: {
    frameDuration: 300,
    width: '400px',
    height: 'auto',
    autoPlay: true,
    objectFit: 'contain',
  },
};

