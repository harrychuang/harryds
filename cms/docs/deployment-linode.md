# 🚀 Linode 部署指南

這份指南將幫助你在 Linode 上部署 Strapi CMS。

## 📋 部署前準備清單

### 你需要提供的資訊：

#### 1. Linode 帳號資訊
- [ ] Linode 帳號（如果還沒有，需要先註冊）
- [ ] API Token（用於自動化部署，可選）

#### 2. 伺服器規格決定
- [ ] 選擇方案（建議最低：Nanode 1GB - $5/月）
- [ ] 選擇地區（建議：東京或新加坡，延遲較低）

#### 3. 域名設定（可選但建議）
- [ ] 域名（例如：cms.yourdomain.com）
- [ ] DNS 管理權限

#### 4. 資料庫選擇
- [ ] 決定使用 SQLite（簡單）或 PostgreSQL（建議正式環境）

## 🎯 我可以如何幫助你？

### 選項 A：完整自動化腳本
我可以為你建立：
- ✅ 伺服器初始化腳本
- ✅ 自動安裝所有依賴
- ✅ 設置 Nginx 反向代理
- ✅ 設置 PM2 進程管理
- ✅ 設置 SSL 憑證（Let's Encrypt）
- ✅ 自動部署腳本

**你需要提供：**
- Linode 伺服器的 IP 位址
- SSH 登入資訊
- 域名（如果要設置 SSL）

### 選項 B：手動部署指南
我提供詳細的步驟教學：
- ✅ 逐步操作說明
- ✅ 命令列指令
- ✅ 故障排除指南

**你需要：**
- 基本的終端機操作知識
- SSH 連線能力

### 選項 C：Docker 部署（推薦）
使用 Docker 容器化部署：
- ✅ 環境一致性
- ✅ 易於維護和更新
- ✅ 可以快速擴展

**你需要提供：**
- Linode 伺服器訪問權限

## 🏗️ 推薦架構

### 方案 1：簡單方案（適合測試/小型專案）
```
Linode Nanode 1GB ($5/月)
├── Ubuntu 22.04 LTS
├── Node.js 18.x
├── Strapi (SQLite)
├── PM2 (進程管理)
└── Nginx (可選，用於域名綁定)
```

**優點：**
- 💰 成本低
- 🚀 快速設置
- 📦 簡單維護

**缺點：**
- ⚠️ SQLite 不適合高流量
- ⚠️ 資源有限

### 方案 2：生產環境方案（推薦）
```
Linode Linode 2GB ($12/月)
├── Ubuntu 22.04 LTS
├── Node.js 18.x
├── Strapi
├── PostgreSQL 資料庫
├── PM2 (進程管理)
├── Nginx (反向代理 + SSL)
└── 自動備份
```

**優點：**
- ✅ 適合正式環境
- ✅ 效能穩定
- ✅ 可擴展性好

### 方案 3：Docker 方案（最推薦）
```
Linode Linode 2GB ($12/月)
├── Ubuntu 22.04 LTS
├── Docker + Docker Compose
├── Strapi Container
├── PostgreSQL Container
└── Nginx Container
```

**優點：**
- 🐳 易於部署和更新
- 🔄 環境一致
- 📦 易於遷移

## 📝 部署步驟概覽

### 步驟 1：建立 Linode 伺服器
1. 登入 Linode 控制台
2. 點擊 "Create Linode"
3. 選擇：
   - Distribution: Ubuntu 22.04 LTS
   - Region: Tokyo 2 或 Singapore
   - Plan: Nanode 1GB 或以上
   - Root Password: 設定強密碼
4. 記下 IP 位址

### 步驟 2：連接到伺服器
```bash
ssh root@your_server_ip
```

### 步驟 3：初始化伺服器
```bash
# 更新系統
apt update && apt upgrade -y

# 安裝必要工具
apt install -y curl git build-essential

# 安裝 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 驗證安裝
node --version
npm --version
```

### 步驟 4：設置防火牆
```bash
# 安裝 UFW
apt install -y ufw

# 允許 SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 1337  # Strapi 預設 port

# 啟用防火牆
ufw enable
```

### 步驟 5：部署 Strapi
```bash
# 建立部署目錄
mkdir -p /var/www/strapi
cd /var/www/strapi

# 從本地上傳檔案（在你的電腦上執行）
# scp -r cms/* root@your_server_ip:/var/www/strapi/

# 或使用 Git（如果程式碼在 Git 上）
# git clone your_repo_url .

# 安裝依賴
npm install --production

# 設置環境變數
nano .env
# (編輯設定，參考下方環境變數範本)

# 建置 Strapi
npm run build
```

### 步驟 6：安裝 PM2（進程管理）
```bash
npm install -g pm2

# 啟動 Strapi
pm2 start npm --name "strapi" -- start

# 設置開機自動啟動
pm2 startup
pm2 save

# 查看狀態
pm2 status
pm2 logs strapi
```

### 步驟 7：設置 Nginx（可選，用於域名）
```bash
# 安裝 Nginx
apt install -y nginx

# 建立 Nginx 設定
nano /etc/nginx/sites-available/strapi
```

Nginx 設定檔內容：
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

啟用設定：
```bash
ln -s /etc/nginx/sites-available/strapi /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 步驟 8：設置 SSL（HTTPS）
```bash
# 安裝 Certbot
apt install -y certbot python3-certbot-nginx

# 取得 SSL 憑證
certbot --nginx -d your_domain.com

# 測試自動續期
certbot renew --dry-run
```

## 🔧 環境變數設定（生產環境）

`.env` 檔案範本：

```env
# Server
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

# Secrets (使用強密碼！)
APP_KEYS=your_app_key_1,your_app_key_2
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
TRANSFER_TOKEN_SALT=your_transfer_token_salt
JWT_SECRET=your_jwt_secret

# Database (SQLite)
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# 或使用 PostgreSQL
# DATABASE_CLIENT=postgres
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=strapi
# DATABASE_USERNAME=strapi
# DATABASE_PASSWORD=your_password
# DATABASE_SSL=false

# Public URL (重要！前端需要這個)
URL=https://your_domain.com
```

## 🐳 Docker 部署（推薦方案）

### docker-compose.yml

我可以為你建立完整的 Docker Compose 設定，包括：
- Strapi 容器
- PostgreSQL 容器
- Nginx 容器
- 自動備份設定

## 📦 資料遷移

### 從本地到 Linode

1. **匯出本地資料**
```bash
# 在本地執行
cd cms
# 備份資料庫
cp .tmp/data.db data-backup.db
# 備份上傳的媒體檔案
tar -czf uploads.tar.gz public/uploads/
```

2. **上傳到 Linode**
```bash
# 從本地上傳
scp data-backup.db root@your_server_ip:/var/www/strapi/.tmp/data.db
scp uploads.tar.gz root@your_server_ip:/var/www/strapi/
```

3. **在伺服器解壓**
```bash
cd /var/www/strapi
tar -xzf uploads.tar.gz
pm2 restart strapi
```

## 🔒 安全性建議

### 1. 建立非 root 使用者
```bash
adduser strapi
usermod -aG sudo strapi
# 之後使用 strapi 使用者操作
```

### 2. 設置 SSH Key 登入
```bash
# 在本地電腦生成 SSH key
ssh-keygen -t ed25519

# 複製公鑰到伺服器
ssh-copy-id strapi@your_server_ip

# 停用密碼登入
nano /etc/ssh/sshd_config
# 設定: PasswordAuthentication no
systemctl restart sshd
```

### 3. 定期更新
```bash
# 建立自動更新腳本
apt install -y unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

### 4. 設置備份
```bash
# 建立備份腳本
nano /root/backup-strapi.sh
```

備份腳本內容：
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

# 備份資料庫
cp /var/www/strapi/.tmp/data.db $BACKUP_DIR/data_$DATE.db

# 備份上傳檔案
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/strapi/public/uploads/

# 保留最近 7 天的備份
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

設置每日自動備份：
```bash
chmod +x /root/backup-strapi.sh
crontab -e
# 加入: 0 2 * * * /root/backup-strapi.sh
```

## 🆘 故障排除

### Strapi 無法啟動
```bash
# 查看 PM2 日誌
pm2 logs strapi

# 檢查 port 是否被佔用
lsof -i :1337

# 重新啟動
pm2 restart strapi
```

### 記憶體不足
```bash
# 建立 Swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 連線問題
```bash
# 檢查防火牆
ufw status

# 檢查 Nginx
systemctl status nginx
nginx -t

# 查看 Nginx 日誌
tail -f /var/log/nginx/error.log
```

## 📊 監控和維護

### 安裝監控工具
```bash
# 安裝 htop（系統監控）
apt install -y htop

# PM2 監控
pm2 monit
```

### 效能優化
```bash
# 增加 Node.js 記憶體限制
pm2 delete strapi
pm2 start npm --name "strapi" --max-memory-restart 512M -- start
```

## 💰 成本估算

### 基本方案
- Linode Nanode 1GB: $5/月
- 域名（可選）: ~$10-15/年
- **總計：約 $5-6/月**

### 生產環境方案
- Linode 2GB: $12/月
- 域名（可選）: ~$10-15/年
- 備份空間（可選）: $2/月
- **總計：約 $14-15/月**

## 🎯 快速部署檢查清單

部署前：
- [ ] 本地 Strapi 測試正常
- [ ] 已建立所有 Content Types
- [ ] 已匯入測試資料
- [ ] 已設置環境變數

部署中：
- [ ] Linode 伺服器已建立
- [ ] SSH 可以連線
- [ ] Node.js 已安裝
- [ ] 檔案已上傳
- [ ] PM2 已設置
- [ ] 防火牆已設置

部署後：
- [ ] Strapi 可以訪問
- [ ] API 正常運作
- [ ] 管理面板可以登入
- [ ] 前端可以連接
- [ ] SSL 憑證已設置（如使用域名）
- [ ] 備份已設置

## 🚀 自動化部署腳本

我可以為你建立一鍵部署腳本，自動完成上述所有步驟！

## 📚 相關資源

- [Linode 官方文件](https://www.linode.com/docs/)
- [Strapi 部署文件](https://docs.strapi.io/dev-docs/deployment)
- [PM2 文件](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx 文件](https://nginx.org/en/docs/)

---

## 下一步

告訴我你想要：
1. **完整自動化腳本** - 我會建立一鍵部署腳本
2. **手動部署協助** - 我會逐步引導你
3. **Docker 部署** - 我會建立 Docker Compose 設定

以及你的需求：
- 預算多少？
- 預期流量？
- 是否需要域名？
- 傾向使用哪種資料庫？

