import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// ES Module 中取得 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Strapi API 配置
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// 是否執行乾跑（只顯示變更，不實際更新）
const DRY_RUN = process.env.DRY_RUN === 'true';

// 儲存媒體映射表
let mediaMapping = new Map(); // key: 標準化檔名, value: Strapi URL

/**
 * 標準化檔名用於比較
 * "demo-noein-03.jpg" → "demo_noein_03.jpg"
 */
function normalizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_');
}

/**
 * 從 Strapi 檔名中提取基礎檔名（去除 hash）
 * "demo_noein_03_5b27eed5e9.jpg" → "demo_noein_03.jpg"
 */
function extractBaseFilename(strapiFilename) {
  // Strapi 在檔名後面添加 _hash，例如 filename_abc123.jpg
  const ext = path.extname(strapiFilename);
  const nameWithoutExt = path.basename(strapiFilename, ext);
  
  // 嘗試移除最後一個 _hash（通常是 8-10 個字元的 hex）
  const match = nameWithoutExt.match(/^(.+)_[a-f0-9]{8,12}$/i);
  if (match) {
    return match[1] + ext;
  }
  
  return strapiFilename;
}

/**
 * 從舊路徑中提取檔名
 * "demo/noein/demo-noein-03.jpg" → "demo-noein-03.jpg"
 */
function extractFilenameFromPath(oldPath) {
  return path.basename(oldPath);
}

/**
 * 從 Strapi 取得所有媒體檔案並建立映射表
 */
async function fetchMediaAndBuildMapping() {
  console.log('📸 從 Strapi 取得媒體檔案列表...');
  
  try {
    let page = 1;
    const pageSize = 100;
    let hasMore = true;
    let totalFiles = 0;
    
    while (hasMore) {
      const response = await fetch(
        `${STRAPI_URL}/api/upload/files?pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`取得媒體列表失敗 (${response.status}): ${text}`);
      }

      const files = await response.json();
      
      if (!Array.isArray(files) || files.length === 0) {
        hasMore = false;
        break;
      }
      
      files.forEach(file => {
        const strapiFilename = file.name;
        const strapiUrl = file.url; // 例如 /uploads/demo_noein_03_5b27eed5e9.jpg
        
        // 提取基礎檔名（去除 hash）
        const baseFilename = extractBaseFilename(strapiFilename);
        const normalizedBase = normalizeFilename(baseFilename);
        
        // 儲存多種可能的 key 以增加匹配率
        mediaMapping.set(normalizedBase, strapiUrl);
        mediaMapping.set(normalizeFilename(strapiFilename), strapiUrl);
        
        totalFiles++;
      });
      
      hasMore = files.length === pageSize;
      page++;
    }
    
    console.log(`   找到 ${totalFiles} 個媒體檔案\n`);
    
    // 顯示映射表（用於調試）
    if (process.env.DEBUG === 'true') {
      console.log('📋 媒體映射表:');
      mediaMapping.forEach((url, key) => {
        console.log(`   ${key} → ${url}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ 取得媒體檔案失敗:', error.message);
    throw error;
  }
}

/**
 * 根據舊路徑查找對應的 Strapi URL
 */
function findStrapiUrl(oldPath) {
  if (!oldPath || typeof oldPath !== 'string') return null;
  
  // 如果已經是 Strapi URL，直接返回
  if (oldPath.startsWith('/uploads/') || oldPath.startsWith('http')) {
    return null; // 不需要更新
  }
  
  // 提取檔名
  const filename = extractFilenameFromPath(oldPath);
  const normalizedFilename = normalizeFilename(filename);
  
  // 嘗試直接匹配
  if (mediaMapping.has(normalizedFilename)) {
    return mediaMapping.get(normalizedFilename);
  }
  
  // 嘗試部分匹配（檔名可能被 Strapi 修改）
  for (const [key, url] of mediaMapping.entries()) {
    // 檢查是否包含原始檔名的主要部分
    const filenameWithoutExt = path.basename(normalizedFilename, path.extname(normalizedFilename));
    if (key.includes(filenameWithoutExt)) {
      return url;
    }
  }
  
  return null;
}

/**
 * 遞迴更新物件中的圖片路徑
 */
function updateImagePaths(obj, path = '') {
  if (!obj || typeof obj !== 'object') return { updated: false, changes: [] };
  
  let changes = [];
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const result = updateImagePaths(item, `${path}[${index}]`);
      changes = changes.concat(result.changes);
    });
  } else {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        // 檢查是否為圖片路徑
        if (isImagePath(value)) {
          const newUrl = findStrapiUrl(value);
          if (newUrl) {
            changes.push({
              path: currentPath,
              oldValue: value,
              newValue: newUrl
            });
            obj[key] = newUrl;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        const result = updateImagePaths(value, currentPath);
        changes = changes.concat(result.changes);
      }
    }
  }
  
  return { updated: changes.length > 0, changes };
}

/**
 * 檢查字串是否為圖片路徑
 */
function isImagePath(str) {
  if (!str || typeof str !== 'string') return false;
  
  // 檢查是否為圖片/影片檔案
  const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.mov'];
  const ext = path.extname(str).toLowerCase();
  
  if (!mediaExtensions.includes(ext)) return false;
  
  // 排除已經是 Strapi URL 的路徑
  if (str.startsWith('/uploads/') || str.startsWith('http')) return false;
  
  return true;
}

/**
 * 從 Strapi 取得所有專案（包含所有欄位）
 */
async function fetchProjects() {
  console.log('📖 從 Strapi 取得專案列表...');
  
  try {
    let page = 1;
    const pageSize = 100;
    let hasMore = true;
    const allProjects = [];
    
    while (hasMore) {
      // 加入 populate=* 來取得所有欄位（包括 content）
      const response = await fetch(
        `${STRAPI_URL}/api/projects?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`
          }
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`取得專案列表失敗 (${response.status}): ${text}`);
      }

      const result = await response.json();
      const rawProjects = result.data || [];
      
      // 處理 Strapi v4/v5 的不同資料格式
      const projects = rawProjects.map(project => {
        // Strapi v4: 資料包裝在 attributes 中
        // Strapi v5: 資料直接在 project 物件中
        if (project.attributes) {
          return {
            id: project.id,
            documentId: project.documentId || project.id,
            ...project.attributes
          };
        }
        return {
          ...project,
          documentId: project.documentId || project.id
        };
      });
      
      allProjects.push(...projects);
      
      const pagination = result.meta?.pagination;
      hasMore = pagination && page < pagination.pageCount;
      page++;
    }
    
    console.log(`   找到 ${allProjects.length} 個專案\n`);
    return allProjects;
    
  } catch (error) {
    console.error('❌ 取得專案列表失敗:', error.message);
    throw error;
  }
}

/**
 * 更新單個專案
 */
async function updateProject(project) {
  const documentId = project.documentId || project.id;
  const title = project.title?.en || project.title || `Project ${project.id}`;
  
  // 調試：顯示專案資料結構
  if (process.env.DEBUG === 'true') {
    console.log(`\n🔍 [DEBUG] 專案 "${title}" 原始資料:`);
    console.log(`   id: ${project.id}`);
    console.log(`   documentId: ${documentId}`);
    console.log(`   所有欄位: ${Object.keys(project).join(', ')}`);
    console.log(`   content 類型: ${typeof project.content}`);
    if (project.content) {
      console.log(`   content 內容預覽: ${JSON.stringify(project.content).substring(0, 800)}...`);
    } else {
      console.log(`   content: 無資料`);
    }
  }
  
  // 複製 content 物件以進行更新
  const content = JSON.parse(JSON.stringify(project.content || {}));
  
  // 更新 content 中的圖片路徑
  const { updated, changes } = updateImagePaths(content);
  
  if (!updated) {
    console.log(`⏭️  ${title}: 無需更新`);
    return { action: 'skipped', changes: 0 };
  }
  
  console.log(`\n📝 ${title}:`);
  changes.forEach(change => {
    console.log(`   ${change.path}:`);
    console.log(`      舊: ${change.oldValue}`);
    console.log(`      新: ${change.newValue}`);
  });
  
  if (DRY_RUN) {
    console.log(`   ⚠️  [DRY RUN] 跳過實際更新`);
    return { action: 'dry_run', changes: changes.length };
  }
  
  // 執行更新
  try {
    const response = await fetch(`${STRAPI_URL}/api/projects/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`
      },
      body: JSON.stringify({
        data: { content }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`更新失敗 (${response.status}): ${JSON.stringify(errorData)}`);
    }

    console.log(`   ✅ 已更新 ${changes.length} 個路徑`);
    return { action: 'updated', changes: changes.length };
    
  } catch (error) {
    console.error(`   ❌ 更新失敗: ${error.message}`);
    return { action: 'failed', changes: 0 };
  }
}

/**
 * 主流程
 */
async function main() {
  console.log('🚀 開始更新專案圖片路徑...\n');
  console.log(`📡 Strapi URL: ${STRAPI_URL}`);
  console.log(`🔧 模式: ${DRY_RUN ? '乾跑（不實際更新）' : '正式執行'}\n`);

  // 檢查 API Token
  if (!STRAPI_API_TOKEN) {
    console.error('❌ 錯誤: 請設定 STRAPI_API_TOKEN 環境變數');
    console.log('\n使用方式:');
    console.log('STRAPI_URL=http://172.104.73.171:1337 STRAPI_API_TOKEN=your-token node scripts/update-image-paths.mjs');
    console.log('\n乾跑模式（只顯示變更，不實際更新）:');
    console.log('DRY_RUN=true STRAPI_URL=... STRAPI_API_TOKEN=... node scripts/update-image-paths.mjs');
    process.exit(1);
  }

  try {
    // 1. 從 Strapi 取得媒體檔案並建立映射表
    await fetchMediaAndBuildMapping();
    
    // 2. 取得所有專案
    const projects = await fetchProjects();
    
    // 3. 更新每個專案
    console.log('🔄 更新專案圖片路徑...');
    
    let stats = {
      skipped: 0,
      updated: 0,
      failed: 0,
      totalChanges: 0
    };
    
    for (const project of projects) {
      const result = await updateProject(project);
      
      if (result.action === 'skipped') {
        stats.skipped++;
      } else if (result.action === 'updated' || result.action === 'dry_run') {
        stats.updated++;
        stats.totalChanges += result.changes;
      } else if (result.action === 'failed') {
        stats.failed++;
      }
      
      // 避免過快請求
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 4. 顯示結果
    console.log('\n' + '='.repeat(50));
    console.log('🎉 更新完成！');
    console.log('='.repeat(50));
    console.log(`📊 統計:`);
    console.log(`   ✅ 已更新: ${stats.updated} 個專案`);
    console.log(`   ⏭️  跳過: ${stats.skipped} 個專案`);
    if (stats.failed > 0) {
      console.log(`   ❌ 失敗: ${stats.failed} 個專案`);
    }
    console.log(`   📸 總共更新: ${stats.totalChanges} 個圖片路徑`);
    if (DRY_RUN) {
      console.log(`\n⚠️  這是乾跑模式，未實際更新。移除 DRY_RUN=true 以執行正式更新。`);
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ 執行過程發生錯誤:', error.message);
    process.exit(1);
  }
}

// 執行
main();

