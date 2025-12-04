// =============================================================================
// DISTORTED PIXELS STORYBOOK STORIES - 響應滾動的扭曲像素化圖片範例
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import DistortedPixels from './DistortedPixels';
import DistortedPixels2D from './DistortedPixels2D';
import './DistortedPixels.scss';

// 使用 Vite 原生 URL 匯入
const demoImg = new URL('../../../assets/imgs/project-demo.jpg', import.meta.url).href;

const meta = {
  title: 'Components/Effects/DistortedPixels',
  component: DistortedPixels,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Scroll-responsive distorted pixelated image component that creates vertical tearing and pixelation effects when page scrolling accelerates.

## Features
- 🎮 Dynamic pixelation effects responsive to scroll speed
- 🌊 Vertical tearing and distortion animations
- ⚡ High-performance rendering with Three.js and custom shaders
- 🎛️ Adjustable sensitivity, intensity and decay speed
- 📱 Responsive design and mobile device optimization support
- 🔧 Built-in debug mode showing effect parameters
- 🎨 Multiple object-fit modes support (includes responsive auto-height mode)
- 📐 responsive mode achieves HTML img-like width: 100%, height: auto effect

## Usage

\`\`\`tsx
import { DistortedPixels } from 'hds';

// Basic usage
<DistortedPixels 
  src="/path/to/image.jpg"
/>

// Custom effect parameters
<DistortedPixels 
  src="/path/to/image.jpg"
  maxPixelation={80}
  maxDistortion={1.5}
  scrollSensitivity={2.0}
  decaySpeed={0.98}
  objectFit="cover"
/>

// Responsive mode - HTML img-like width: 100%, height: auto
<DistortedPixels 
  src="/path/to/image.jpg"
  objectFit="responsive"
  onHeightChange={(height) => console.log('New height:', height)}
/>

// Enable debug mode
<DistortedPixels 
  src="/path/to/image.jpg"
  debug={true}
/>
\`\`\`

## Effect Mechanism

1. **Scroll Detection**: Listen to page scroll events, calculate scroll velocity
2. **Pixelation**: Dynamically adjust image pixelation level based on scroll speed
3. **Vertical Distortion**: Use shaders to create top-to-bottom tearing effects
4. **Smooth Decay**: Effects naturally decay back to normal state over time

## Notes

- Component requires page scrolling to see effects, may be limited in Storybook
- Recommended to test in actual pages for best experience
- Automatically reduces effect intensity on mobile devices to ensure performance
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    direction: {
      control: { type: 'radio' },
      options: ['y', 'x'],
      description: 'Distortion direction: y vertical tear, x horizontal tear',
      table: { type: { summary: "'x' | 'y'" }, defaultValue: { summary: 'x' } },
    },
    src: {
      control: 'text',
      description: 'Image URL (supports cross-origin)',
      table: { type: { summary: 'string' } },
    },
    objectFit: {
      control: { type: 'radio' },
      options: ['contain', 'cover', 'fill', 'responsive'],
      description: 'Image fitting mode (responsive: width 100%, height auto-calculated based on image ratio)',
      table: { type: { summary: 'DistortedPixelsObjectFit' }, defaultValue: { summary: 'cover' } },
    },
    maxPixelation: {
      control: { type: 'range', min: 0, max: 200, step: 10 },
      description: 'Maximum pixelation level (0-200, higher = larger pixel blocks)',
      table: { type: { summary: 'number' }, defaultValue: { summary: '150' } },
    },
    maxDistortion: {
      control: { type: 'range', min: 0, max: 3, step: 0.1 },
      description: 'Maximum distortion intensity (0-3)',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1.5' } },
    },
    scrollSensitivity: {
      control: { type: 'range', min: 0.1, max: 5, step: 0.1 },
      description: 'Scroll response sensitivity (higher = more sensitive)',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0.3' } },
    },
    decaySpeed: {
      control: { type: 'range', min: 0.9, max: 0.999, step: 0.001 },
      description: 'Effect decay speed (higher = faster decay, 0.9-0.999)',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0.95' } },
    },
    maxPixelRatio: {
      control: { type: 'range', min: 0.5, max: 12, step: 0.5 },
      description: 'DPR limit (prevents high pixel ratio burden on mobile devices)',
      table: { type: { summary: 'number' }, defaultValue: { summary: '4' } },
    },
    debug: {
      control: 'boolean',
      description: 'Enable debug mode (show effect parameters)',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name',
      table: { type: { summary: 'string' }, defaultValue: { summary: '""' } },
    },
  },
} satisfies Meta<typeof DistortedPixels>;

export default meta;
type Story = StoryObj<typeof meta>;

// Container styles
const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '80vh',
  margin: '0',
  padding: '20px'
};

const imageContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '500px',
  borderRadius: '8px'
};

// Default example
export const Default: Story = {
  render: (args) => (
    <div style={{ ...containerStyle, height: '2000px', paddingTop: '200px' }}>
      <div style={imageContainerStyle}>
        <DistortedPixels {...args} />
      </div>
    </div>
  ),
  args: {
    src: demoImg,
    objectFit: 'cover',
    direction: 'x',
    maxPixelation: 150,
    maxDistortion: 1.5,
    scrollSensitivity: 0.1,
    decaySpeed: 0.95,
    maxPixelRatio: 6,
    debug: false,
    className: 'scroll-hint',
  },
};

// Responsive mode example - width 100%, auto-adjust height
export const ResponsiveMode: Story = {
  render: (args) => (
    <div style={{ 
      ...containerStyle, 
      height: '2000px', 
      paddingTop: '200px',
      backgroundColor: '#f5f5f5' 
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '600px', 
        margin: '0 auto',
        border: '2px dashed #ccc',
        padding: '20px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>
          Responsive mode: Image auto-adjusts height based on container width
        </h3>
        <DistortedPixels 
          {...args}
          onHeightChange={(height) => {
            console.log('Container height auto-adjusted to:', height + 'px');
          }}
        />
      </div>
    </div>
  ),
  args: {
    src: demoImg,
    objectFit: 'responsive',
    direction: 'x',
    maxPixelation: 100,
    maxDistortion: 1.0,
    scrollSensitivity: 0.1,
    decaySpeed: 0.95,
    maxPixelRatio: 4,
    debug: true,
  },
};

// 2D Canvas version - default example
export const Default2D: Story = {
  render: (args) => (
    <div style={{ ...containerStyle, height: '2000px', paddingTop: '200px' }}>
      <div style={imageContainerStyle}>
        <DistortedPixels2D {...args} />
      </div>
    </div>
  ),
  args: {
    src: demoImg,
    objectFit: 'cover',
    direction: 'x',
    maxPixelation: 150,
    maxDistortion: 1.5,
    scrollSensitivity: 0.1,
    decaySpeed: 0.9,
    maxPixelRatio: 4,
    debug: false,
    className: 'scroll-hint',
  },
};

// 2D Canvas version - comparison with WebGL version
export const Compare2D: Story = {
  render: (args) => (
    <div style={{ ...containerStyle, height: '2200px', paddingTop: '200px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        alignItems: 'stretch'
      }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0' }}>WebGL (DistortedPixels)</h4>
          <div style={imageContainerStyle}>
            <DistortedPixels {...args} />
          </div>
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0' }}>Canvas 2D (DistortedPixels2D)</h4>
          <div style={imageContainerStyle}>
            <DistortedPixels2D {...args} />
          </div>
        </div>
      </div>
    </div>
  ),
  args: {
    src: demoImg,
    objectFit: 'cover',
    direction: 'x',
    maxPixelation: 150,
    maxDistortion: 1.5,
    scrollSensitivity: 0.1,
    decaySpeed: 0.9,
    maxPixelRatio: 4,
    debug: false,
  },
};
