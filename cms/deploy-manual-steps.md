# 📝 手動部署步驟 - 172.104.73.171

## 伺服器資訊
- **IP**: 172.104.73.171
- **系統**: Ubuntu 20.10
- **地區**: Tokyo 2
- **規格**: Nanode 1GB

---

## 步驟 1：連接到伺服器

```bash
ssh root@172.104.73.171
```

輸入你設置的 root 密碼。

---

## 步驟 2：更新系統

```bash
apt update && apt upgrade -y
```

---

## 步驟 3：安裝 Node.js 18.x

```bash
# 安裝 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 驗證安裝
node --version
npm --version
```

應該看到：
- Node.js: v18.x.x
- npm: v9.x.x 或更高

---

## 步驟 4：安裝基本工具

```bash
apt install -y curl git build-essential ufw
```

---

## 步驟 5：設置防火牆

```bash
# 啟用防火牆並允許必要的 ports
ufw allow 22      # SSH
ufw allow 80      # HTTP
ufw allow 443     # HTTPS
ufw allow 1337    # Strapi
ufw --force enable

# 確認狀態
ufw status
```

---

## 步驟 6：建立部署目錄

```bash
mkdir -p /var/www/strapi
cd /var/www/strapi
```

---

## 步驟 7：上傳檔案（在本地電腦執行）

開啟**新的終端視窗**（不要關閉 SSH 連線），在本地執行：

```bash
# 進入 cms 資料夾
cd "/Users/HarryChuang/Dropbox/Works/NOEIN Projects/noeinoi 2025/dev/cms"

# 上傳檔案到伺服器
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.tmp' \
  --exclude 'build' \
  --exclude '.cache' \
  --exclude '.env' \
  ./ root@172.104.73.171:/var/www/strapi/
```

這會需要幾分鐘，取決於網路速度。

---

## 步驟 8：在伺服器上安裝依賴（回到 SSH 視窗）

```bash
cd /var/www/strapi
npm install --production
```

---

## 步驟 9：設置環境變數

```bash
# 生成隨機密鑰並建立 .env 檔案
cat > .env << 'EOF'
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

APP_KEYS=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"),$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
API_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")
ADMIN_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")
TRANSFER_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")

DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

URL=http://172.104.73.171:1337
EOF

# 執行命令來真正生成密鑰
cat > .env << EOF
HOST=0.0.0.0
PORT=1337
NODE_ENV=production

APP_KEYS=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"),$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
API_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")
ADMIN_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")
TRANSFER_TOKEN_SALT=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(16).toString('base64'))")

DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

URL=http://172.104.73.171:1337
EOF

# 確認 .env 已建立
cat .env
```

---

## 步驟 10：建置 Strapi

```bash
npm run build
```

這會需要幾分鐘。

---

## 步驟 11：安裝 PM2

```bash
npm install -g pm2
```

---

## 步驟 12：啟動 Strapi

```bash
# 啟動 Strapi
pm2 start npm --name "strapi" --max-memory-restart 400M -- start

# 設置開機自動啟動
pm2 startup
# 複製輸出的命令並執行

# 儲存 PM2 設定
pm2 save

# 查看狀態
pm2 status
pm2 logs strapi
```

---

## 步驟 13：驗證部署

在瀏覽器中訪問：
```
http://172.104.73.171:1337/admin
```

你應該會看到 Strapi 管理面板！

---

## ✅ 完成！

現在你可以：
1. 建立管理員帳號
2. 建立 Content Types
3. 設置 API 權限
4. 匯入資料

---

## 🔧 常用命令

```bash
# 查看狀態
pm2 status

# 查看日誌
pm2 logs strapi

# 重新啟動
pm2 restart strapi

# 停止
pm2 stop strapi

# 查看資源使用
pm2 monit

# 查看系統記憶體
free -h

# 查看磁碟空間
df -h
```

---

## 💡 記憶體優化（針對 1GB RAM）

如果遇到記憶體不足，可以：

```bash
# 1. 重新啟動並限制記憶體
pm2 delete strapi
pm2 start npm --name "strapi" --max-memory-restart 400M -- start
pm2 save

# 2. 確認 Swap 啟用
swapon --show

# 3. 如需要，可以增加 Swap（已有 512MB 應該夠用）
```

---

## 🆘 故障排除

### Strapi 無法啟動
```bash
# 查看詳細日誌
pm2 logs strapi --lines 100

# 手動測試啟動
cd /var/www/strapi
npm start
```

### Port 被佔用
```bash
# 查看誰在使用 1337
lsof -i :1337

# 如需要，停止該進程
kill -9 PID
```

### 記憶體不足
```bash
# 查看記憶體使用
free -h
htop  # (先安裝: apt install htop)

# 重新啟動並降低記憶體限制
pm2 delete strapi
pm2 start npm --name "strapi" --max-memory-restart 350M -- start
```

