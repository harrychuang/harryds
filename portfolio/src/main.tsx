import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.scss';
import './i18n';

const container = document.getElementById('root')!;
const root = createRoot(container);

// 根據環境設定 basename（生產環境部署在 /harryds/ 子目錄）
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

root.render(
  <React.StrictMode>
    <BrowserRouter
      basename={basename}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);


