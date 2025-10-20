import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      hds: resolve(__dirname, '../harryds/src'),
      '@hds': resolve(__dirname, '../harryds/src'),
      '@assets': resolve(__dirname, '../harryds/assets'),
      shared: resolve(__dirname, '../shared')
    }
  },
  server: {
    fs: {
      allow: [
        resolve(__dirname),
        resolve(__dirname, '..', 'harryds'),
        resolve(__dirname, '..', 'shared')
      ]
    }
  }
});


