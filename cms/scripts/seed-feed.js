/*
  Seed feed items into Strapi from shared/data/feed.json

  Usage:
    NODE_ENV=development node ./scripts/seed-feed.js

  Notes:
  - This script boots Strapi programmatically without starting the HTTP server
  - It will upsert entries by (heading + date)
  - It uploads heroImage and content image blocks from portfolio/assets/imgs/**
*/

const fs = require('fs');
const path = require('path');

function mimeFromExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

async function main() {
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi();
  await app.register();
  await app.bootstrap();

  const rootDir = path.resolve(__dirname, '..', '..');
  const sharedJsonPath = path.resolve(rootDir, 'shared', 'data', 'feed.json');
  const portfolioImgsDir = path.resolve(rootDir, 'portfolio', 'assets', 'imgs');

  if (!fs.existsSync(sharedJsonPath)) {
    throw new Error(`feed.json not found at ${sharedJsonPath}`);
  }

  const raw = fs.readFileSync(sharedJsonPath, 'utf-8');
  const json = JSON.parse(raw);
  const items = Array.isArray(json.items) ? json.items : [];

  const uid = 'api::feed-item.feed-item';

  async function uploadImageByRelative(relPath) {
    if (!relPath) return null;
    // relPath like: "demo/project-demo-1.jpg"
    const absPath = path.resolve(portfolioImgsDir, relPath);
    if (!fs.existsSync(absPath)) {
      console.warn(`[seed] Image not found: ${absPath}`);
      return null;
    }
    const stat = fs.statSync(absPath);
    const file = {
      path: absPath,
      name: path.basename(absPath),
      type: mimeFromExt(absPath),
      size: stat.size,
    };
    try {
      const uploaded = await app.plugin('upload').service('upload').upload({
        data: {},
        files: file,
      });
      if (Array.isArray(uploaded) && uploaded[0] && uploaded[0].id) {
        return uploaded[0].id;
      }
      return null;
    } catch (e) {
      console.error('[seed] Upload failed:', e.message || e);
      return null;
    }
  }

  for (const item of items) {
    const filters = { heading: item.heading, date: item.date };
    const existing = await app.entityService.findMany(uid, { filters, limit: 1 });

    // Map content dynamic zone
    const dz = [];
    if (Array.isArray(item.content)) {
      for (const block of item.content) {
        if (block.type === 'heading') {
          dz.push({ __component: 'feed.heading', level: String(block.level || 1), content: block.content || '' });
        } else if (block.type === 'paragraph') {
          dz.push({ __component: 'feed.paragraph', content: block.content || '' });
        } else if (block.type === 'image') {
          const imgId = await uploadImageByRelative(block.src);
          dz.push({ __component: 'feed.image', image: imgId, alt: block.alt || '' });
        } else if (block.type === 'list') {
          dz.push({ __component: 'feed.list', items: Array.isArray(block.items) ? block.items : [] });
        }
      }
    }

    const heroId = await uploadImageByRelative(item.heroImage);

    const data = {
      heading: item.heading,
      date: item.date,
      tags: Array.isArray(item.tags) ? item.tags : [],
      category: item.category,
      brand: item.brand || null,
      primaryColor: item.primaryColor || null,
      secondaryColor: item.secondaryColor || null,
      heroImage: heroId,
      content: dz,
    };

    if (existing && existing.length > 0) {
      const id = existing[0].id;
      await app.entityService.update(uid, id, { data });
      console.log(`[seed] Updated: ${item.heading}`);
    } else {
      await app.entityService.create(uid, { data });
      console.log(`[seed] Created: ${item.heading}`);
    }
  }

  await app.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


