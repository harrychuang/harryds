# 🚀 Portfolio 部署指南

## 前置準備

### 1. 環境變數設定

在 `portfolio` 資料夾建立 `.env.production` 檔案：

```bash
# 生產環境配置
# 正式網域：https://noeinoi.com

# Strapi CMS 的正式 URL（必須是完整的 URL）
VITE_STRAPI_URL=http://172.104.73.171:1337

# EmailJS 配置（聯絡表單）
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## 打包步驟

### 方法一：本地打包

```bash
# 1. 進入 portfolio 資料夾
cd portfolio

# 2. 安裝依賴（如果還沒安裝）
npm install

# 3. 執行打包
npm run build

# 4. 打包完成後，檔案會在 dist/ 資料夾
```

打包完成後，`dist/` 資料夾包含：
- `index.html` - 入口頁面
- `assets/` - JS、CSS、圖片等資源

### 方法二：預覽打包結果

```bash
# 本地預覽打包後的網站
npm run preview
```

這會在本地啟動一個伺服器，讓你檢查打包結果是否正常。

---

## 部署選項

### 選項 A：靜態主機（Vercel / Netlify）

#### Vercel 部署

1. 安裝 Vercel CLI：
   ```bash
   npm i -g vercel
   ```

2. 登入並部署：
   ```bash
   cd portfolio
   vercel
   ```

3. 設定環境變數（在 Vercel Dashboard）：
   - `VITE_STRAPI_URL`
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`

#### Netlify 部署

1. 安裝 Netlify CLI：
   ```bash
   npm i -g netlify-cli
   ```

2. 登入並部署：
   ```bash
   cd portfolio
   netlify deploy --prod --dir=dist
   ```

### 選項 B：傳統伺服器（Nginx）

1. 上傳 `dist/` 資料夾內容到伺服器

2. Nginx 設定範例：

```nginx
server {
    listen 80;
    server_name noeinoi.com www.noeinoi.com;
    
    # 強制 HTTPS 重導向
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name noeinoi.com www.noeinoi.com;
    root /var/www/noeinoi;
    index index.html;

    # SSL 憑證（使用 Let's Encrypt 或其他）
    ssl_certificate /etc/letsencrypt/live/noeinoi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/noeinoi.com/privkey.pem;

    # SPA 路由支援 - 所有路徑都導向 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 靜態資源快取
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 壓縮
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### 選項 C：Apache 伺服器

在 `dist/` 資料夾建立 `.htaccess`：

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# 快取靜態資源
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
```

---

## CORS 設定（重要！）

由於前端會直接請求 Strapi API，需要確保 Strapi 有正確的 CORS 設定。

在 Strapi 的 `config/middlewares.js` 中：

```javascript
module.exports = [
  // ...其他中間件
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: [
        'http://localhost:5173',
        'https://noeinoi.com',
        'https://www.noeinoi.com',
      ],
    },
  },
];
```

---

## 常見問題

### Q: 打包失敗：找不到 harryds 模組？

確保在同一個父目錄下有 `harryds` 資料夾：
```
dev/
├── portfolio/     ← 你在這裡執行 npm run build
├── harryds/       ← 這個資料夾必須存在
└── shared/        ← 這個資料夾必須存在
```

### Q: 部署後圖片/API 無法載入？

1. 檢查 `VITE_STRAPI_URL` 是否正確設定
2. 檢查 Strapi 的 CORS 是否允許你的網域
3. 確保 Strapi 服務正在運行

### Q: 路由不正常（刷新 404）？

這是 SPA 的常見問題，需要設定伺服器將所有路由導向 `index.html`。
參考上面的 Nginx 或 Apache 設定。

---

## 部署檢查清單

- [ ] `.env.production` 已設定正確的環境變數
- [ ] 執行 `npm run build` 成功
- [ ] 執行 `npm run preview` 本地預覽正常
- [ ] Strapi CORS 已加入正式網域
- [ ] Strapi 服務正在運行
- [ ] 伺服器已設定 SPA 路由支援
- [ ] HTTPS 已設定（建議）
