import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Dropdown, DropdownOption } from './Dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'Components/Dropdown',
  component: Dropdown,
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
      description: '選擇框 placeholder',
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
      <div style={{ width: '360px', minHeight: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

const sampleOptions: DropdownOption[] = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4 (Disabled)', disabled: true },
  { value: 'option5', label: 'Option 5' },
];

const countryOptions: DropdownOption[] = [
  { value: 'tw', label: '台灣 Taiwan' },
  { value: 'jp', label: '日本 Japan' },
  { value: 'us', label: '美國 United States' },
  { value: 'uk', label: '英國 United Kingdom' },
  { value: 'de', label: '德國 Germany' },
  { value: 'fr', label: '法國 France' },
];

// 預設狀態
export const Default: Story = {
  args: {
    label: 'Select Option',
    options: sampleOptions,
    placeholder: 'Choose an option...',
  },
};

// 帶選中值
const ControlledTemplate = () => {
  const [value, setValue] = useState('option2');
  return (
    <Dropdown
      label="Country"
      options={countryOptions}
      value={value}
      onChange={(val) => setValue(val)}
      placeholder="Select country..."
    />
  );
};

export const WithValue: Story = {
  render: () => <ControlledTemplate />,
};

// 帶必填標記
export const Required: Story = {
  args: {
    label: 'Category',
    options: sampleOptions,
    placeholder: 'Select category...',
    required: true,
  },
};

// 錯誤狀態
export const WithError: Story = {
  args: {
    label: 'Priority',
    options: sampleOptions,
    placeholder: 'Select priority...',
    error: 'Please select a priority level',
  },
};

// 禁用狀態
export const Disabled: Story = {
  args: {
    label: 'Disabled Dropdown',
    options: sampleOptions,
    placeholder: 'This dropdown is disabled',
    disabled: true,
  },
};

// 無 Label
export const WithoutLabel: Story = {
  args: {
    options: countryOptions,
    placeholder: 'Select country...',
  },
};

// 長選項列表
const manyOptions: DropdownOption[] = Array.from({ length: 20 }, (_, i) => ({
  value: `item-${i + 1}`,
  label: `Item ${i + 1}`,
}));

export const ManyOptions: Story = {
  args: {
    label: 'Long List',
    options: manyOptions,
    placeholder: 'Select from many options...',
  },
};

