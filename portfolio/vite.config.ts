import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      hds: resolve(__dirname, '../harryds/src'),
      '@hds': resolve(__dirname, '../harryds/src')
    }
  },
  server: {
    fs: {
      allow: [resolve(__dirname, '..', 'harryds')]
    }
  }
});


