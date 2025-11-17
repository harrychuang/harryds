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

// 讀取多語言專案資料
function loadProjectsData() {
  const enProjects = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, 'en/projects.json'), 'utf8'));
  const jaProjects = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, 'ja/projects.json'), 'utf8'));
  const zhProjects = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, 'zh-Hant/projects.json'), 'utf8'));

  return { en: enProjects, ja: jaProjects, 'zh-Hant': zhProjects };
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

// 上傳圖片到 Strapi
async function uploadImage(imagePath) {
  const fullPath = path.join(IMAGES_PATH, imagePath);
  
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
      agent: httpsAgent // 使用自定義 HTTPS agent
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上傳失敗 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ 上傳圖片: ${imagePath} (ID: ${data[0].id})`);
    return data[0].id;
  } catch (error) {
    console.error(`❌ 上傳圖片失敗 ${imagePath}:`, error.message);
    return null;
  }
}

// 建立專案到 Strapi
async function createProject(projectData, uploadedImages) {
  // 取得 coverImage ID (heroImage)
  const coverImageId = uploadedImages[projectData._imageFiles[0]];
  
  // 取得所有其他圖片 IDs
  const imageIds = projectData._imageFiles
    .slice(1) // 跳過第一張 (coverImage)
    .map(imgPath => uploadedImages[imgPath])
    .filter(id => id != null);

  const strapiData = {
    data: {
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
      publishedAt: new Date().toISOString() // 自動發布
    }
  };

  try {
    const response = await fetch(`${STRAPI_URL}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`
      },
      body: JSON.stringify(strapiData),
      agent: httpsAgent // 使用自定義 HTTPS agent
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`建立專案失敗 (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(`✅ 建立專案: ${projectData.title.en} (ID: ${data.data.id})`);
    return data.data;
  } catch (error) {
    console.error(`❌ 建立專案失敗 ${projectData.title.en}:`, error.message);
    return null;
  }
}

// 主要匯入流程
async function importProjects() {
  console.log('🚀 開始匯入專案資料...\n');

  // 檢查 API Token
  if (!STRAPI_API_TOKEN) {
    console.error('❌ 錯誤: 請設定 STRAPI_API_TOKEN 環境變數');
    console.log('\n使用方式:');
    console.log('STRAPI_API_TOKEN=your-token npm run import-projects');
    console.log('\n或建立 .env 檔案並設定:');
    console.log('STRAPI_API_TOKEN=your-token');
    console.log('STRAPI_URL=https://172.104.73.171');
    process.exit(1);
  }

  // 1. 讀取多語言專案資料
  console.log('📖 讀取多語言專案資料...');
  const projectsData = loadProjectsData();
  const projectIds = Object.keys(projectsData.en);
  console.log(`找到 ${projectIds.length} 個專案\n`);

  // 2. 轉換資料格式
  console.log('🔄 轉換資料格式...');
  const transformedProjects = projectIds
    .map(id => transformProjectData(id, projectsData))
    .filter(p => p !== null);
  console.log(`成功轉換 ${transformedProjects.length} 個專案\n`);

  // 3. 收集所有需要上傳的圖片
  console.log('📸 收集圖片列表...');
  const allImages = new Set();
  transformedProjects.forEach(project => {
    project._imageFiles.forEach(img => allImages.add(img));
  });
  console.log(`找到 ${allImages.size} 張圖片需要上傳\n`);

  // 4. 上傳所有圖片
  console.log('⬆️  上傳圖片到 Strapi...');
  const uploadedImages = {};
  let uploadCount = 0;
  
  for (const imagePath of allImages) {
    const imageId = await uploadImage(imagePath);
    if (imageId) {
      uploadedImages[imagePath] = imageId;
      uploadCount++;
    }
    // 避免過快請求
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(`\n✅ 成功上傳 ${uploadCount} / ${allImages.size} 張圖片\n`);

  // 5. 建立專案
  console.log('📝 建立專案到 Strapi...');
  let successCount = 0;
  
  for (const project of transformedProjects) {
    const result = await createProject(project, uploadedImages);
    if (result) {
      successCount++;
    }
    // 避免過快請求
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 6. 完成
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 匯入完成！`);
  console.log(`✅ 成功匯入 ${successCount} / ${transformedProjects.length} 個專案`);
  console.log(`📸 上傳 ${uploadCount} 張圖片`);
  console.log('='.repeat(50));
}

// 執行匯入
importProjects().catch(error => {
  console.error('❌ 匯入過程發生錯誤:', error);
  process.exit(1);
});

