// =============================================================================
// PIXEL TEXT STORYBOOK STORIES - 8-bit 風格文字元件範例
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import PixelText from './PixelText';
import PixelText2D from './PixelText2D';
import './PixelText.scss';

const meta = {
  title: 'Components/PixelText',
  component: PixelText,
  parameters: {
    layout: 'centered',
    // Override global color matcher to prevent *Color params from being forced to color controls
    controls: {
      matchers: {
        color: null,
      },
    },
    docs: {
      description: {
        component: `
8-bit pixel text component that renders text using Three.js square particles.

## Features
- 🎮 Classic 8-bit pixel style
- ⚡ High-performance rendering with Three.js
- 🎨 Customizable colors, sizes, and spacing
- 🎭 Hacker-style glitch decode animation
- 🌊 Smooth easing animation effects
- 📦 Text-box functionality (inverted background color, centered, with padding)
- 🎛️ Independent toggle controls for main text and text-box
- 📏 Smart spacing control (textBoxPadding as both padding and element spacing)
- 🏃 Smart marquee effect (infinite loop with pixel-perfect smooth scrolling, seamless text wrapping)
- 🔤 Custom space width (adjustable space character width)
- 📱 Responsive design support
- ♿ Accessibility compliant

## Usage
\`\`\`tsx
import { PixelText } from 'hds';

// Basic usage
<PixelText 
  text="HELLO WORLD" 
  primaryColor="#00FF00" 
  pixelSize={6}
/>

// Hacker animation effect
<PixelText 
  text="DECODING" 
  primaryColor="#00FFAA"
  animated={true}
  easeGlitch={true}
  glitchInterval={20}
  animationDelay={150}
/>

// Text-Box functionality (centered with padding)
<PixelText 
  text="LEVEL" 
  textBoxEnabled={true}
  textBox="001"
  textBoxWidth={5}
  textBoxPadding={2}  // Controls both padding and element spacing
  primaryColor="#00FF00"
  onPrimaryColor="#FFFFFF"
/>

// Toggle control - show text-box only
<PixelText 
  text="HIDDEN TEXT"
  textEnabled={false}    // Disable main text
  textBoxEnabled={true}  // Enable text-box
  textBox="VISIBLE"
  primaryColor="#FF6B6B"
  onPrimaryColor="#FFFFFF"
/>

// Marquee effect - auto scroll when text is too long
<PixelText 
  text="SYSTEM"
  textBoxEnabled={true}
  textBox="VERY LONG TEXT CONTENT WILL SCROLL"  // Marquee when exceeds textBoxWidth
  textBoxWidth={8}       // Show only 8 character width
  marqueeEnabled={true}   // Enable marquee (enabled by default)
  marqueeSpeed={25}       // Marquee speed (ms) - 25ms per pixel movement (infinite loop, fast version)
  marqueePause={600}      // Pause time at start
  animated={true}         // Marquee starts after glitch animation ends
  primaryColor="#00FFAA"
  onPrimaryColor="#000000"
/>

// Custom space width - control space character display width
<PixelText 
  text="HELLO WORLD TEST"    // Text containing spaces
  textBoxEnabled={true}
  textBox="A B C D"           // Text-box also has spaces
  spaceWidth={2.5}           // Space width is 2.5x of letterSpacing
  letterSpacing={3}          // Character spacing is 3 pixels
  primaryColor="#9146FF"
  onPrimaryColor="#FFFFFF"
  pixelSize={5}
/>
\`\`\`

## Supported Characters
- **Letters**: A-Z
- **Numbers**: 0-9  
- **Punctuation**: , 。 . - ? ! @ ″ „
- **Math symbols**: + × ÷ %
- **Special symbols**: ‼︎ ⁇
- **Geometric shapes**: ▶︎ ▷ ◆ ● ◼︎ ◻︎
- **Arrow symbols**: ↑ ↓ ← → < > ^ ↧
- **Light & celestial**: ☀︎ ☽
- **Other symbols**: ﹅ ⟨ ⟩ [ ] ⎢
- **Space**

Total of **75 characters** supported. Unsupported characters will display as spaces and show warnings in console.
        `,
      },
    },
  },
  args: {
    primaryColor: 'var(--hds-sys-color-theme-surface)',
    onPrimaryColor: 'var(--on-hds-sys-color-theme-surface)'
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'Text to display (supports letters, numbers, punctuation, math symbols, geometric shapes, arrows, light & celestial symbols - 75 characters total)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    textEnabled: {
      control: 'boolean',
      description: 'Enable main text display',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    pixelSize: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description: 'Size of each pixel (in pixels)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '4' },
      },
    },
    pixelGap: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
      description: 'Gap between pixels',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '0' },
      },
    },
    primaryColor: {
      control: { type: 'text' },
      description: 'Primary color (text color & text-box background). Accepts CSS variables like var(--hds-sys-color-theme-surface)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'var(--hds-sys-color-theme-surface)' },
      },
    },
    onPrimaryColor: {
      control: { type: 'text' },
      description: 'Text color on primary (text-box text color). Accepts CSS variables like var(--on-hds-sys-color-theme-surface)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'var(--on-hds-sys-color-theme-surface)' },
      },
    },
    letterSpacing: {
      control: { type: 'range', min: 0, max: 10, step: 1 },
      description: 'Letter spacing (in pixels)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1' },
      },
    },
    width: {
      control: { type: 'range', min: 100, max: 800, step: 50 },
      description: 'Canvas width',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '400' },
      },
    },
    height: {
      control: { type: 'range', min: 50, max: 200, step: 10 },
      description: 'Canvas height',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '100' },
      },
    },

    antialias: {
      control: 'boolean',
      description: 'Enable anti-aliasing',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
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
    animated: {
      control: 'boolean',
      description: 'Enable animation effects',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },

    durationTime: {
      control: { type: 'range', min: 200, max: 5000, step: 100 },
      description: 'Duration for each letter animation (milliseconds)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '1000' },
      },
    },
    animationDelay: {
      control: { type: 'range', min: 50, max: 1000, step: 50 },
      description: 'Animation delay between characters (milliseconds)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '150' },
      },
    },
    glitchInterval: {
      control: { type: 'range', min: 20, max: 200, step: 10 },
      description: 'Glitch jump interval (milliseconds) - smaller value = faster jumping',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '20' },
      },
    },
    easeGlitch: {
      control: 'boolean',
      description: 'Enable ease-out glitch animation (starts fast, ends slow)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    textBoxEnabled: {
      control: 'boolean',
      description: 'Enable text-box functionality',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    textBox: {
      control: 'text',
      description: 'Text content for text-box (displays to the right of main text with inverted colors)',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    textBoxWidth: {
      control: { type: 'range', min: 1, max: 20, step: 1 },
      description: 'Width of text-box (in character count)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '5' },
      },
    },
    textBoxPadding: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
      description: 'Text-box padding (multiplier of pixelSize). When both text and text-box are enabled, also serves as spacing between them',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '2' },
      },
    },
    marqueeEnabled: {
      control: 'boolean',
      description: 'Enable marquee effect (auto scroll when text-box content exceeds width)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    marqueeSpeed: {
      control: { type: 'range', min: 10, max: 1000, step: 5 },
      description: 'Marquee movement speed (milliseconds) - interval per pixel movement, higher = slower (infinite loop mode)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '25' },
      },
    },
    marqueePause: {
      control: { type: 'range', min: 0, max: 3000, step: 50 },
      description: 'Marquee pause time at start (milliseconds) - wait time after animation ends',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '300' },
      },
    },
    spaceWidth: {
      control: { type: 'range', min: 0.5, max: 5, step: 0.5 },
      description: 'Space character width multiplier (relative to letterSpacing multiplier)',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: '2' },
      },
    },
    swapTextAndBox: {
      control: 'boolean',
      description: 'When true, swap text and text-box positions (text-box on left, text on right)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
} satisfies Meta<typeof PixelText>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default example - using same marquee settings as MarqueeEffect
export const Default: Story = {
  args: {
    text: 'HARRY',
    textEnabled: true,
    textBoxEnabled: true,
    textBox: 'VERY LONG TEXT CONTENT WILL SCROLL AUTOMATICALLY',
    textBoxWidth: 4,
    textBoxPadding: 1.5,
    marqueeEnabled: true,
    marqueeSpeed: 10,
    marqueePause: 400,
    animated: true,
    durationTime: 500,
    animationDelay: 120,
    easeGlitch: false,
    // Use component default theme tokens for color inversion when switching Storybook background
    pixelSize: 4,
    pixelGap: 0,
    letterSpacing: 1,
    width: 600,
    height: 120,
  },
};

// Letters and Numbers showcase
export const LettersAndNumbers: Story = {
  args: {
    text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ   0123456789',
    pixelSize: 3,
    pixelGap: 0,
    letterSpacing: 1,
    width: 1200,
    height: 120,
  },
  parameters: {
    docs: {
      description: {
        story: `Showcases the English letters and numbers supported by PixelText component:
        
**Letters** (26): A-Z  
**Numbers** (10): 0-9

These are the most commonly used basic characters, supporting all uppercase English letters and Arabic numerals.`,
      },
    },
  },
};

// Symbols and Icons showcase
export const SymbolsAndIcons: Story = {
  args: {
    text: ',。.-?!@″„   +×÷%   ‼︎⁇   ▶︎▷◆●◼︎◻︎   ☀︎☽   ﹅⟨⟩[]⎢',
    pixelSize: 2,
    pixelGap: 0,
    letterSpacing: 2,
    width: 1100,
    height: 120,
  },
  parameters: {
    docs: {
      description: {
        story: `Showcases various symbols and icons supported by PixelText component:
        
**Punctuation** (9): , 。 . - ? ! @ ″ „  
**Math symbols** (4): + × ÷ %  
**Special symbols** (2): ‼︎ ⁇  
**Geometric shapes** (6): ▶︎ ▷ ◆ ● ◼︎ ◻︎  
**Light & celestial** (2): ☀︎ ☽  
**Other symbols** (5): ﹅ ⟨ ⟩ [ ] ⎢

These symbols can be used to create richer visual effects and information displays.`,
      },
    },
  },
};

// Arrow Symbols showcase
export const ArrowSymbols: Story = {
  args: {
    text: '↑↓←→ ↤↦↥↧',
    pixelSize: 4,
    pixelGap: 0,
    letterSpacing: 4,
    width: 600,
    height: 120,
  },
  parameters: {
    docs: {
      description: {
        story: `Showcases arrow symbols supported by PixelText component:
        
**Arrow symbols** (8): ↑ ↓ ← → ↤ ↦ ↥ ↧

These arrow symbols are particularly suitable for navigation, direction indication, or creating interactive interface elements. Uses larger pixel size and spacing to highlight the details of each arrow.`,
      },
    },
  },
};

// ============================================================================= 
// CANVAS 2D VERSION DEMOS - Using 2D Canvas instead of WebGL
// =============================================================================

export const Canvas2DDefault: Story = {
  name: 'Canvas2D',
  render: (args) => <PixelText2D {...args} />,
  args: {
    text: 'CANVAS2D',
    textEnabled: true,
    textBoxEnabled: true,
    textBox: 'NO WEBGL LIMITS',
    textBoxWidth: 6,
    textBoxPadding: 1.5,
    marqueeEnabled: true,
    marqueeSpeed: 15,
    marqueePause: 500,
    animated: true,
    durationTime: 600,
    animationDelay: 100,
    easeGlitch: true,
    pixelSize: 5,
    pixelGap: 0,
    letterSpacing: 1,
    width: 700,
    height: 120,
  },
  parameters: {
    docs: {
      description: {
        story: `PixelText rendered with 2D Canvas API, solving WebGL context limitations.
        
**Main advantages:**
- 🔄 No WebGL context count limitations
- 🚀 Can render multiple instances simultaneously
- 📱 Better device compatibility
- ⚡ Maintains same API and functionality

Completely same functionality as original PixelText, including: glitch animations, marquee effects, text-box functionality, etc.`,
      },
    },
  },
};

export const Canvas2DVsWebGL: Story = {
  name: 'Canvas2D vs WebGL',
  args: {
    text: 'DEMO', // 不會使用，但為了滿足 TypeScript 要求
  },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' }}>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#000' }}>WebGL</h3>
        <PixelText
          text="WEBGL"
          textEnabled={true}
          textBoxEnabled={true}
          textBox="THREE.JS"
          textBoxWidth={4}
          textBoxPadding={2}
          animated={true}
          durationTime={500}
          animationDelay={100}
          easeGlitch={true}
          pixelSize={2}
          letterSpacing={1}
          width={350}
          height={80}
          primaryColor="#000"
          onPrimaryColor="#fff"
        />
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
          <strong>Advantages:</strong> High performance, 3D support<br/>
          <strong>Limitations:</strong> WebGL context count restrictions
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#000' }}>Canvas2D</h3>
        <PixelText2D
          text="CANVAS2D"
          textEnabled={true}
          textBoxEnabled={true}
          textBox="NO LIMITS"
          textBoxWidth={5}
          textBoxPadding={2}
          animated={true}
          durationTime={500}
          animationDelay={100}
          easeGlitch={true}
          pixelSize={2}
          letterSpacing={1}
          width={350}
          height={80}
          primaryColor="#000"
          onPrimaryColor="#FFFFFF"
        />
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
          <strong>Advantages:</strong> No quantity limits, broad compatibility<br/>
          <strong>Features:</strong> Same API, complete functionality
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `Visual comparison between the two versions. Both use the same API but different underlying rendering technologies:

| Feature | PixelText (WebGL) | PixelText2D (Canvas) |
|------|-------------------|---------------------|
| **Performance** | High (GPU accelerated) | Medium (CPU rendering) |
| **Instance limit** | Limited (~16-32) | Unlimited |
| **Device support** | Requires WebGL | Broad support |
| **Memory usage** | Lower | Higher |
| **Feature completeness** | Complete | Complete |

**Recommendations:**
- Few instances + high performance required → Choose PixelText
- Multiple instances or compatibility priority → Choose PixelText2D`,
      },
    },
  },
};

