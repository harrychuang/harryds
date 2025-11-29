// =============================================================================
// LOGO STORYBOOK STORIES - 品牌標誌元件範例
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import Logo from './Logo';

const meta = {
  title: 'Components/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Harry Design Studio brand logo component, implementing 8-bit text effects using PixelText2D.

## Features
- 🎮 8-bit pixel style brand logo
- 🏃 Smart marquee effect showcasing complete studio information
- 🎭 Supports glitch decode animation with seamless marquee transitions
- 🎨 Customizable theme colors
- 🔧 Adjustable visual parameters for optimal visual balance
- 🖼️ Canvas2D rendering without WebGL context limitations
- 📱 Better device compatibility

## Usage
\`\`\`tsx
import { Logo } from 'hds';

// Basic usage - default brand logo
<Logo />

// Back button style
<Logo type="back" />

// Custom colors
<Logo 
  type="default"
  primaryColor="#FF1246" 
  secondaryColor="#1B2350" 
/>

// Custom settings  
<Logo 
  type="default"
  animated={true}
  marqueeEnabled={true}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: { type: 'inline-radio' },
      options: ['default', 'back'],
      description: 'Logo type. "default" shows brand logo, "back" shows back button style',
      table: {
        type: { summary: 'LogoType' },
        defaultValue: { summary: 'default' },
      },
    },
    primaryColor: {
      control: { type: 'text' },
      description: 'Primary color (main text color & text-box background). Accepts CSS variables like var(--hds-sys-color-theme-surface)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'HDS_TOKENS.themeSurface' },
      },
    },
    secondaryColor: {
      control: { type: 'text' },
      description: 'Secondary color (text-box text color). Accepts CSS variables like var(--on-hds-sys-color-theme-surface)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'HDS_TOKENS.onThemeSurface' },
      },
    },

    animated: {
      control: 'boolean',
      description: 'Enable animation effects',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    marqueeEnabled: {
      control: 'boolean',
      description: 'Enable marquee effects',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },



    className: {
      control: 'text',
      description: 'Additional CSS class name',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default example - brand logo
export const Default: Story = {
  args: {
    type: 'default',
    animated: true,
    marqueeEnabled: true,
  },
};

// Back button style
export const Back: Story = {
  args: {
    type: 'back',
    animated: true,
    marqueeEnabled: false,
  },
};
