# ✅ Linode 部署檢查清單

使用這份清單來追蹤你的部署進度。

## 📋 部署前準備

### Linode 帳號
- [ ] 已註冊 Linode 帳號
- [ ] 已設置付款方式
- [ ] 已選擇伺服器方案（建議：Linode 2GB - $12/月）
- [ ] 已選擇地區（建議：Tokyo 2 或 Singapore）

### 域名設定（可選）
- [ ] 已購買域名
- [ ] 已設置 DNS A Record 指向 Linode IP
- [ ] DNS 已生效（可用 `ping your_domain.com` 測試）

### 本地準備
- [ ] 本地 Strapi 運行正常
- [ ] 已測試所有功能
- [ ] 已建立所有 Content Types
- [ ] 已準備好要上傳的資料
- [ ] 已備份本地資料

## 🖥️ 伺服器設置

### 基本設置
- [ ] Linode 已建立並啟動
- [ ] 已記錄 IP 位址：`___________________`
- [ ] 已記錄 Root 密碼（或之後改為 SSH Key）
- [ ] 可以 SSH 連線：`ssh root@your_ip`

### 系統更新
```bash
apt update && apt upgrade -y
```
- [ ] 系統更新完成

### 安裝 Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node --version  # 確認版本
```
- [ ] Node.js 18.x 已安裝
- [ ] npm 已安裝

### 安裝基本工具
```bash
apt install -y curl git build-essential
```
- [ ] 基本工具已安裝

## 🔒 安全設置

### 防火牆
```bash
apt install -y ufw
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw allow 1337    # Strapi
ufw enable
```
- [ ] UFW 防火牆已設置
- [ ] 已允許必要的 ports

### 建立非 root 使用者（建議）
```bash
adduser strapi
usermod -aG sudo strapi
```
- [ ] 已建立 strapi 使用者
- [ ] 已設置密碼

### SSH Key 設置（建議）
```bash
# 在本地電腦執行
ssh-keygen -t ed25519
ssh-copy-id strapi@your_ip
```
- [ ] SSH Key 已生成
- [ ] 公鑰已複製到伺服器
- [ ] 可以用 Key 登入

## 📦 部署 Strapi

### 建立目錄
```bash
mkdir -p /var/www/strapi
cd /var/www/strapi
```
- [ ] 部署目錄已建立

### 上傳檔案
選擇一種方式：

**方式 A：使用 SCP**
```bash
# 在本地電腦執行
cd "/Users/HarryChuang/Dropbox/Works/NOEIN Projects/noeinoi 2025/dev"
scp -r cms/* root@your_ip:/var/www/strapi/
```
- [ ] 檔案已上傳

**方式 B：使用 Git**
```bash
git clone your_repo_url /var/www/strapi
```
- [ ] 程式碼已 clone

### 安裝依賴
```bash
cd /var/www/strapi
npm install --production
```
- [ ] npm 套件已安裝

### 設置環境變數
```bash
nano /var/www/strapi/.env
```

填入以下內容（記得修改密鑰！）：
```env
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

APP_KEYS=your_key_1,your_key_2
API_TOKEN_SALT=your_salt
ADMIN_JWT_SECRET=your_secret
TRANSFER_TOKEN_SALT=your_salt
JWT_SECRET=your_secret

DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

URL=https://your_domain.com
```
- [ ] .env 檔案已建立
- [ ] 所有密鑰已設置
- [ ] URL 已設置（如使用域名）

### 建置 Strapi
```bash
npm run build
```
- [ ] Strapi 建置成功

## 🔄 進程管理（PM2）

### 安裝 PM2
```bash
npm install -g pm2
```
- [ ] PM2 已安裝

### 啟動 Strapi
```bash
cd /var/www/strapi
pm2 start npm --name "strapi" -- start
```
- [ ] Strapi 已用 PM2 啟動

### 設置開機自動啟動
```bash
pm2 startup
pm2 save
```
- [ ] PM2 開機自啟已設置

### 驗證運行
```bash
pm2 status
pm2 logs strapi
curl http://localhost:1337/admin
```
- [ ] Strapi 正常運行
- [ ] 可以訪問管理面板

## 🌐 Nginx 設置（如使用域名）

### 安裝 Nginx
```bash
apt install -y nginx
```
- [ ] Nginx 已安裝

### 建立設定檔
```bash
nano /etc/nginx/sites-available/strapi
```

填入設定（參考 deployment-linode.md）
- [ ] Nginx 設定檔已建立

### 啟用設定
```bash
ln -s /etc/nginx/sites-available/strapi /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```
- [ ] Nginx 設定已啟用
- [ ] Nginx 測試通過
- [ ] Nginx 已重新啟動

## 🔐 SSL 設置（HTTPS）

### 安裝 Certbot
```bash
apt install -y certbot python3-certbot-nginx
```
- [ ] Certbot 已安裝

### 取得 SSL 憑證
```bash
certbot --nginx -d your_domain.com
```
- [ ] SSL 憑證已取得
- [ ] Nginx 已自動設置 HTTPS

### 測試自動續期
```bash
certbot renew --dry-run
```
- [ ] 自動續期測試通過

## 📊 驗證部署

### 基本測試
- [ ] 可以訪問：`http://your_ip:1337/admin`
- [ ] 或訪問：`https://your_domain.com/admin`
- [ ] 可以登入管理面板
- [ ] API 可以正常訪問：`https://your_domain.com/api/feed-items`

### 前端連接測試
更新 portfolio 的 `.env.local`：
```env
VITE_STRAPI_URL=https://your_domain.com
```
- [ ] 前端可以連接到 Linode 的 Strapi
- [ ] 資料可以正常讀取
- [ ] 圖片可以正常顯示

## 💾 備份設置

### 建立備份腳本
```bash
nano /root/backup-strapi.sh
```
（內容參考 deployment-linode.md）
- [ ] 備份腳本已建立

### 設置 Cron 自動備份
```bash
chmod +x /root/backup-strapi.sh
crontab -e
# 加入: 0 2 * * * /root/backup-strapi.sh
```
- [ ] Cron job 已設置
- [ ] 備份腳本已測試

## 🚀 效能優化

### 設置 Swap（如果記憶體 < 2GB）
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```
- [ ] Swap 已設置

### PM2 記憶體限制
```bash
pm2 delete strapi
pm2 start npm --name "strapi" --max-memory-restart 512M -- start
pm2 save
```
- [ ] 記憶體限制已設置

## 📝 文件記錄

請記錄以下資訊以便日後維護：

### 伺服器資訊
- **IP 位址**：`___________________`
- **域名**：`___________________`
- **SSH 使用者**：`___________________`
- **伺服器方案**：`___________________`
- **地區**：`___________________`

### 管理員資訊
- **Strapi 管理員 Email**：`___________________`
- **API Token**（備份）：`___________________`

### 密鑰備份（安全儲存！）
- **APP_KEYS**：`___________________`
- **ADMIN_JWT_SECRET**：`___________________`

### 重要指令記錄
```bash
# SSH 連線
ssh strapi@your_ip

# 查看 Strapi 狀態
pm2 status

# 查看日誌
pm2 logs strapi

# 重新啟動
pm2 restart strapi

# 更新代碼（如使用 Git）
cd /var/www/strapi
git pull
npm install
npm run build
pm2 restart strapi

# 查看備份
ls -lh /root/backups/
```

## ✅ 部署完成

當所有項目都勾選後，恭喜！你已成功部署 Strapi 到 Linode！

### 下一步
- [ ] 測試所有功能
- [ ] 匯入正式資料
- [ ] 更新前端環境變數
- [ ] 設置監控（可選）
- [ ] 設置 CDN（可選，用於圖片加速）

### 維護提醒
- 每週檢查備份
- 每月檢查系統更新
- 監控伺服器資源使用
- 定期測試備份還原

## 🆘 遇到問題？

參考文件：
- [`deployment-linode.md`](./deployment-linode.md) - 完整部署指南
- [`quick-start.md`](./quick-start.md) - 常見問題

或查看日誌：
```bash
pm2 logs strapi
tail -f /var/log/nginx/error.log
```

