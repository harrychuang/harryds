import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

const STRAPI_PROXY_TARGET = process.env.STRAPI_PROXY_TARGET || 'http://172.104.73.171:1337';

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
    https: {
      key: fs.readFileSync('./.cert/key.pem'),
      cert: fs.readFileSync('./.cert/cert.pem'),
    },
    proxy: {
      '/strapi': {
        target: STRAPI_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/strapi/, ''),
      },
    },
    fs: {
      allow: [
        resolve(__dirname),
        resolve(__dirname, '..', 'harryds'),
        resolve(__dirname, '..', 'shared')
      ]
    }
  }
});

