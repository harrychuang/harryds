/**
 * 將 shared/data/feed.json 的資料匯入到 Strapi
 * 
 * 使用方式：
 * 1. 確保 Strapi 已啟動並運行在 http://localhost:1337
 * 2. 確保已在 Strapi 管理面板中建立管理員帳號
 * 3. 執行 node scripts/import-feed-data.js
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// 設定
const STRAPI_URL = 'http://localhost:1337';
const FEED_DATA_PATH = path.join(__dirname, '../../shared/data/feed.json');
const PORTFOLIO_ASSETS_PATH = path.join(__dirname, '../../portfolio/assets');

// 全域變數儲存上傳的圖片映射
const uploadedImages = new Map(); // key: 相對路徑, value: Strapi 圖片 ID

/**
 * 步驟 1: 提示使用者取得 API Token
 */
function promptForApiToken() {
  console.log('\n=== 步驟 1: 取得 API Token ===\n');
  console.log('請按照以下步驟取得 API Token：\n');
  console.log('1. 打開 Strapi 管理面板: http://localhost:1337/admin');
  console.log('2. 登入您的管理員帳號');
  console.log('3. 進入 Settings → API Tokens → Create new API Token');
  console.log('4. 設定：');
  console.log('   - Name: Import Script');
  console.log('   - Token duration: Unlimited (或設定適當的期限)');
  console.log('   - Token type: Full access');
  console.log('5. 點擊 Save 並複製產生的 token');
  console.log('6. 將 token 儲存到 .env 檔案中：');
  console.log('   STRAPI_API_TOKEN=your_token_here\n');
  console.log('7. 重新執行此腳本\n');
}

/**
 * 從環境變數讀取 API Token
 */
function getApiToken() {
  // 嘗試讀取 .env 檔案
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/STRAPI_API_TOKEN=(.+)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // 也嘗試從 process.env 讀取
  if (process.env.STRAPI_API_TOKEN) {
    return process.env.STRAPI_API_TOKEN;
  }
  
  return null;
}

/**
 * 上傳圖片到 Strapi
 */
async function uploadImage(imagePath) {
  const apiToken = getApiToken();
  if (!apiToken) {
    throw new Error('API Token 未設定');
  }

  // 檢查是否已上傳過
  if (uploadedImages.has(imagePath)) {
    console.log(`  ⏭️  圖片已存在，跳過: ${imagePath}`);
    return uploadedImages.get(imagePath);
  }

  const fullPath = path.join(PORTFOLIO_ASSETS_PATH, imagePath);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠️  圖片不存在: ${fullPath}`);
    return null;
  }

  try {
    const form = new FormData();
    form.append('files', fs.createReadStream(fullPath), path.basename(imagePath));

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ 上傳失敗: ${imagePath}`, error);
      return null;
    }

    const data = await response.json();
    const imageId = data[0]?.id;
    
    if (imageId) {
      uploadedImages.set(imagePath, imageId);
      console.log(`  ✅ 上傳成功: ${imagePath} (ID: ${imageId})`);
    }
    
    return imageId;
  } catch (error) {
    console.error(`  ❌ 上傳錯誤: ${imagePath}`, error.message);
    return null;
  }
}

/**
 * 轉換 Project Section Content
 */
async function transformProjectSectionContent(content) {
  const componentMap = {
    'paragraph': 'project.paragraph',
    'quote': 'project.quote',
    'blockquote': 'project.blockquote',
    'image': 'project.image',
  };

  const transformed = {
    __component: componentMap[content.type],
  };

  switch (content.type) {
    case 'paragraph':
    case 'quote':
    case 'blockquote':
      transformed.text = content.text;
      if (content.enableTypewriter !== undefined) {
        transformed.enableTypewriter = content.enableTypewriter;
      }
      break;
    case 'image':
      if (content.src) {
        const imageId = await uploadImage(content.src);
        if (imageId) {
          transformed.image = imageId;
        }
      }
      if (content.alt) {
        transformed.alt = content.alt;
      }
      break;
  }

  return transformed;
}

/**
 * 轉換 Project Sections
 */
async function transformProjectSections(sections) {
  if (!sections || !Array.isArray(sections)) {
    return [];
  }

  const transformedSections = [];

  for (const section of sections) {
    const transformedContent = [];
    
    if (section.content && Array.isArray(section.content)) {
      for (const content of section.content) {
        const transformed = await transformProjectSectionContent(content);
        transformedContent.push(transformed);
      }
    }

    transformedSections.push({
      __component: 'project.section',
      title: section.title,
      content: transformedContent,
    });
  }

  return transformedSections;
}

/**
 * 轉換 Project Info
 */
async function transformProjectInfo(projectInfo) {
  if (!projectInfo) {
    return null;
  }

  const transformed = {
    __component: 'project.info',
  };

  // 基本欄位
  if (projectInfo.client) transformed.client = projectInfo.client;
  if (projectInfo.project) transformed.project = projectInfo.project;
  if (projectInfo.roles) transformed.roles = projectInfo.roles;
  if (projectInfo.description) transformed.description = projectInfo.description;
  if (projectInfo.websiteUrl) transformed.websiteUrl = projectInfo.websiteUrl;
  if (projectInfo.websiteLabel) transformed.websiteLabel = projectInfo.websiteLabel;

  // 上傳圖片
  if (projectInfo.mainImage) {
    const imageId = await uploadImage(projectInfo.mainImage);
    if (imageId) transformed.mainImage = imageId;
  }

  if (projectInfo.specialHeadingImage) {
    const imageId = await uploadImage(projectInfo.specialHeadingImage);
    if (imageId) transformed.specialHeadingImage = imageId;
  }

  // 轉換 sections
  if (projectInfo.sections) {
    transformed.sections = await transformProjectSections(projectInfo.sections);
  }

  return transformed;
}

/**
 * 將 Feed Item 轉換為 Strapi 格式並建立
 */
async function createFeedItem(item) {
  const apiToken = getApiToken();
  if (!apiToken) {
    throw new Error('API Token 未設定');
  }

  console.log(`\n📝 處理項目: ${item.heading} (ID: ${item.id})`);

  // 基本資料
  const data = {
    heading: item.heading,
    date: item.date,
    tags: item.tags || [],
    category: item.category,
  };

  // 可選欄位
  if (item.brand) data.brand = item.brand;
  if (item.primaryColor) data.primaryColor = item.primaryColor;
  if (item.secondaryColor) data.secondaryColor = item.secondaryColor;

  // 上傳 heroImage
  if (item.heroImage) {
    console.log('  📸 上傳主圖片...');
    const heroImageId = await uploadImage(item.heroImage);
    if (heroImageId) {
      data.heroImage = heroImageId;
    }
  }

  // 轉換 Project Info
  if (item.projectInfo) {
    console.log('  🔧 處理專案資訊...');
    data.projectInfo = await transformProjectInfo(item.projectInfo);
  }

  // 建立 Feed Item
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${STRAPI_URL}/api/feed-items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`  ❌ 建立失敗:`, error);
      return false;
    }

    const result = await response.json();
    console.log(`  ✅ 建立成功! (Strapi ID: ${result.data.id})`);
    return true;
  } catch (error) {
    console.error(`  ❌ 建立錯誤:`, error.message);
    return false;
  }
}

/**
 * 主要執行函式
 */
async function main() {
  console.log('🚀 開始匯入 Feed 資料到 Strapi\n');
  console.log(`Strapi URL: ${STRAPI_URL}`);
  console.log(`資料來源: ${FEED_DATA_PATH}\n`);

  // 檢查 API Token
  const apiToken = getApiToken();
  if (!apiToken) {
    promptForApiToken();
    process.exit(1);
  }

  // 檢查資料檔案是否存在
  if (!fs.existsSync(FEED_DATA_PATH)) {
    console.error(`❌ 找不到資料檔案: ${FEED_DATA_PATH}`);
    process.exit(1);
  }

  // 讀取 Feed 資料
  let feedData;
  try {
    const content = fs.readFileSync(FEED_DATA_PATH, 'utf-8');
    feedData = JSON.parse(content);
  } catch (error) {
    console.error('❌ 讀取資料檔案失敗:', error.message);
    process.exit(1);
  }

  if (!feedData.items || !Array.isArray(feedData.items)) {
    console.error('❌ 資料格式錯誤: 缺少 items 陣列');
    process.exit(1);
  }

  console.log(`📊 找到 ${feedData.items.length} 個項目\n`);
  console.log('=' .repeat(60));

  // 匯入每個項目
  let successCount = 0;
  let failCount = 0;

  for (const item of feedData.items) {
    const success = await createFeedItem(item);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('=' .repeat(60));
  }

  // 顯示結果
  console.log('\n✨ 匯入完成！\n');
  console.log(`成功: ${successCount} 個`);
  console.log(`失敗: ${failCount} 個`);
  console.log(`總共: ${feedData.items.length} 個\n`);

  if (successCount > 0) {
    console.log('🎉 您可以在 Strapi 管理面板中查看匯入的資料：');
    console.log(`   ${STRAPI_URL}/admin/content-manager/collection-types/api::feed-item.feed-item\n`);
  }
}

// 執行
main().catch(error => {
  console.error('\n❌ 發生錯誤:', error);
  process.exit(1);
});

