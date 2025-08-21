import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Welcome/開始使用',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Welcome: Story = {
  render: () => (
    <div style={{ 
      padding: '2rem',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem',
          fontWeight: 700,
          color: '#2563eb',
          marginBottom: '1rem'
        }}>
          Harry Design System
        </h1>
        <p style={{ 
          fontSize: '1.125rem',
          color: '#737373',
          marginBottom: '2rem'
        }}>
          歡迎使用 Storybook 開發環境
        </p>
      </div>

      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}>🚀 開始開發</h2>
        <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
          您的 Storybook 環境已經準備就緒！現在可以開始建立您的元件。
        </p>
        <ol style={{ 
          listStyle: 'decimal',
          paddingLeft: '1.5rem',
          lineHeight: 1.6,
          color: '#475569'
        }}>
          <li>在 <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>src/components/</code> 中建立新元件</li>
          <li>為每個元件建立 <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>.stories.tsx</code> 檔案</li>
          <li>在左側導航中查看您的元件</li>
        </ol>
      </div>

      <div style={{
        background: '#fefce8',
        border: '1px solid #fde047',
        borderRadius: '12px',
        padding: '1.5rem'
      }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#a16207' }}>💡 提示</h3>
        <p style={{ margin: 0, lineHeight: 1.6, color: '#a16207' }}>
          這是一個簡化版的 Storybook 環境，沒有複雜的 design tokens 或樣式系統。
          您可以直接在元件的 SCSS 檔案中編寫樣式。
        </p>
      </div>
    </div>
  ),
};
