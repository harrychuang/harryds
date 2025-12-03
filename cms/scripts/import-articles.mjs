import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fetch from 'node-fetch';
import FormData from 'form-data';

// ES Module 中取得 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Strapi API 配置
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// 建立 HTTPS agent 忽略自簽憑證錯誤
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // 允許自簽憑證
});

// 路徑配置
const PORTFOLIO_PATH = path.join(__dirname, '../../portfolio');
const LOCALES_PATH = path.join(PORTFOLIO_PATH, 'src/i18n/locales');
const IMAGES_PATH = path.join(PORTFOLIO_PATH, 'assets/imgs');

// 快取已存在的文章和圖片
let existingArticles = new Map(); // key: slug, value: { id, documentId, ...articleData }
let existingImages = new Map();   // key: filename, value: { id, url }

// 讀取多語言文章資料
function loadArticlesData() {
  const enArticles = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, 'en/articles.json'), 'utf8'));
  const jaArticles = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, 'ja/articles.json'), 'utf8'));
  const zhArticles = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, 'zh-Hant/articles.json'), 'utf8'));

  return { en: enArticles, ja: jaArticles, 'zh-Hant': zhArticles };
}

// 取得 Strapi 中所有已存在的文章
async function fetchExistingArticles() {
  console.log('🔍 檢查 Strapi 中已存在的文章...');
  
  try {
    // 使用分頁取得所有文章
    let page = 1;
    const pageSize = 100;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetch(
        `${STRAPI_URL}/api/articles?pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`
          },
          agent: httpsAgent
        }
      );

      if (!response.ok) {
        throw new Error(`取得文章列表失敗 (${response.status})`);
      }

      const result = await response.json();
      const articles = result.data || [];
      
      // 將文章以 slug 為 key 存入 Map
      articles.forEach(article => {
        const slug = article.slug;
        if (slug) {
          existingArticles.set(slug, {
            id: article.id,
            documentId: article.documentId,
            ...article
          });
        }
      });
      
      // 檢查是否還有更多資料
      const pagination = result.meta?.pagination;
      hasMore = pagination && page < pagination.pageCount;
      page++;
    }
    
    console.log(`   找到 ${existingArticles.size} 篇已存在的文章\n`);
  } catch (error) {
    console.error('❌ 取得已存在文章失敗:', error.message);
    // 如果失敗，繼續執行（會建立新文章）
  }
}

// 取得 Strapi 中已上傳的圖片
async function fetchExistingImages() {
  console.log('🔍 檢查 Strapi 中已存在的圖片...');
  
  try {
    let page = 1;
    const pageSize = 100;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetch(
        `${STRAPI_URL}/api/upload/files?pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`
          },
          agent: httpsAgent
        }
      );

      if (!response.ok) {
        // 如果 API 不支援，嘗試舊版 API
        break;
      }

      const files = await response.json();
      
      if (!Array.isArray(files) || files.length === 0) {
        hasMore = false;
        break;
      }
      
      files.forEach(file => {
        // 使用原始檔名作為 key
        const filename = file.name;
        existingImages.set(filename, {
          id: file.id,
          url: file.url
        });
      });
      
      hasMore = files.length === pageSize;
      page++;
    }
    
    console.log(`   找到 ${existingImages.size} 張已存在的圖片\n`);
  } catch (error) {
    console.warn('⚠️  無法取得已存在圖片列表，將重新上傳所有圖片');
  }
}

// 生成 slug
function generateSlug(heading) {
  return heading
    .toLowerCase()
    .replace(/\n/g, '-')       // 換行轉為連字號
    .replace(/\s+/g, '-')      // 空格轉為連字號
    .replace(/[^\w\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff-]+/g, '') // 保留字母、數字、中日文、連字號
    .replace(/--+/g, '-')      // 多個連字號合併為一個
    .replace(/^-|-$/g, '');    // 移除開頭和結尾的連字號
}

// 轉換資料格式為 Strapi 格式（多語言 JSON）
function transformArticleData(articleId, articlesData) {
  const enData = articlesData.en[articleId];
  const jaData = articlesData.ja[articleId];
  const zhData = articlesData['zh-Hant'][articleId];

  if (!enData && !zhData) {
    console.log(`⚠️  文章 ${articleId} 在英文和中文版本中都不存在，跳過`);
    return null;
  }

  // 使用英文或中文標題生成 slug
  const baseHeading = enData?.heading || zhData?.heading;
  const slug = generateSlug(baseHeading);

  return {
    localId: articleId, // 保留本地 ID 用於追蹤
    title: {
      en: enData?.heading || zhData?.heading || '',
      ja: jaData?.heading || enData?.heading || zhData?.heading || '',
      'zh-Hant': zhData?.heading || enData?.heading || ''
    },
    slug: slug,
    subtitle: {
      en: enData?.subtitle || '',
      ja: jaData?.subtitle || '',
      'zh-Hant': zhData?.subtitle || ''
    },
    date: enData?.date || zhData?.date || jaData?.date || '',
    tags: enData?.tags || zhData?.tags || [],
    category: enData?.category || zhData?.category || 'article',
    url: enData?.url || zhData?.url || '',
    content: {
      en: enData?.content || {},
      ja: jaData?.content || {},
      'zh-Hant': zhData?.content || {}
    },
    // 收集所有圖片路徑
    _imageFiles: collectImagePaths(enData || zhData)
  };
}

// 收集文章中所有的圖片路徑
function collectImagePaths(articleData) {
  const images = [];
  
  if (articleData?.images && Array.isArray(articleData.images)) {
    articleData.images.forEach(img => {
      if (img) {
        images.push(img);
      }
    });
  }
  
  return [...new Set(images)]; // 去重
}

// 上傳圖片到 Strapi（含重複檢查）
async function uploadImage(imagePath) {
  const fullPath = path.join(IMAGES_PATH, imagePath);
  const filename = path.basename(imagePath);
  
  // 檢查圖片是否已存在
  if (existingImages.has(filename)) {
    const existing = existingImages.get(filename);
    console.log(`⏭️  圖片已存在，跳過: ${filename} (ID: ${existing.id})`);
    return existing.id;
  }
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  圖片不存在: ${imagePath}`);
    return null;
  }

  const formData = new FormData();
  formData.append('files', fs.createReadStream(fullPath));

  try {
    const response = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`
      },
      body: formData,
      agent: httpsAgent
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上傳失敗 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const imageId = data[0].id;
    
    // 加入快取
    existingImages.set(filename, { id: imageId, url: data[0].url });
    
    console.log(`✅ 上傳圖片: ${imagePath} (ID: ${imageId})`);
    return imageId;
  } catch (error) {
    console.error(`❌ 上傳圖片失敗 ${imagePath}:`, error.message);
    return null;
  }
}

// 建立或更新文章到 Strapi
async function upsertArticle(articleData, uploadedImages) {
  // 取得所有圖片 IDs
  const imageIds = articleData._imageFiles
    .map(imgPath => uploadedImages[imgPath])
    .filter(id => id != null);

  // 取得封面圖片（第一張）
  const coverImageId = imageIds.length > 0 ? imageIds[0] : null;

  const strapiData = {
    title: articleData.title,
    slug: articleData.slug,
    subtitle: articleData.subtitle,
    date: articleData.date,
    tags: articleData.tags,
    category: articleData.category,
    url: articleData.url,
    content: articleData.content,
    coverImage: coverImageId,
    images: imageIds,
    publishedAt: new Date().toISOString()
  };

  // 檢查文章是否已存在
  const existingArticle = existingArticles.get(articleData.slug);

  try {
    let response;
    let action;

    if (existingArticle) {
      // 更新已存在的文章 (使用 documentId)
      action = '更新';
      const documentId = existingArticle.documentId;
      
      response = await fetch(`${STRAPI_URL}/api/articles/${documentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STRAPI_API_TOKEN}`
        },
        body: JSON.stringify({ data: strapiData }),
        agent: httpsAgent
      });
    } else {
      // 建立新文章
      action = '建立';
      response = await fetch(`${STRAPI_URL}/api/articles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STRAPI_API_TOKEN}`
        },
        body: JSON.stringify({ data: strapiData }),
        agent: httpsAgent
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`${action}文章失敗 (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const resultId = data.data?.id || data.data?.documentId;
    
    // 取得標題顯示（優先使用中文）
    const displayTitle = articleData.title['zh-Hant'] || articleData.title.en || articleData.slug;
    
    if (existingArticle) {
      console.log(`🔄 更新文章: ${displayTitle} (ID: ${resultId})`);
      return { action: 'updated', data: data.data };
    } else {
      console.log(`✅ 建立文章: ${displayTitle} (ID: ${resultId})`);
      return { action: 'created', data: data.data };
    }
  } catch (error) {
    const displayTitle = articleData.title['zh-Hant'] || articleData.title.en || articleData.slug;
    console.error(`❌ ${existingArticle ? '更新' : '建立'}文章失敗 ${displayTitle}:`, error.message);
    return null;
  }
}

// 主要匯入流程
async function importArticles() {
  console.log('🚀 開始同步文章資料...\n');
  console.log(`📡 Strapi URL: ${STRAPI_URL}\n`);

  // 檢查 API Token
  if (!STRAPI_API_TOKEN) {
    console.error('❌ 錯誤: 請設定 STRAPI_API_TOKEN 環境變數');
    console.log('\n使用方式:');
    console.log('STRAPI_API_TOKEN=your-token npm run import-articles');
    console.log('\n或建立 .env 檔案並設定:');
    console.log('STRAPI_API_TOKEN=your-token');
    console.log('STRAPI_URL=http://172.104.73.171:1337');
    process.exit(1);
  }

  // 1. 取得 Strapi 中已存在的文章和圖片
  await fetchExistingArticles();
  await fetchExistingImages();

  // 2. 讀取多語言文章資料
  console.log('📖 讀取本地多語言文章資料...');
  const articlesData = loadArticlesData();
  
  // 使用所有語言版本的 ID 聯集
  const allIds = new Set([
    ...Object.keys(articlesData.en),
    ...Object.keys(articlesData.ja),
    ...Object.keys(articlesData['zh-Hant'])
  ]);
  const articleIds = Array.from(allIds).sort((a, b) => Number(a) - Number(b));
  console.log(`   找到 ${articleIds.length} 篇文章\n`);

  // 3. 轉換資料格式
  console.log('🔄 轉換資料格式...');
  const transformedArticles = articleIds
    .map(id => transformArticleData(id, articlesData))
    .filter(a => a !== null);
  console.log(`   成功轉換 ${transformedArticles.length} 篇文章\n`);

  // 4. 收集所有需要上傳的圖片
  console.log('📸 收集圖片列表...');
  const allImages = new Set();
  transformedArticles.forEach(article => {
    article._imageFiles.forEach(img => allImages.add(img));
  });
  console.log(`   找到 ${allImages.size} 張圖片\n`);

  // 5. 上傳圖片（跳過已存在的）
  console.log('⬆️  處理圖片...');
  const uploadedImages = {};
  let newUploadCount = 0;
  let skippedCount = 0;
  
  for (const imagePath of allImages) {
    const filename = path.basename(imagePath);
    const wasExisting = existingImages.has(filename);
    
    const imageId = await uploadImage(imagePath);
    if (imageId) {
      uploadedImages[imagePath] = imageId;
      if (!wasExisting) {
        newUploadCount++;
      } else {
        skippedCount++;
      }
    }
    // 避免過快請求
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(`\n📊 圖片處理完成: 新上傳 ${newUploadCount} 張, 跳過 ${skippedCount} 張\n`);

  // 6. 建立或更新文章
  console.log('📝 同步文章到 Strapi...');
  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  
  for (const article of transformedArticles) {
    const result = await upsertArticle(article, uploadedImages);
    if (result) {
      if (result.action === 'created') {
        createdCount++;
      } else if (result.action === 'updated') {
        updatedCount++;
      }
    } else {
      failedCount++;
    }
    // 避免過快請求
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 7. 完成
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 同步完成！`);
  console.log('='.repeat(50));
  console.log(`📊 文章統計:`);
  console.log(`   ✅ 新建立: ${createdCount} 篇`);
  console.log(`   🔄 已更新: ${updatedCount} 篇`);
  if (failedCount > 0) {
    console.log(`   ❌ 失敗: ${failedCount} 篇`);
  }
  console.log(`📸 圖片統計:`);
  console.log(`   ✅ 新上傳: ${newUploadCount} 張`);
  console.log(`   ⏭️  跳過: ${skippedCount} 張`);
  console.log('='.repeat(50));
}

// 執行匯入
importArticles().catch(error => {
  console.error('❌ 同步過程發生錯誤:', error);
  process.exit(1);
});

