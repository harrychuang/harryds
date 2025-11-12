// =============================================================================
// LIST CARD - STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import { ListCard } from './ListCard';

// Import referrer images
import referrerKrisImg from '../../../assets/imgs/referrers/referrer-kris.jpg';

const meta = {
  title: 'Components/ListCard',
  component: ListCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A testimonial card component that displays an avatar, title, name, and testimonial text. Supports light/dark theme switching.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    imageSrc: {
      control: 'text',
      description: 'Avatar image source URL',
    },
    title: {
      control: 'text',
      description: 'Job title or position',
    },
    name: {
      control: 'text',
      description: 'Person name',
    },
    testimonial: {
      control: 'text',
      description: 'Testimonial text content',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name',
    },
  },
} satisfies Meta<typeof ListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// STORIES
// =============================================================================

export const Default: Story = {
  args: {
    imageSrc: referrerKrisImg,
    title: 'Ex-Shopmatic Chief Product Officer',
    name: 'Kris Chen',
    testimonial: "I recommend Harry Chuang for UI/UX and Design. His detail and innovative approach enhance user experience. Harry blends functionality with aesthetics, ensuring designs serve their purpose.",
  },
};

