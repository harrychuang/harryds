import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Button } from '../Button/Button';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outlined', 'elevated'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <CardBody>
        <p>這是一個基本的卡片元件。</p>
      </CardBody>
    ),
  },
};

export const WithHeader: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <h3>卡片標題</h3>
        </CardHeader>
        <CardBody>
          <p>這是卡片的主要內容區域。</p>
        </CardBody>
      </>
    ),
  },
};

export const Complete: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <h3>完整卡片範例</h3>
          <p>副標題或描述</p>
        </CardHeader>
        <CardBody>
          <p>這是一個包含標題、內容和頁腳的完整卡片範例。</p>
        </CardBody>
        <CardFooter>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm">確認</Button>
            <Button variant="ghost" size="sm">取消</Button>
          </div>
        </CardFooter>
      </>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: (
      <CardBody>
        <p>這是一個外框變體的卡片。</p>
      </CardBody>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <CardBody>
        <p>這是一個高架變體的卡片。</p>
      </CardBody>
    ),
  },
};