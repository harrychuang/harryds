// =============================================================================
// CTA BUTTON - Storybook 故事
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import { CTAButton } from './CTAButton';

const meta: Meta<typeof CTAButton> = {
  title: 'Components/CTAButton',
  component: CTAButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '帶有動畫條紋背景的 Call-to-Action 按鈕元件。12 個條紋方塊循環顯示主色與副色，Hover 時加速動畫效果。',
      },
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: '按鈕文字',
    },
    href: {
      control: 'text',
      description: '連結 URL',
    },
    primaryColor: {
      control: 'color',
      description: '主色（條紋背景色 1）',
    },
    secondaryColor: {
      control: 'color',
      description: '副色（條紋背景色 2）',
    },
    iconUrl: {
      control: 'text',
      description: '圖示 URL（預設使用內建的 link icon）',
    },
    target: {
      control: 'select',
      options: ['_blank', '_self', '_parent', '_top'],
      description: '是否在新視窗開啟',
    },
    className: {
      control: 'text',
      description: '額外的 CSS 類名',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CTAButton>;

export const Default: Story = {
  args: {
    label: 'VISIT WEBSITE',
    href: 'https://example.com',
    primaryColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
  },
};

