#!/bin/bash

# ============================================================================
# Strapi 自動部署到 Linode 腳本
# ============================================================================
# 
# 使用方式：
#   chmod +x deploy-to-linode.sh
#   ./deploy-to-linode.sh YOUR_LINODE_IP
#
# 例如：
#   ./deploy-to-linode.sh 123.456.789.0
#
# ============================================================================

set -e  # 遇到錯誤立即停止

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 檢查參數
if [ -z "$1" ]; then
    echo -e "${RED}❌ 錯誤：請提供 Linode IP 位址${NC}"
    echo "使用方式: $0 YOUR_LINODE_IP"
    echo "例如: $0 123.456.789.0"
    exit 1
fi

LINODE_IP=$1
SSH_USER=${2:-root}  # 預設使用 root，也可以指定其他使用者

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Strapi 部署到 Linode${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}目標伺服器：${NC}$SSH_USER@$LINODE_IP"
echo ""

# 測試連線
echo -e "${BLUE}📡 測試 SSH 連線...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=no $SSH_USER@$LINODE_IP "echo '連線成功'" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  無法使用 SSH Key 連線，將使用密碼登入${NC}"
    echo -e "${YELLOW}💡 提示：輸入密碼時不會顯示字元，這是正常的${NC}"
    echo ""
fi

# 建立伺服器初始化腳本
echo -e "${BLUE}📝 準備伺服器初始化腳本...${NC}"
cat > /tmp/strapi-server-init.sh << 'INIT_SCRIPT'
#!/bin/bash
set -e

echo "🔧 開始初始化伺服器..."

# 更新系統
echo "📦 更新系統套件..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold"

# 安裝基本工具
echo "🔧 安裝基本工具..."
apt-get install -y curl git build-essential ufw

# 安裝 Node.js 18.x
echo "📦 安裝 Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# 驗證安裝
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✅ Node.js $NODE_VERSION 已安裝"
echo "✅ npm $NPM_VERSION 已安裝"

# 安裝 PM2
echo "📦 安裝 PM2..."
npm install -g pm2

# 設置防火牆
echo "🔒 設置防火牆..."
ufw --force enable
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 1337  # Strapi

# 建立部署目錄
echo "📁 建立部署目錄..."
mkdir -p /var/www/strapi
chown -R $USER:$USER /var/www/strapi

# 建立 Swap（如果記憶體小於 2GB）
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
if [ $TOTAL_MEM -lt 2048 ]; then
    echo "💾 建立 2GB Swap..."
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
fi

echo "✅ 伺服器初始化完成！"
INIT_SCRIPT

# 上傳並執行初始化腳本
echo -e "${BLUE}🚀 執行伺服器初始化...${NC}"
scp /tmp/strapi-server-init.sh $SSH_USER@$LINODE_IP:/tmp/
ssh $SSH_USER@$LINODE_IP "chmod +x /tmp/strapi-server-init.sh && sudo /tmp/strapi-server-init.sh"

# 準備 Strapi 檔案
echo ""
echo -e "${BLUE}📦 準備 Strapi 檔案...${NC}"

# 建立臨時打包目錄
TEMP_DIR=$(mktemp -d)
echo "📁 臨時目錄：$TEMP_DIR"

# 複製必要檔案（排除 node_modules）
rsync -av --exclude 'node_modules' \
          --exclude '.tmp' \
          --exclude 'build' \
          --exclude '.cache' \
          --exclude '.env' \
          --exclude '.DS_Store' \
          --exclude 'data-backup.db' \
          --exclude 'uploads.tar.gz' \
          ./ $TEMP_DIR/

# 上傳到伺服器
echo -e "${BLUE}📤 上傳檔案到伺服器...${NC}"
rsync -avz --progress $TEMP_DIR/ $SSH_USER@$LINODE_IP:/var/www/strapi/

# 清理臨時目錄
rm -rf $TEMP_DIR

# 在伺服器上設置 Strapi
echo ""
echo -e "${BLUE}⚙️  設置 Strapi...${NC}"
ssh $SSH_USER@$LINODE_IP << 'REMOTE_SETUP'
cd /var/www/strapi

# 安裝依賴
echo "📦 安裝 npm 套件..."
npm install --production

# 生成環境變數
echo "🔑 生成環境變數..."
cat > .env << ENV_FILE
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
ENV_FILE

# 建置 Strapi
echo "🔨 建置 Strapi..."
npm run build

# 使用 PM2 啟動
echo "🚀 啟動 Strapi..."
pm2 delete strapi 2>/dev/null || true
pm2 start npm --name "strapi" -- start
pm2 startup
pm2 save

echo "✅ Strapi 設置完成！"
REMOTE_SETUP

# 檢查服務狀態
echo ""
echo -e "${BLUE}🔍 檢查服務狀態...${NC}"
sleep 5
ssh $SSH_USER@$LINODE_IP "pm2 status"

# 完成
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ 部署完成！${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📍 訪問位址：${NC}"
echo -e "   管理面板: ${YELLOW}http://$LINODE_IP:1337/admin${NC}"
echo -e "   API 端點: ${YELLOW}http://$LINODE_IP:1337/api${NC}"
echo ""
echo -e "${GREEN}🎯 下一步：${NC}"
echo "   1. 訪問管理面板建立管理員帳號"
echo "   2. 按照指南建立 Content Types"
echo "   3. 設置 API 權限（Settings → Roles → Public）"
echo "   4. 建立 API Token 用於資料匯入"
echo ""
echo -e "${BLUE}📚 詳細指南：${NC}"
echo "   cms/docs/deployment-checklist.md"
echo ""
echo -e "${BLUE}🔧 常用命令（SSH 到伺服器後）：${NC}"
echo -e "   ${YELLOW}pm2 status${NC}          - 查看狀態"
echo -e "   ${YELLOW}pm2 logs strapi${NC}     - 查看日誌"
echo -e "   ${YELLOW}pm2 restart strapi${NC}  - 重新啟動"
echo ""

