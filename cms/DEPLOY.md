# 🚀 快速部署指南

## 方式 1：一鍵自動部署（最快）

如果你已經有 Linode 伺服器，使用這個方式最快！

### 步驟

1. **確保你在 `cms` 資料夾中**
```bash
cd "/Users/HarryChuang/Dropbox/Works/NOEIN Projects/noeinoi 2025/dev/cms"
```

2. **給予腳本執行權限**
```bash
chmod +x deploy-to-linode.sh
```

3. **執行部署**
```bash
./deploy-to-linode.sh YOUR_LINODE_IP
```

將 `YOUR_LINODE_IP` 替換為你的實際 IP 位址，例如：
```bash
./deploy-to-linode.sh 123.456.789.0
```

### 腳本會自動完成：
- ✅ 更新系統
- ✅ 安裝 Node.js 18.x
- ✅ 安裝 PM2
- ✅ 設置防火牆
- ✅ 上傳 Strapi 檔案
- ✅ 安裝依賴
- ✅ 生成環境變數
- ✅ 建置並啟動 Strapi

### 預計時間：5-10 分鐘

---

## 方式 2：手動部署

如果你想要更多控制或學習每個步驟，請參考：
- [`docs/deployment-linode.md`](./docs/deployment-linode.md) - 完整指南
- [`docs/deployment-checklist.md`](./docs/deployment-checklist.md) - 檢查清單

---

## 部署前準備

### 你需要有：
- ✅ Linode 伺服器（已建立）
- ✅ 伺服器 IP 位址
- ✅ SSH 登入權限（Root 密碼或 SSH Key）

### 建議的伺服器規格：
- **作業系統**：Ubuntu 22.04 LTS
- **最低配置**：Nanode 1GB ($5/月)
- **推薦配置**：Linode 2GB ($12/月)
- **地區**：Tokyo 2 或 Singapore（延遲較低）

---

## 部署後

### 1. 訪問 Strapi
```
http://YOUR_IP:1337/admin
```

### 2. 建立管理員帳號
首次訪問會要求建立管理員帳號

### 3. 建立 Content Types
參考：`docs/strapi-setup.md`

### 4. 設置 API 權限
Settings → Users & Permissions → Roles → Public
- 勾選 Feed-item 的 `find` 和 `findOne`

### 5. 建立 API Token
Settings → API Tokens → Create new API Token
- Name: Import Script
- Type: Full access
- 複製 Token

### 6. 更新本地 .env（用於匯入資料）
```bash
# 編輯 cms/.env
echo "STRAPI_API_TOKEN=你的_token" >> .env
```

### 7. 匯入資料
```bash
# 確保在本地 cms 資料夾
npm run import-data
```

---

## 常見問題

### Q: 腳本執行時要求密碼？
**A:** 輸入你的 Linode Root 密碼。輸入時不會顯示字元，這是正常的。

### Q: 連線失敗？
**A:** 檢查：
- IP 位址是否正確
- 伺服器是否已啟動
- 防火牆是否允許 SSH (port 22)

### Q: 想要使用域名？
**A:** 參考 `docs/deployment-linode.md` 的 Nginx 和 SSL 設置章節

### Q: 如何更新代碼？
**A:** 重新執行部署腳本：
```bash
./deploy-to-linode.sh YOUR_IP
```

### Q: 如何查看日誌？
**A:** SSH 到伺服器後：
```bash
pm2 logs strapi
```

### Q: 如何重新啟動？
**A:** SSH 到伺服器後：
```bash
pm2 restart strapi
```

---

## 手動命令參考

如果自動腳本失敗，你也可以手動執行：

### SSH 連接
```bash
ssh root@YOUR_IP
```

### 安裝 Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

### 上傳檔案
```bash
# 在本地執行
rsync -avz --exclude 'node_modules' \
            --exclude '.tmp' \
            cms/ root@YOUR_IP:/var/www/strapi/
```

### 在伺服器上設置
```bash
cd /var/www/strapi
npm install --production
npm run build

# 安裝 PM2
npm install -g pm2
pm2 start npm --name "strapi" -- start
pm2 startup
pm2 save
```

---

## 安全建議

部署完成後，建議：

1. **建立非 root 使用者**
```bash
adduser strapi
usermod -aG sudo strapi
```

2. **設置 SSH Key 登入**
```bash
ssh-keygen -t ed25519
ssh-copy-id strapi@YOUR_IP
```

3. **設置自動備份**
參考：`docs/deployment-linode.md` 的備份章節

---

## 需要幫助？

- 📖 完整指南：[`docs/deployment-linode.md`](./docs/deployment-linode.md)
- ✅ 檢查清單：[`docs/deployment-checklist.md`](./docs/deployment-checklist.md)
- 🐛 故障排除：查看部署指南的「故障排除」章節

---

## 祝你部署順利！🎉

