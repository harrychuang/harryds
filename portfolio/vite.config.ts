import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import prerender from '@prerenderer/rollup-plugin';
import { prerenderRoutes } from './prerender.routes';

const STRAPI_PROXY_TARGET = process.env.STRAPI_PROXY_TARGET || 'http://172.104.73.171:1337';

// 檢查是否有 HTTPS 證書（開發環境用）
const hasHttpsCert = fs.existsSync('./.cert/key.pem') && fs.existsSync('./.cert/cert.pem');

// 是否為生產環境 build
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    react(),
    // 預渲染插件已移除，改用 postbuild 腳本生成 SEO 頁面
  ].filter(Boolean),
  
  // 生產環境的 base path（部署到根目錄）
  base: '/',
  
  resolve: {
    alias: {
      hds: resolve(__dirname, '../harryds/src'),
      '@hds': resolve(__dirname, '../harryds/src'),
      '@assets': resolve(__dirname, '../harryds/assets'),
      shared: resolve(__dirname, '../shared')
    }
  },
  
  // 打包配置
  build: {
    outDir: 'dist',
    sourcemap: false, // 生產環境關閉 sourcemap
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // 分割 chunks 以優化載入
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          animation: ['gsap'],
          three: ['three'],
        },
      },
    },
  },
  
  server: {
    // 只在開發環境且有證書時啟用 HTTPS
    ...(hasHttpsCert ? {
      https: {
        key: fs.readFileSync('./.cert/key.pem'),
        cert: fs.readFileSync('./.cert/cert.pem'),
      },
    } : {}),
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

