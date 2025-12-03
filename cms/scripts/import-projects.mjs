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

// 根據 URL 協定返回 fetch options
function getFetchOptions(options = {}) {
  const isHttps = STRAPI_URL.startsWith('https://');
  if (isHttps) {
    return { ...options, agent: httpsAgent };
  }
  return options;
}

// 路徑配置
const PORTFOLIO_PATH = path.join(__dirname, '../../portfolio');
const LOCALES_PATH = path.join(PORTFOLIO_PATH, 'src/i18n/locales');
const IMAGES_PATH = path.join(PORTFOLIO_PATH, 'assets/imgs');

// 快取已存在的專案和圖片
let existingProjects = new Map(); // key: slug, value: { id, documentId, ...projectData }
let existingImages = new Map();   // key: filename, value: { id, url }

// 讀取多語言專案資料
function loadProjectsData() {
  const enProjects = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, 'en/projects.json'), 'utf8'));
  const jaProjects = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, 'ja/projects.json'), 'utf8'));
  const zhProjects = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, 'zh-Hant/projects.json'), 'utf8'));

  return { en: enProjects, ja: jaProjects, 'zh-Hant': zhProjects };
}

// 取得 Strapi 中所有已存在的專案
async function fetchExistingProjects() {
  console.log('🔍 檢查 Strapi 中已存在的專案...');
  
  try {
    // 使用分頁取得所有專案
    let page = 1;
    const pageSize = 100;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetch(
        `${STRAPI_URL}/api/projects?pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
        getFetchOptions({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`
          }
        })
      );

      if (!response.ok) {
        throw new Error(`取得專案列表失敗 (${response.status})`);
      }

      const result = await response.json();
      const projects = result.data || [];
      
      // 將專案以 slug 為 key 存入 Map
      projects.forEach(project => {
        const slug = project.slug;
        if (slug) {
          existingProjects.set(slug, {
            id: project.id,
            documentId: project.documentId,
            ...project
          });
        }
      });
      
      // 檢查是否還有更多資料
      const pagination = result.meta?.pagination;
      hasMore = pagination && page < pagination.pageCount;
      page++;
    }
    
    console.log(`   找到 ${existingProjects.size} 個已存在的專案\n`);
  } catch (error) {
    console.error('❌ 取得已存在專案失敗:', error.message);
    // 如果失敗，繼續執行（會建立新專案）
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
        getFetchOptions({
          method: 'GET',
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`
          }
        })
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

// 轉換資料格式為 Strapi 格式（多語言 JSON）
function transformProjectData(projectId, projectsData) {
  const enData = projectsData.en[projectId];
  const jaData = projectsData.ja[projectId];
  const zhData = projectsData['zh-Hant'][projectId];

  if (!enData) {
    console.log(`⚠️  專案 ${projectId} 在英文版本中不存在，跳過`);
    return null;
  }

  // 生成 slug
  const slug = enData.heading
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

  return {
    localId: projectId, // 保留本地 ID 用於追蹤
    title: {
      en: enData.heading,
      ja: jaData?.heading || enData.heading,
      'zh-Hant': zhData?.heading || enData.heading
    },
    slug: slug,
    description: {
      en: enData.projectInfo?.description || '',
      ja: jaData?.projectInfo?.description || '',
      'zh-Hant': zhData?.projectInfo?.description || ''
    },
    date: enData.date,
    tags: enData.tags || [],
    categories: [enData.category],
    brand: enData.brand,
    primaryColor: enData.primaryColor,
    secondaryColor: enData.secondaryColor,
    meta: {
      en: enData.projectInfo?.meta || [],
      ja: jaData?.projectInfo?.meta || [],
      'zh-Hant': zhData?.projectInfo?.meta || []
    },
    content: {
      en: {
        project: enData.projectInfo?.project || '',
        websiteUrl: enData.projectInfo?.websiteUrl || '',
        websiteLabel: enData.projectInfo?.websiteLabel || '',
        mainImage: enData.projectInfo?.mainImage || '',
        specialHeadingImage: enData.projectInfo?.specialHeadingImage || '',
        roles: enData.projectInfo?.roles || [],
        sections: enData.projectInfo?.sections || {}
      },
      ja: {
        project: jaData?.projectInfo?.project || '',
        websiteUrl: jaData?.projectInfo?.websiteUrl || '',
        websiteLabel: jaData?.projectInfo?.websiteLabel || '',
        mainImage: jaData?.projectInfo?.mainImage || '',
        specialHeadingImage: jaData?.projectInfo?.specialHeadingImage || '',
        roles: jaData?.projectInfo?.roles || [],
        sections: jaData?.projectInfo?.sections || {}
      },
      'zh-Hant': {
        project: zhData?.projectInfo?.project || '',
        websiteUrl: zhData?.projectInfo?.websiteUrl || '',
        websiteLabel: zhData?.projectInfo?.websiteLabel || '',
        mainImage: zhData?.projectInfo?.mainImage || '',
        specialHeadingImage: zhData?.projectInfo?.specialHeadingImage || '',
        roles: zhData?.projectInfo?.roles || [],
        sections: zhData?.projectInfo?.sections || {}
      }
    },
    // 收集所有圖片路徑
    _imageFiles: collectImagePaths(enData)
  };
}

// 收集專案中所有的圖片路徑
function collectImagePaths(projectData) {
  const images = [];
  
  // Hero image
  if (projectData.heroImage) {
    images.push(projectData.heroImage);
  }
  
  // Main image and special heading image
  if (projectData.projectInfo?.mainImage) {
    images.push(projectData.projectInfo.mainImage);
  }
  if (projectData.projectInfo?.specialHeadingImage) {
    images.push(projectData.projectInfo.specialHeadingImage);
  }
  
  // Section images
  const sections = projectData.projectInfo?.sections || {};
  Object.values(sections).forEach(section => {
    if (section.image1) images.push(section.image1);
    if (section.image2) images.push(section.image2);
  });
  
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
    const response = await fetch(`${STRAPI_URL}/api/upload`, getFetchOptions({
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRAPI_API_TOKEN}`
      },
      body: formData
    }));

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

// 建立或更新專案到 Strapi
async function upsertProject(projectData, uploadedImages) {
  // 取得 coverImage ID (heroImage)
  const coverImageId = uploadedImages[projectData._imageFiles[0]];
  
  // 取得所有其他圖片 IDs
  const imageIds = projectData._imageFiles
    .slice(1) // 跳過第一張 (coverImage)
    .map(imgPath => uploadedImages[imgPath])
    .filter(id => id != null);

  const strapiData = {
    title: projectData.title,
    slug: projectData.slug,
    description: projectData.description,
    coverImage: coverImageId,
    date: projectData.date,
    tags: projectData.tags,
    categories: projectData.categories,
    brand: projectData.brand,
    primaryColor: projectData.primaryColor,
    secondaryColor: projectData.secondaryColor,
    meta: projectData.meta,
    content: projectData.content,
    images: imageIds,
    publishedAt: new Date().toISOString()
  };

  // 檢查專案是否已存在
  const existingProject = existingProjects.get(projectData.slug);

  try {
    let response;
    let action;

    if (existingProject) {
      // 更新已存在的專案 (使用 documentId)
      action = '更新';
      const documentId = existingProject.documentId;
      
      response = await fetch(`${STRAPI_URL}/api/projects/${documentId}`, getFetchOptions({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STRAPI_API_TOKEN}`
        },
        body: JSON.stringify({ data: strapiData })
      }));
    } else {
      // 建立新專案
      action = '建立';
      response = await fetch(`${STRAPI_URL}/api/projects`, getFetchOptions({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STRAPI_API_TOKEN}`
        },
        body: JSON.stringify({ data: strapiData })
      }));
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`${action}專案失敗 (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const resultId = data.data?.id || data.data?.documentId;
    
    if (existingProject) {
      console.log(`🔄 更新專案: ${projectData.title.en} (ID: ${resultId})`);
      return { action: 'updated', data: data.data };
    } else {
      console.log(`✅ 建立專案: ${projectData.title.en} (ID: ${resultId})`);
      return { action: 'created', data: data.data };
    }
  } catch (error) {
    console.error(`❌ ${existingProject ? '更新' : '建立'}專案失敗 ${projectData.title.en}:`, error.message);
    return null;
  }
}

// 主要匯入流程
async function importProjects() {
  console.log('🚀 開始同步專案資料...\n');
  console.log(`📡 Strapi URL: ${STRAPI_URL}\n`);

  // 檢查 API Token
  if (!STRAPI_API_TOKEN) {
    console.error('❌ 錯誤: 請設定 STRAPI_API_TOKEN 環境變數');
    console.log('\n使用方式:');
    console.log('STRAPI_API_TOKEN=your-token npm run import-projects');
    console.log('\n或建立 .env 檔案並設定:');
    console.log('STRAPI_API_TOKEN=your-token');
    console.log('STRAPI_URL=http://172.104.73.171:1337');
    process.exit(1);
  }

  // 1. 取得 Strapi 中已存在的專案和圖片
  await fetchExistingProjects();
  await fetchExistingImages();

  // 2. 讀取多語言專案資料
  console.log('📖 讀取本地多語言專案資料...');
  const projectsData = loadProjectsData();
  const projectIds = Object.keys(projectsData.en);
  console.log(`   找到 ${projectIds.length} 個專案\n`);

  // 3. 轉換資料格式
  console.log('🔄 轉換資料格式...');
  const transformedProjects = projectIds
    .map(id => transformProjectData(id, projectsData))
    .filter(p => p !== null);
  console.log(`   成功轉換 ${transformedProjects.length} 個專案\n`);

  // 4. 收集所有需要上傳的圖片
  console.log('📸 收集圖片列表...');
  const allImages = new Set();
  transformedProjects.forEach(project => {
    project._imageFiles.forEach(img => allImages.add(img));
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

  // 6. 建立或更新專案
  console.log('📝 同步專案到 Strapi...');
  let createdCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  
  for (const project of transformedProjects) {
    const result = await upsertProject(project, uploadedImages);
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
  console.log(`📊 專案統計:`);
  console.log(`   ✅ 新建立: ${createdCount} 個`);
  console.log(`   🔄 已更新: ${updatedCount} 個`);
  if (failedCount > 0) {
    console.log(`   ❌ 失敗: ${failedCount} 個`);
  }
  console.log(`📸 圖片統計:`);
  console.log(`   ✅ 新上傳: ${newUploadCount} 張`);
  console.log(`   ⏭️  跳過: ${skippedCount} 張`);
  console.log('='.repeat(50));
}

// 執行匯入
importProjects().catch(error => {
  console.error('❌ 同步過程發生錯誤:', error);
  process.exit(1);
});
