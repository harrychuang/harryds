/**
 * SEO 頁面生成腳本
 * 在 build 完成後執行，為每個頁面生成包含正確 meta tags 的 HTML
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');
const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales/en');
const SITE_URL = 'https://noeinoi.com';

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

  // 讀取文章資料
  const articlesData = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'articles.json'), 'utf-8'));
  
  // 讀取專案資料
  const projectsData = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'projects.json'), 'utf-8'));

  let count = 0;

  // 生成文章頁面
  for (const [id, article] of Object.entries(articlesData)) {
    const slug = slugify(article.heading);
    const urlPath = `/article/${id}/${slug}`;
    
    // 取得第一張圖片（排除影片）
    const firstImage = article.images?.find(img => !img.match(/\.(mp4|webm|ogg|mov)$/i));
    const imageUrl = resolveImageUrl(firstImage);
    
    const html = generateSeoHtml({
      title: article.heading.replace(/\n/g, ' '),
      description: article.subtitle || '',
      image: imageUrl, // 使用文章第一張圖片
      url: urlPath,
      type: 'article',
      keywords: article.tags || [],
    });

    writeHtmlFile(urlPath, html);
    count++;
  }

  // 生成專案頁面（排除 private）
  for (const [id, project] of Object.entries(projectsData)) {
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
      image: imageUrl, // 使用找到的圖片
      url: urlPath,
      type: 'website',
      keywords: project.tags || [],
    });

    writeHtmlFile(urlPath, html);
    count++;
  }

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
