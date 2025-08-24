// =============================================================================
// PIXEL TEXT STORYBOOK STORIES - 8-bit 風格文字元件範例
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import PixelText from './PixelText';
import './PixelText.scss';

const meta = {
  title: 'Components/PixelText',
  component: PixelText,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# PixelText

8-bit 風格的像素文字元件，使用 Three.js 渲染正方形粒子組成的文字。

## 特色
- 🎮 經典 8-bit 像素風格
- ⚡ 使用 Three.js 高效能渲染
- 🎨 可自訂顏色、大小和間距
- 🎭 駭客風格亂碼解碼動畫
- 🌊 漸慢 ease 動畫效果
- 📦 支援 text-box 功能（背景色反轉、置中、padding）
- 🎛️ 獨立的主文字和 text-box 開關控制
- 📏 智能間距控制（textBoxPadding 同時作為內邊距和元素間距）
- 🏃 智能跑馬燈效果（像素級平滑滾動，文字過長時自動啟動）
- 📱 支援響應式設計
- ♿ 符合無障礙設計標準

## 使用方式
\`\`\`tsx
import { PixelText } from 'hds';

// 基本使用
<PixelText 
  text="HELLO WORLD" 
  primaryColor="#00FF00" 
  pixelSize={6}
/>

// 駭客動畫效果
<PixelText 
  text="DECODING" 
  primaryColor="#00FFAA"
  animated={true}
  easeGlitch={true}
  glitchInterval={20}
  animationDelay={150}
/>

// Text-Box 功能（置中且含 padding）
<PixelText 
  text="LEVEL" 
  textBoxEnabled={true}
  textBox="001"
  textBoxWidth={5}
  textBoxPadding={2}  // 同時控制內邊距和元素間距
  primaryColor="#00FF00"
  onPrimaryColor="#FFFFFF"
/>

// 開關控制 - 只顯示 text-box
<PixelText 
  text="HIDDEN TEXT"
  textEnabled={false}    // 關閉主文字
  textBoxEnabled={true}  // 啟用 text-box
  textBox="VISIBLE"
  primaryColor="#FF6B6B"
  onPrimaryColor="#FFFFFF"
/>

// 跑馬燈效果 - 文字過長時自動滾動
<PixelText 
  text="SYSTEM"
  textBoxEnabled={true}
  textBox="VERY LONG TEXT CONTENT WILL SCROLL"  // 超過 textBoxWidth 會跑馬燈
  textBoxWidth={8}       // 只顯示 8 個字符寬度
  marqueeEnabled={true}   // 啟用跑馬燈（預設已啟用）
  marqueeSpeed={120}      // 跑馬燈速度（毫秒）- 每個像素移動間隔 120ms
  marqueePause={2000}     // 開始和結束時的暫停時間
  animated={true}         // 跑馬燈會在亂碼動畫結束後啟動
  primaryColor="#00FFAA"
  onPrimaryColor="#000000"
/>
\`\`\`

## 支援字符
- **英文字母**: A-Z
- **數字**: 0-9  
- **標點符號**: , 。 . - ? ! @ ″ „
- **數學符號**: + × ÷ %
- **特殊符號**: ‼︎ ⁇
- **幾何形狀**: ▶︎ ▷ ◆ ● ◼︎ ◻︎
- **其他符號**: ﹅ ⟨ ⟩ [ ] ⎢
- **空格**

總共支援 **65 個字符**，不支援的字符會顯示為空格並在控制台警告。
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: '要顯示的文字（支援字母、數字、標點符號、數學符號、幾何形狀等 65 個字符）',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    textEnabled: {
      control: 'boolean',
      description: '是否啟用主文字顯示',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    pixelSize: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description: '每個像素的大小（像素）',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '4' },
      },
    },
    pixelGap: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
      description: '像素之間的間隔',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1' },
      },
    },
    primaryColor: {
      control: 'color',
      description: '主色調（text 文字顏色 & text-box 背景色）',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '#000000' },
      },
    },
    onPrimaryColor: {
      control: 'color',
      description: '主色調上的文字顏色（text-box 文字顏色）',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '#FFFFFF' },
      },
    },
    letterSpacing: {
      control: { type: 'range', min: 0, max: 10, step: 1 },
      description: '字母間距（像素單位）',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '2' },
      },
    },
    width: {
      control: { type: 'range', min: 100, max: 800, step: 50 },
      description: 'Canvas 寬度',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '400' },
      },
    },
    height: {
      control: { type: 'range', min: 50, max: 200, step: 10 },
      description: 'Canvas 高度',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '100' },
      },
    },

    antialias: {
      control: 'boolean',
      description: '是否啟用抗鋸齒',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    className: {
      control: 'text',
      description: '額外的 CSS 類名',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    animated: {
      control: 'boolean',
      description: '是否啟用動畫效果',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },

    durationTime: {
      control: { type: 'range', min: 200, max: 5000, step: 100 },
      description: '每個字母跳動的持續時間（毫秒）',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1000' },
      },
    },
    animationDelay: {
      control: { type: 'range', min: 50, max: 1000, step: 50 },
      description: '字符間的動畫延遲時間（毫秒）',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '150' },
      },
    },
    glitchInterval: {
      control: { type: 'range', min: 20, max: 200, step: 10 },
      description: '亂碼跳動間隔時間（毫秒）- 值越小跳動越快',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '20' },
      },
    },
    easeGlitch: {
      control: 'boolean',
      description: '是否啟用漸慢的亂碼動畫效果（一開始快，後來慢）',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    textBoxEnabled: {
      control: 'boolean',
      description: '是否啟用 text-box 功能',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    textBox: {
      control: 'text',
      description: 'text-box 要顯示的文字內容（會在主文字右側顯示，背景和文字顏色會反轉）',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    textBoxWidth: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description: 'text-box 的寬度（用字母數量表示）',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '5' },
      },
    },
    textBoxPadding: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
      description: 'text-box 的內邊距（pixelSize 的倍數）。當 text 和 text-box 同時啟用時，也作為兩者之間的間距',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '2' },
      },
    },
    marqueeEnabled: {
      control: 'boolean',
      description: '是否啟用跑馬燈效果（當 text-box 文字多於寬度時自動滾動）',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    marqueeSpeed: {
      control: { type: 'range', min: 50, max: 1000, step: 10 },
      description: '跑馬燈移動速度（毫秒）- 每個像素移動的間隔時間，值越大移動越慢',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '100' },
      },
    },
    marqueePause: {
      control: { type: 'range', min: 0, max: 5000, step: 100 },
      description: '跑馬燈在開始和結束時的暫停時間（毫秒）',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1000' },
      },
    },
  },
} satisfies Meta<typeof PixelText>;

export default meta;
type Story = StoryObj<typeof meta>;

// 預設範例
export const Default: Story = {
  args: {
    text: 'HARRY',
    primaryColor: '#000000',
    onPrimaryColor: '#FFFFFF',
    pixelSize: 6,
    pixelGap: 1,
    letterSpacing: 2,
    width: 400,
    height: 100,
  },
};

// 完整符號集展示
export const AllSymbolsShowcase: Story = {
  args: {
    text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 ,。.-+×÷?!@‼︎⁇▶︎◆●◼︎◻︎▷﹅⟨⟩[]⎢%″„',
    primaryColor: '#333333',
    onPrimaryColor: '#FFFFFF',
    pixelSize: 3,
    pixelGap: 0.5,
    letterSpacing: 1,
    width: 1200,
    height: 150,
  },
  parameters: {
    docs: {
      description: {
        story: '展示 PixelText 元件支援的所有字符和符號，包括字母、數字、標點符號、數學符號、幾何形狀和特殊符號',
      },
    },
  },
};

// 跑馬燈效果展示
export const MarqueeEffect: Story = {
  args: {
    text: 'SYSTEM',
    textEnabled: true,
    textBoxEnabled: true,
    textBox: 'VERY LONG TEXT CONTENT WILL SCROLL AUTOMATICALLY',
    textBoxWidth: 8,
    textBoxPadding: 1.5,
    marqueeEnabled: true,
    marqueeSpeed: 80,
    marqueePause: 1200,
    animated: true,
    durationTime: 800,
    animationDelay: 120,
    easeGlitch: true,
    primaryColor: '#00FFAA',
    onPrimaryColor: '#001122',
    pixelSize: 5,
    pixelGap: 1,
    letterSpacing: 2,
    width: 600,
    height: 120,
  },
  parameters: {
    docs: {
      description: {
        story: '展示跑馬燈效果：當 text-box 文字超過指定寬度時，文字會以像素為單位從左往右平滑滾動。跑馬燈會在亂碼解碼動畫完成後自動啟動，提供絲滑的視覺體驗。',
      },
    },
  },
};

// 純跑馬燈模式（無亂碼動畫）
export const MarqueeOnly: Story = {
  args: {
    text: '',
    textEnabled: false,
    textBoxEnabled: true,
    textBox: 'THIS IS A CONTINUOUS SCROLLING TEXT DEMONSTRATION FOR PIXELTEXT MARQUEE FEATURE',
    textBoxWidth: 12,
    textBoxPadding: 2,
    marqueeEnabled: true,
    marqueeSpeed: 60,
    marqueePause: 800,
    animated: false, // 關閉動畫，純跑馬燈
    primaryColor: '#FF6B35',
    onPrimaryColor: '#FFFFFF',
    pixelSize: 4,
    pixelGap: 1,
    letterSpacing: 1,
    width: 600,
    height: 80,
  },
  parameters: {
    docs: {
      description: {
        story: '純跑馬燈模式：關閉亂碼動畫，只顯示像素級平滑滾動效果。文字以 pixelSize 為單位進行精細移動，適用於需要持續顯示長文字的場景。',
      },
    },
  },
};
