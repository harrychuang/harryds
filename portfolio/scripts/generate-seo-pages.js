/**
 * SEO 頁面生成腳本
 * 在 build 完成後執行，為每個頁面生成包含正確 meta tags 的 HTML
 * 
 * 資料來源優先順序：
 * 1. Strapi CMS（正式站使用的資料）
 * 2. 本地 JSON 檔案（作為備援）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');
const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales/en');
const SITE_URL = 'https://noeinoi.com';

// Strapi 設定 - 從環境變數或使用預設值
const STRAPI_URL = process.env.VITE_STRAPI_URL || 'http://172.104.73.171:1337';

/**
 * 從 Strapi 取得文章資料
 */
async function fetchArticlesFromStrapi() {
  try {
    const url = new URL(`${STRAPI_URL}/api/articles`);
    url.searchParams.set('populate', '*');
    url.searchParams.set('pagination[pageSize]', '200');
    url.searchParams.set('publicationState', 'live');
    
    console.log(`📡 Fetching articles from Strapi: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const json = await response.json();
    console.log(`✓ Fetched ${json.data?.length || 0} articles from Strapi`);
    return json.data || [];
  } catch (error) {
    console.warn(`⚠️ Failed to fetch from Strapi: ${error.message}`);
    return null;
  }
}

/**
 * 從 Strapi 取得專案資料
 */
async function fetchProjectsFromStrapi() {
  try {
    const url = new URL(`${STRAPI_URL}/api/projects`);
    url.searchParams.set('populate', '*');
    url.searchParams.set('pagination[pageSize]', '100');
    url.searchParams.set('publicationState', 'live');
    
    console.log(`📡 Fetching projects from Strapi: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const json = await response.json();
    console.log(`✓ Fetched ${json.data?.length || 0} projects from Strapi`);
    return json.data || [];
  } catch (error) {
    console.warn(`⚠️ Failed to fetch projects from Strapi: ${error.message}`);
    return null;
  }
}

/**
 * 解析 Strapi 媒體 URL
 */
function resolveStrapiMediaUrl(media) {
  if (!media) return null;
  
  // 直接 URL 字串
  if (typeof media === 'string') {
    if (media.startsWith('http')) return media;
    if (media.startsWith('/uploads')) return `${STRAPI_URL}${media}`;
    return null;
  }
  
  // Strapi v5 格式: { url: '...', id: ... }
  if (media.url) {
    const url = media.url;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${STRAPI_URL}${url}`;
    return url;
  }
  
  // Strapi v4 格式: { data: { attributes: { url: '...' } } }
  if (media.data?.attributes?.url) {
    const url = media.data.attributes.url;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads')) return `${STRAPI_URL}${url}`;
    return url;
  }
  
  return null;
}

/**
 * 嘗試從本地 assets 找到對應的圖片（Vite build 後的 hash 版本）
 * 這樣可以使用 noeinoi.com 的 HTTPS URL，而不是 Strapi 的 HTTP IP
 */
function tryFindLocalAsset(strapiUrl) {
  if (!strapiUrl) return null;
  
  // 從 Strapi URL 提取檔名 (例如: topics_57_1_74a74f3df2.jpg -> topics-57.1)
  const match = strapiUrl.match(/topics[_-](\d+)[_-](\d+)/i);
  if (!match) return null;
  
  const basePattern = `topics-${match[1]}.${match[2]}`;
  
  // 在 assetMap 中查找匹配的檔案
  for (const [originalName, hashedPath] of assetMap.entries()) {
    if (originalName.startsWith(basePattern)) {
      return `${SITE_URL}${hashedPath}`;
    }
  }
  
  return null;
}

/**
 * 從 Strapi 文章資料取得第一張圖片 URL
 * 優先使用本地 assets（HTTPS），備援才用 Strapi URL
 */
function getArticleImageFromStrapi(article) {
  // 嘗試 coverImage
  const coverImageUrl = resolveStrapiMediaUrl(article.coverImage);
  if (coverImageUrl) {
    // 優先嘗試找本地 asset
    const localUrl = tryFindLocalAsset(coverImageUrl);
    if (localUrl) return localUrl;
  }
  
  // 嘗試 heroImage
  const heroImageUrl = resolveStrapiMediaUrl(article.heroImage);
  if (heroImageUrl) {
    const localUrl = tryFindLocalAsset(heroImageUrl);
    if (localUrl) return localUrl;
  }
  
  // 嘗試 images 陣列
  if (article.images?.data && Array.isArray(article.images.data)) {
    for (const img of article.images.data) {
      const url = resolveStrapiMediaUrl(img);
      if (url && !url.match(/\.(mp4|webm|ogg|mov)$/i)) {
        const localUrl = tryFindLocalAsset(url);
        if (localUrl) return localUrl;
      }
    }
  }
  
  // 如果都找不到本地 asset，返回 Strapi URL（備援）
  // 但將 HTTP 改為 HTTPS（如果 Strapi 支援的話）
  return coverImageUrl || heroImageUrl || null;
}

/**
 * 從 Strapi 專案資料取得第一張圖片 URL
 * 優先使用本地 assets（HTTPS），備援才用 Strapi URL
 */
function getProjectImageFromStrapi(project) {
  // 嘗試 coverImage
  const coverImageUrl = resolveStrapiMediaUrl(project.coverImage);
  if (coverImageUrl) {
    const localUrl = tryFindLocalAsset(coverImageUrl);
    if (localUrl) return localUrl;
  }
  
  // 嘗試 heroImage
  const heroImageUrl = resolveStrapiMediaUrl(project.heroImage);
  if (heroImageUrl) {
    const localUrl = tryFindLocalAsset(heroImageUrl);
    if (localUrl) return localUrl;
  }
  
  // 如果都找不到本地 asset，返回 Strapi URL（備援）
  return coverImageUrl || heroImageUrl || null;
}

// 建立原始檔名到 hash 檔名的映射
function buildAssetMap() {
  const assetsDir = path.join(DIST_DIR, 'assets');
  const assetMap = new Map();
  
  if (!fs.existsSync(assetsDir)) return assetMap;
  
  const files = fs.readdirSync(assetsDir);
  for (const file of files) {
    // 匹配格式: originalname-hash.ext (例如: topics-0.1-D7xjiffH.jpg)
    const match = file.match(/^(.+)-[A-Za-z0-9_-]+(\.[^.]+)$/);
    if (match) {
      const originalName = match[1] + match[2]; // topics-0.1.jpg
      assetMap.set(originalName, `/assets/${file}`);
    }
  }
  
  return assetMap;
}

const assetMap = buildAssetMap();

// 讀取基礎 HTML 模板
const baseHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');

// 解析圖片路徑，找到 build 後的 URL
function resolveImageUrl(imagePath) {
  if (!imagePath) return null;
  
  // 取得檔名 (例如: articles/53/topics-53.1.jpg -> topics-53.1.jpg)
  const fileName = imagePath.split('/').pop();
  
  // 在 assetMap 中查找（Vite 打包後的檔案）
  if (assetMap.has(fileName)) {
    return `${SITE_URL}${assetMap.get(fileName)}`;
  }
  
  // 檢查 public 目錄中是否有這個檔案
  const publicPath = path.join(DIST_DIR, 'imgs/demo', fileName);
  if (fs.existsSync(publicPath)) {
    return `${SITE_URL}/imgs/demo/${fileName}`;
  }
  
  // 如果找不到，返回 null（將使用預設圖片）
  return null;
}

// Slugify 函數
const slugify = (text) => text
  .toLowerCase()
  .trim()
  .replace(/\n/g, '-')
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

// 生成 SEO HTML
function generateSeoHtml({ title, description, image, url, type = 'website', keywords = [] }) {
  const fullTitle = `${title} | Harry Design Studio | 哈利設計事務所`;
  const finalDescription = description || '';
  // 如果有提供圖片 URL 就使用，否則使用預設圖片
  const finalImage = image || `${SITE_URL}/social-share-img-1200x630-v4.jpg`;
  const finalUrl = `${SITE_URL}${url}`;
  const finalKeywords = ['UI/UX設計', '產品設計', '前端開發', '設計系統', 'React', 'Design System', 'Harry Chuang', ...keywords].join(', ');

  let html = baseHtml;

  // 替換 title
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${fullTitle}</title>`
  );

  // 替換 meta description
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${finalDescription}">`
  );

  // 替換 keywords
  html = html.replace(
    /<meta name="keywords" content="[^"]*">/,
    `<meta name="keywords" content="${finalKeywords}">`
  );

  // 替換 canonical URL
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="${finalUrl}">`
  );

  // 替換 Open Graph meta tags
  html = html.replace(
    /<meta property="og:type" content="[^"]*">/,
    `<meta property="og:type" content="${type}">`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*">/,
    `<meta property="og:url" content="${finalUrl}">`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${fullTitle}">`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*">/,
    `<meta property="og:description" content="${finalDescription}">`
  );
  html = html.replace(
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${finalImage}">`
  );

  // 替換 Twitter meta tags
  html = html.replace(
    /<meta name="twitter:url" content="[^"]*">/,
    `<meta name="twitter:url" content="${finalUrl}">`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${fullTitle}">`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*">/,
    `<meta name="twitter:description" content="${finalDescription}">`
  );
  html = html.replace(
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${finalImage}">`
  );

  // 替換 hreflang
  html = html.replace(
    /<link rel="alternate" hreflang="zh-Hant" href="[^"]*">/,
    `<link rel="alternate" hreflang="zh-Hant" href="${finalUrl}">`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="en" href="[^"]*">/,
    `<link rel="alternate" hreflang="en" href="${finalUrl}?lng=en">`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="ja" href="[^"]*">/,
    `<link rel="alternate" hreflang="ja" href="${finalUrl}?lng=ja">`
  );
  html = html.replace(
    /<link rel="alternate" hreflang="x-default" href="[^"]*">/,
    `<link rel="alternate" hreflang="x-default" href="${finalUrl}">`
  );

  return html;
}

// 確保目錄存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 寫入 HTML 檔案
function writeHtmlFile(urlPath, html) {
  const dirPath = path.join(DIST_DIR, urlPath);
  ensureDir(dirPath);
  fs.writeFileSync(path.join(dirPath, 'index.html'), html);
  console.log(`✓ Generated: ${urlPath}/index.html`);
}

// 主函數
async function main() {
  console.log('\n📄 Generating SEO pages...\n');
  console.log(`🔗 Strapi URL: ${STRAPI_URL}\n`);

  // 優先從 Strapi 取得資料
  const strapiArticles = await fetchArticlesFromStrapi();
  const strapiProjects = await fetchProjectsFromStrapi();
  
  // 讀取本地資料作為備援
  const localArticlesData = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'articles.json'), 'utf-8'));
  const localProjectsData = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'projects.json'), 'utf-8'));
  const coursesData = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'courses.json'), 'utf-8'));

  let count = 0;

  // ========== 生成文章頁面 ==========
  if (strapiArticles && strapiArticles.length > 0) {
    // 使用 Strapi 資料（正式站的 ID）
    console.log('\n📰 Generating article pages from Strapi...');
    
    for (const article of strapiArticles) {
      const id = article.id;
      
      // Strapi v4 格式：資料在 attributes 底下
      const attrs = article.attributes || article;
      
      // title/subtitle 可能是多語言物件 { en: "...", ja: "...", "zh-Hant": "..." }
      // 優先使用英文，因為 slug 是基於英文生成的
      let heading = '';
      if (typeof attrs.title === 'string') {
        heading = attrs.title;
      } else if (attrs.title && typeof attrs.title === 'object') {
        heading = attrs.title.en || attrs.title['zh-Hant'] || Object.values(attrs.title)[0] || '';
      }
      
      let subtitle = '';
      if (typeof attrs.subtitle === 'string') {
        subtitle = attrs.subtitle;
      } else if (attrs.subtitle && typeof attrs.subtitle === 'object') {
        subtitle = attrs.subtitle.en || attrs.subtitle['zh-Hant'] || Object.values(attrs.subtitle)[0] || '';
      }
      
      const tags = attrs.tags || [];
      
      if (!heading) {
        console.warn(`⚠️ Skipping article ${id}: no heading`);
        continue;
      }
      
      // 使用 Strapi 的 slug 欄位，若無則自動生成
      const slug = attrs.slug || slugify(heading);
      const urlPath = `/article/${id}/${slug}`;
      
      // 取得圖片 - 傳入 attributes 而非整個 article
      const imageUrl = getArticleImageFromStrapi(attrs);
      
      const html = generateSeoHtml({
        title: heading.replace(/\n/g, ' '),
        description: subtitle,
        image: imageUrl,
        url: urlPath,
        type: 'article',
        keywords: Array.isArray(tags) ? tags : [],
      });

      writeHtmlFile(urlPath, html);
      count++;
    }
  } else {
    // 備援：使用本地 JSON 資料
    console.log('\n📰 Generating article pages from local JSON (fallback)...');
    
    for (const [id, article] of Object.entries(localArticlesData)) {
      const slug = slugify(article.heading);
      const urlPath = `/article/${id}/${slug}`;
      
      // 取得第一張圖片（排除影片）
      const firstImage = article.images?.find(img => !img.match(/\.(mp4|webm|ogg|mov)$/i));
      const imageUrl = resolveImageUrl(firstImage);
      
      const html = generateSeoHtml({
        title: article.heading.replace(/\n/g, ' '),
        description: article.subtitle || '',
        image: imageUrl,
        url: urlPath,
        type: 'article',
        keywords: article.tags || [],
      });

      writeHtmlFile(urlPath, html);
      count++;
    }
  }

  // ========== 生成課程頁面（目前只有本地資料）==========
  console.log('\n📚 Generating course pages from local JSON...');
  
  for (const [id, course] of Object.entries(coursesData)) {
    const slug = slugify(course.heading);
    const urlPath = `/course/${id}/${slug}`;
    
    // 取得第一張圖片（優先從 images 陣列找，若無則用 heroImage）
    const firstImage = (course.images && course.images.length > 0) ? course.images[0] : course.heroImage;
    const imageUrl = resolveImageUrl(firstImage);
    
    const html = generateSeoHtml({
      title: course.heading.replace(/\n/g, ' '),
      description: course.valueProposition?.title || course.subtitle || '',
      image: imageUrl, // 使用課程第一張圖片
      url: urlPath,
      type: 'article',
      keywords: course.tags || [],
    });

    writeHtmlFile(urlPath, html);
    count++;
  }

  // ========== 生成專案頁面 ==========
  if (strapiProjects && strapiProjects.length > 0) {
    // 使用 Strapi 資料（正式站的 ID）
    console.log('\n🎨 Generating project pages from Strapi...');
    
    for (const project of strapiProjects) {
      const id = project.id;
      
      // Strapi v4 格式：資料在 attributes 底下
      const attrs = project.attributes || project;
      
      // title/heading 可能是多語言物件
      let heading = '';
      const titleField = attrs.heading || attrs.title;
      if (typeof titleField === 'string') {
        heading = titleField;
      } else if (titleField && typeof titleField === 'object') {
        heading = titleField.en || titleField['zh-Hant'] || Object.values(titleField)[0] || '';
      }
      
      let description = '';
      const descField = attrs.description || attrs.subtitle;
      if (typeof descField === 'string') {
        description = descField;
      } else if (descField && typeof descField === 'object') {
        description = descField.en || descField['zh-Hant'] || Object.values(descField)[0] || '';
      }
      
      const visibility = attrs.visibility;
      const tags = attrs.tags || [];
      
      // 排除 private 專案
      if (visibility === 'private') continue;
      
      if (!heading) {
        console.warn(`⚠️ Skipping project ${id}: no heading`);
        continue;
      }
      
      // 使用 Strapi 的 slug 欄位，若無則自動生成
      const slug = attrs.slug || slugify(heading);
      const urlPath = `/project/${id}/${slug}`;
      
      // 取得圖片 - 傳入 attributes 而非整個 project
      const imageUrl = getProjectImageFromStrapi(attrs);
      
      const html = generateSeoHtml({
        title: heading.replace(/\n/g, ' '),
        description: description,
        image: imageUrl,
        url: urlPath,
        type: 'website',
        keywords: Array.isArray(tags) ? tags : [],
      });

      writeHtmlFile(urlPath, html);
      count++;
    }
  } else {
    // 備援：使用本地 JSON 資料
    console.log('\n🎨 Generating project pages from local JSON (fallback)...');
    
    for (const [id, project] of Object.entries(localProjectsData)) {
      if (project.visibility === 'private') continue;
      
      const slug = slugify(project.heading);
      const urlPath = `/project/${id}/${slug}`;
      
      // 嘗試多個圖片來源：heroImage -> specialHeadingImage -> mainImage -> sections 中的第一張圖
      let imageUrl = resolveImageUrl(project.heroImage);
      
      if (!imageUrl && project.projectInfo?.specialHeadingImage) {
        imageUrl = resolveImageUrl(project.projectInfo.specialHeadingImage);
      }
      
      if (!imageUrl && project.projectInfo?.mainImage) {
        imageUrl = resolveImageUrl(project.projectInfo.mainImage);
      }
      
      // 如果還是沒有，嘗試從 sections 中找第一張圖片
      if (!imageUrl && project.projectInfo?.sections) {
        for (const section of Object.values(project.projectInfo.sections)) {
          for (const [key, value] of Object.entries(section)) {
            if (key.startsWith('image') && typeof value === 'string') {
              imageUrl = resolveImageUrl(value);
              if (imageUrl) break;
            }
          }
          if (imageUrl) break;
        }
      }
      
      const html = generateSeoHtml({
        title: project.heading.replace(/\n/g, ' '),
        description: project.projectInfo?.description || '',
        image: imageUrl,
        url: urlPath,
        type: 'website',
        keywords: project.tags || [],
      });

      writeHtmlFile(urlPath, html);
      count++;
    }
  }

  // ========== 生成靜態頁面 ==========
  console.log('\n📄 Generating static pages...');
  
  // 生成 About 頁面
  const aboutHtml = generateSeoHtml({
    title: 'About',
    description: 'Harry Chuang - 15年產品設計與前端開發經驗，AAPD 設計系統課程講師，awwrated 創辦人。專注於 UI/UX 設計、設計系統建置與培訓顧問服務。',
    url: '/about',
    type: 'profile',
  });
  writeHtmlFile('/about', aboutHtml);
  count++;

  // 生成 Articles 列表頁面
  const articlesHtml = generateSeoHtml({
    title: 'Articles',
    description: '分享產品設計、UI/UX、設計系統與前端開發的經驗與見解。',
    url: '/articles',
    type: 'website',
  });
  writeHtmlFile('/articles', articlesHtml);
  count++;

  console.log(`\n✅ Generated ${count} SEO pages successfully!\n`);
}

main().catch(console.error);
