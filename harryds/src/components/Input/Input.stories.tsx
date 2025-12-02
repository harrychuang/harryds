import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label 文字',
    },
    placeholder: {
      control: 'text',
      description: '輸入框 placeholder',
    },
    error: {
      control: 'text',
      description: '錯誤訊息',
    },
    required: {
      control: 'boolean',
      description: '是否為必填',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '360px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Input>;

// 預設狀態
export const Default: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email...',
  },
};

// 帶必填標記
export const Required: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username...',
    required: true,
  },
};

// 錯誤狀態
export const WithError: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter password...',
    error: 'Password must be at least 8 characters',
    type: 'password',
  },
};

// 禁用狀態
export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
  },
};

// 無 Label
export const WithoutLabel: Story = {
  args: {
    placeholder: 'Search...',
  },
};

// 不同類型
export const PasswordType: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password...',
    type: 'password',
  },
};

// 帶預設值
export const WithValue: Story = {
  args: {
    label: 'Name',
    value: 'Harry Design',
  },
};

