// =============================================================================
// HARRY ANIMATION - STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import { HarryAnimation } from './HarryAnimation';

const meta: Meta<typeof HarryAnimation> = {
  title: 'Components/Effects/HarryAnimation',
  component: HarryAnimation,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['rotation', 'usemac'],
      description: '動畫類型',
    },
    frameDuration: {
      control: { type: 'number', min: 100, max: 5000, step: 50 },
      description: '每幀的持續時間（毫秒），rotation 預設 300ms，usemac 預設 2000ms',
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
      description: '手動控制當前影格',
      if: { arg: 'autoPlay', truthy: false },
    },
    enableParticles: {
      control: 'boolean',
      description: '是否啟用 pixel particle 效果',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HarryAnimation>;

export const Rotation: Story = {
  args: {
    type: 'rotation',
    frameDuration: 300,
    width: '400px',
    height: 'auto',
    autoPlay: true,
    objectFit: 'contain',
    enableParticles: false,
  },
};

export const UseMac: Story = {
  args: {
    type: 'usemac',
    frameDuration: 2000,
    width: '400px',
    height: 'auto',
    autoPlay: true,
    objectFit: 'contain',
    enableParticles: false,
  },
};

export const WithParticles: Story = {
  args: {
    type: 'rotation',
    frameDuration: 300,
    width: '400px',
    height: 'auto',
    autoPlay: true,
    objectFit: 'contain',
    enableParticles: true,
  },
};

export const UseMacWithParticles: Story = {
  args: {
    type: 'usemac',
    frameDuration: 2000,
    width: '400px',
    height: 'auto',
    autoPlay: true,
    objectFit: 'contain',
    enableParticles: true,
  },
};

