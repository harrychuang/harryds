import type { Meta, StoryObj } from '@storybook/react';
import { PocketConsole } from './PocketConsole';

const meta: Meta<typeof PocketConsole> = {
  title: 'Components/PocketConsole',
  component: PocketConsole,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
        { name: 'light', value: '#f0f0f0' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    shellColor: {
      control: 'color',
      description: '主機外殼顏色',
    },
    screenBorderColor: {
      control: 'color',
      description: '螢幕邊框顏色',
    },
    screenColor: {
      control: 'color',
      description: '螢幕背景顏色',
    },
    buttonColor: {
      control: 'color',
      description: 'A/B 按鈕顏色',
    },
    dpadColor: {
      control: 'color',
      description: '十字鍵顏色',
    },
    width: {
      control: { type: 'range', min: 80, max: 400, step: 10 },
      description: '整體寬度',
    },
    animated: {
      control: 'boolean',
      description: '是否啟用動畫效果',
    },
  },
};

export default meta;
type Story = StoryObj<typeof PocketConsole>;

// 預設狀態
export const Default: Story = {
  args: {
    width: 160,
    animated: false,
  },
};

// 啟用動畫
export const Animated: Story = {
  args: {
    width: 160,
    animated: true,
  },
};

// 大尺寸
export const Large: Story = {
  args: {
    width: 320,
    animated: true,
  },
};

// 經典綠松石配色
export const TealColor: Story = {
  args: {
    width: 160,
    shellColor: '#00979d',
    animated: true,
  },
};

// 透明紫配色
export const AtomicPurple: Story = {
  args: {
    width: 160,
    shellColor: 'rgba(147, 112, 219, 0.85)',
    animated: true,
  },
};

// 黃色配色
export const YellowColor: Story = {
  args: {
    width: 160,
    shellColor: '#ffcc00',
    buttonColor: '#2d2d2d',
    animated: true,
  },
};

// 暗黑模式
export const DarkMode: Story = {
  args: {
    width: 160,
    shellColor: '#1a1a1a',
    screenBorderColor: '#0a0a0a',
    screenColor: '#003300',
    dpadColor: '#0a0a0a',
    buttonColor: '#660033',
    animated: true,
  },
};

// 自訂螢幕顏色 - 琥珀色
export const AmberScreen: Story = {
  args: {
    width: 160,
    screenColor: '#ffbf00',
    animated: true,
  },
};

// 自訂螢幕顏色 - 藍色
export const BlueScreen: Story = {
  args: {
    width: 160,
    screenColor: '#0066ff',
    animated: true,
  },
};

// 帶有螢幕內容
export const WithScreenContent: Story = {
  args: {
    width: 200,
    animated: true,
    screenContent: (
      <div style={{ 
        color: '#0f380f', 
        fontSize: '8px', 
        fontFamily: 'monospace',
        textAlign: 'center',
        padding: '4px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>HARRY</div>
        <div>DESIGN</div>
        <div>STUDIO</div>
      </div>
    ),
  },
};

// 多種尺寸展示
export const SizeVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
      <PocketConsole width={80} />
      <PocketConsole width={120} animated />
      <PocketConsole width={160} animated />
      <PocketConsole width={200} animated />
    </div>
  ),
};

// 顏色系列展示
export const ColorVariations: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <PocketConsole width={120} shellColor="#8b8b8b" animated />
      <PocketConsole width={120} shellColor="#00979d" animated />
      <PocketConsole width={120} shellColor="#9370db" animated />
      <PocketConsole width={120} shellColor="#ffcc00" animated />
      <PocketConsole width={120} shellColor="#c62d5a" animated />
      <PocketConsole width={120} shellColor="#1a1a1a" animated />
    </div>
  ),
};

