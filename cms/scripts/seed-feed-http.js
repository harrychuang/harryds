/*
  Seed feed items into Strapi via REST API (requires API Token)

  Prerequisites:
  - In Strapi Admin → Settings → API Tokens → Create new token (Full access)
  - Put STRAPI_URL and STRAPI_API_TOKEN in cms/.env or environment

  Usage:
    node ./scripts/seed-feed-http.js
*/

const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

if (!STRAPI_API_TOKEN) {
  console.error('[seed-http] Missing STRAPI_API_TOKEN. Create a Full access API token in Admin and set it in cms/.env');
  process.exit(1);
}

const headersJSON = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
};

const rootDir = path.resolve(__dirname, '..', '..');
const sharedJsonPath = path.resolve(rootDir, 'shared', 'data', 'feed.json');
const portfolioImgsDir = path.resolve(rootDir, 'portfolio', 'assets', 'imgs');

function mimeFromExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

async function uploadImageByRelative(relPath) {
  if (!relPath) return null;
  const absPath = path.resolve(portfolioImgsDir, relPath);
  if (!fs.existsSync(absPath)) {
    console.warn(`[seed-http] Image not found: ${absPath}`);
    return null;
  }
  const buf = fs.readFileSync(absPath);
  const blob = new Blob([buf], { type: mimeFromExt(absPath) });
  const form = new FormData();
  form.append('files', blob, path.basename(absPath));

  const res = await fetch(`${STRAPI_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` },
    body: form,
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error('[seed-http] Upload failed:', res.status, txt);
    return null;
  }
  const json = await res.json();
  if (Array.isArray(json) && json[0] && json[0].id) return json[0].id;
  return null;
}

async function findExistingByHeadingDate(heading, date) {
  const url = new URL(`${STRAPI_URL}/api/feed-items`);
  url.searchParams.set('filters[heading][$eq]', heading);
  url.searchParams.set('filters[date][$eq]', date);
  url.searchParams.set('pagination[pageSize]', '1');
  const res = await fetch(url, { headers: headersJSON });
  if (!res.ok) return null;
  const json = await res.json();
  return (json && json.data && json.data[0]) ? json.data[0] : null;
}

async function createOrUpdate(item) {
  // Map content dynamic zone
  const dz = [];
  if (Array.isArray(item.content)) {
    for (const block of item.content) {
      if (block.type === 'heading') {
        dz.push({ __component: 'feed.heading', level: String(block.level || 1), content: block.content || '' });
      } else if (block.type === 'paragraph') {
        // Strapi v5 Rich text (Blocks) expects an array of blocks
        dz.push({
          __component: 'feed.paragraph',
          content: [
            {
              type: 'paragraph',
              children: [
                { type: 'text', text: block.content || '' }
              ]
            }
          ]
        });
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
    publishedAt: new Date().toISOString(),
  };

  const existing = await findExistingByHeadingDate(item.heading, item.date);
  if (existing) {
    const res = await fetch(`${STRAPI_URL}/api/feed-items/${existing.id}`, {
      method: 'PUT',
      headers: headersJSON,
      body: JSON.stringify({ data }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`[seed-http] Update failed for ${item.heading}:`, res.status, txt);
    } else {
      console.log(`[seed-http] Updated: ${item.heading}`);
    }
  } else {
    const res = await fetch(`${STRAPI_URL}/api/feed-items`, {
      method: 'POST',
      headers: headersJSON,
      body: JSON.stringify({ data }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`[seed-http] Create failed for ${item.heading}:`, res.status, txt);
    } else {
      console.log(`[seed-http] Created: ${item.heading}`);
    }
  }
}

async function main() {
  if (!fs.existsSync(sharedJsonPath)) {
    throw new Error(`feed.json not found at ${sharedJsonPath}`);
  }
  const raw = fs.readFileSync(sharedJsonPath, 'utf-8');
  const json = JSON.parse(raw);
  const items = Array.isArray(json.items) ? json.items : [];

  for (const item of items) {
    await createOrUpdate(item);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


