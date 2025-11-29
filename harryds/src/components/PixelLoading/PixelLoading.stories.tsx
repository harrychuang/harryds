import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect } from 'react';
import PixelLoading from './PixelLoading';

const meta: Meta<typeof PixelLoading> = {
  title: 'Components/PixelLoading',
  component: PixelLoading,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#111111' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: '進度值 (0-100)',
    },
    pixelSize: {
      control: { type: 'range', min: 1, max: 8, step: 1 },
      description: '每個像素的大小',
    },
    pixelGap: {
      control: { type: 'range', min: 0, max: 4, step: 1 },
      description: '像素之間的間隔',
    },
    color: {
      control: 'color',
      description: '像素顏色',
    },
    binaryDigits: {
      control: { type: 'range', min: 4, max: 10, step: 1 },
      description: '二進位數字的位數',
    },
    letterSpacing: {
      control: { type: 'range', min: 0, max: 4, step: 1 },
      description: '字符間距',
    },
    animated: {
      control: 'boolean',
      description: '是否啟用動畫效果',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 輔助函數：將數字轉換為二進位字串
const toBinary = (num: number, digits: number = 7) => {
  return num.toString(2).padStart(digits, '0');
};

// 預設狀態
export const Default: Story = {
  args: {
    progress: 50,
    pixelSize: 2,
    pixelGap: 1,
    binaryDigits: 7,
    letterSpacing: 1,
    animated: true,
  },
};

// 自動播放動畫
export const Animated: Story = {
  render: () => {
    const AnimatedLoader = () => {
      const [progress, setProgress] = useState(0);
      
      useEffect(() => {
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) return 0;
            return prev + 1;
          });
        }, 100);
        
        return () => clearInterval(interval);
      }, []);
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <PixelLoading progress={progress} animated={true} pixelGap={1} />
          <span style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
            {progress} = {toBinary(progress)}
          </span>
        </div>
      );
    };
    
    return <AnimatedLoader />;
  },
};
