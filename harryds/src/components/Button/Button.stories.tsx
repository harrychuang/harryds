import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '主要按鈕',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '次要按鈕',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: '幽靈按鈕',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: '小按鈕',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: '中按鈕',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: '大按鈕',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: '禁用按鈕',
  },
};