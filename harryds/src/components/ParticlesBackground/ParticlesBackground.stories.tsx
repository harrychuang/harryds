// =============================================================================
// PARTICLES BACKGROUND - Storybook Stories
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import { ParticlesBackground } from './ParticlesBackground';

const meta = {
  title: 'Components/Effects/ParticlesBackground',
  component: ParticlesBackground,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Canvas-based particle background effect. Particles appear randomly, slowly rise, and fade out. Supports scroll interaction: particles accelerate and stretch when scrolling down, decelerate and compress when scrolling up.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    particleCount: {
      control: { type: 'range', min: 10, max: 200, step: 10 },
      description: 'Number of particles',
    },
    colors: {
      control: 'object',
      description: 'Array of particle colors (grayscale)',
    },
    sizeRange: {
      control: 'object',
      description: 'Particle size range [min, max]',
    },
    fixed: {
      control: 'boolean',
      description: 'Whether to use fixed positioning (fixed in background)',
    },
    zIndex: {
      control: { type: 'number', min: -10, max: 10 },
      description: 'z-index value',
    },
    backgroundColor: {
      control: 'color',
      description: 'Background color (usually transparent)',
    },
  },
} satisfies Meta<typeof ParticlesBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Default Story
// =============================================================================
export const Default: Story = {
  args: {
    particleCount: 80,
    colors: ['#444444', '#555555', '#666666', '#777777', '#888888', '#999999', '#aaaaaa'],
    sizeRange: [2, 6],
    fixed: true,
    zIndex: 1,
    backgroundColor: 'transparent',
  },
  render: (args) => (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh',
      overflow: 'auto',
      backgroundColor: '#0a0a0a',
    }}>
      <ParticlesBackground {...args} />
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        padding: '40px',
        color: '#ffffff',
        fontFamily: 'monospace',
        minHeight: '2000px',
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>ParticlesBackground Demo</h1>
        <p style={{ fontSize: '18px', marginBottom: '40px' }}>
          Scroll down to see particle interaction effects:
        </p>
        <ul style={{ fontSize: '16px', lineHeight: '1.8', marginBottom: '40px' }}>
          <li>✨ Particles appear at random positions on screen</li>
          <li>⬆️ Slowly rise 200-400px</li>
          <li>🌟 Fade in → Hold → Fade out</li>
          <li>🚀 Scroll down: Particles accelerate and stretch (speed line effect)</li>
          <li>🐌 Scroll up: Particles decelerate and compress</li>
          <li>⏸️ Stop scrolling: Return to normal speed and shape</li>
        </ul>
      </div>
    </div>
  ),
};


