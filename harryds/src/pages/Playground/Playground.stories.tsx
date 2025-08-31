// =============================================================================
// PLAYGROUND 頁面 STORYBOOK STORIES
// =============================================================================

import type { Meta, StoryObj } from '@storybook/react';
import Playground from './Playground';

const meta = {
  title: 'Pages/Playground',
  component: Playground,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Playground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Playground />,
};
