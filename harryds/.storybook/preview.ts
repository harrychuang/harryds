import type { Preview } from '@storybook/react';
import '../src/styles/globals.scss';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: true,
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'gray',
          value: '#f5f5f5',
        },
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const getColorString = (): string | null => {
        const g: any = (context as any).globals || {};
        const byGlobals = g.backgrounds?.value || g.background?.value || null;
        if (typeof byGlobals === 'string' && byGlobals.length > 0) return byGlobals;
        // Fallback: 讀取實際 body 計算後背景色
        const body = document.body;
        if (body) {
          const cs = getComputedStyle(body);
          const bg = cs.getPropertyValue('background-color') || cs.getPropertyValue('background');
          if (bg && bg.length > 0) return bg.trim();
        }
        return null;
      };

      const toRgb = (val: string): { r: number; g: number; b: number } | null => {
        const v = val.trim().toLowerCase();
        if (v.startsWith('#')) {
          const hex = v.replace('#', '');
          const full = hex.length === 3
            ? hex.split('').map((c) => c + c).join('')
            : hex;
          const intVal = parseInt(full, 16);
          const r = (intVal >> 16) & 255;
          const g = (intVal >> 8) & 255;
          const b = intVal & 255;
          return { r, g, b };
        }
        const m = v.match(/rgba?\(([^)]+)\)/);
        if (m) {
          const parts = m[1].split(',').map((x) => Number(x.trim()));
          if (parts.length >= 3) {
            return { r: parts[0], g: parts[1], b: parts[2] };
          }
        }
        return null;
      };

      const col = getColorString();
      const rgb = col ? toRgb(col) : null;
      const luminance = rgb ? (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255 : 1;
      const isDark = luminance < 0.5;
      const theme = isDark ? 'dark' : 'light';
      const root = document.documentElement;
      const body = document.body;
      if (theme === 'dark') {
        root.setAttribute('theme', 'dark');
        if (body) body.setAttribute('theme', 'dark');
      } else {
        root.removeAttribute('theme');
        if (body) body.removeAttribute('theme');
      }
      return Story();
    }
  ]
};

export default preview;