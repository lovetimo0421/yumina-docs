# Card Generation Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Node.js toolchain that discovers IPs, scrapes public materials, and provides structured data for Claude Code to generate Yumina-format card JSONs.

**Architecture:** Three independent modules — discover (crawl rankings → queue), scrape (fetch wiki/MAL data → sources/), templates (extract patterns from existing sample cards). Card generation itself is done by Claude Code reading sources + templates and writing output JSON. No LLM API calls in scripts.

**Tech Stack:** Node.js ESM, cheerio (HTML parsing), undici (HTTP), dotenv (config)

---

### Task 1: Scaffold card-gen directory and dependencies

**Files:**
- Create: `scripts/card-gen/package.json`
- Create: `scripts/card-gen/.env.example`
- Create: `scripts/card-gen/.gitignore`
- Modify: `.gitignore` (add sources/, output/, queue/)

**Step 1: Create directory structure**

```bash
mkdir -p scripts/card-gen/lib/scrapers
mkdir -p scripts/card-gen/templates
mkdir -p sources
mkdir -p queue
mkdir -p output
```

**Step 2: Create package.json**

```json
{
  "name": "yumina-card-gen",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "discover": "node discover.js",
    "scrape": "node scrape.js"
  },
  "dependencies": {
    "cheerio": "^1.0.0",
    "undici": "^7.0.0",
    "dotenv": "^16.4.0"
  }
}
```

**Step 3: Create .env.example**

```
# Optional: only needed for authenticated sources
PIXIV_COOKIE=
ASMR_COOKIE=
```

**Step 4: Create .gitignore for card-gen**

```
node_modules/
.env
```

**Step 5: Update root .gitignore**

Append:
```
# Card generation pipeline
sources/
output/
queue/
```

**Step 6: Install dependencies**

```bash
cd scripts/card-gen && pnpm install
```

**Step 7: Commit**

```bash
git add scripts/card-gen/package.json scripts/card-gen/.env.example scripts/card-gen/.gitignore .gitignore
git commit -m "feat: scaffold card-gen pipeline directory structure"
```

---

### Task 2: Build HTTP utility with rate limiting

**Files:**
- Create: `scripts/card-gen/lib/http.js`

**Step 1: Write the HTTP utility**

A thin wrapper around fetch with:
- Rate limiting (configurable delay between requests)
- Retry with exponential backoff (3 attempts)
- User-Agent header
- Cookie injection for authenticated sources
- Response caching to `sources/.cache/`

```javascript
// scripts/card-gen/lib/http.js
import { mkdir, readFile, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { join } from 'path';

const CACHE_DIR = join(import.meta.dirname, '../../sources/.cache');
let lastRequestTime = 0;

export async function fetchWithDelay(url, options = {}) {
  const {
    delayMs = 1500,
    retries = 3,
    useCache = true,
    cookie = null,
    responseType = 'text'
  } = options;

  // Check cache
  if (useCache) {
    const cached = await readCache(url);
    if (cached) return cached;
  }

  // Rate limit
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < delayMs) {
    await sleep(delayMs - elapsed);
  }

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ...(cookie ? { 'Cookie': cookie } : {})
  };

  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      lastRequestTime = Date.now();
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);

      const body = responseType === 'json' ? await res.json() : await res.text();

      if (useCache) await writeCache(url, body);
      return body;
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt + 1} failed for ${url}: ${err.message}`);
      if (attempt < retries - 1) await sleep(1000 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function downloadImage(url, destPath, options = {}) {
  const { cookie = null } = options;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ...(cookie ? { 'Cookie': cookie } : {})
  };

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await mkdir(join(destPath, '..'), { recursive: true });
  await writeFile(destPath, buffer);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cacheKey(url) {
  return createHash('md5').update(url).digest('hex');
}

async function readCache(url) {
  try {
    const path = join(CACHE_DIR, cacheKey(url));
    const raw = await readFile(path, 'utf-8');
    const { data, expiry } = JSON.parse(raw);
    if (Date.now() > expiry) return null;
    return data;
  } catch { return null; }
}

async function writeCache(url, data) {
  await mkdir(CACHE_DIR, { recursive: true });
  const path = join(CACHE_DIR, cacheKey(url));
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
  await writeFile(path, JSON.stringify({ data, expiry }));
}
```

**Step 2: Verify it loads**

```bash
cd scripts/card-gen && node -e "import('./lib/http.js').then(() => console.log('OK'))"
```
Expected: `OK`

**Step 3: Commit**

```bash
git add scripts/card-gen/lib/http.js
git commit -m "feat: add HTTP utility with rate limiting and caching"
```

---

### Task 3: Build scrapers — 萌娘百科 + Fandom Wiki

**Files:**
- Create: `scripts/card-gen/lib/scrapers/moegirl.js`
- Create: `scripts/card-gen/lib/scrapers/fandom.js`

**Step 1: 萌娘百科 scraper**

Uses MediaWiki API (public, no auth needed):
- Search for IP by name
- Extract character list from category/infobox
- Parse character details (appearance, personality, abilities)
- Extract world setting sections

```javascript
// scripts/card-gen/lib/scrapers/moegirl.js
import * as cheerio from 'cheerio';
import { fetchWithDelay } from '../http.js';

const BASE = 'https://zh.moegirl.org.cn';
const API = `${BASE}/api.php`;

export async function searchMoegirl(query) {
  const url = `${API}?action=opensearch&search=${encodeURIComponent(query)}&limit=10&format=json`;
  const data = await fetchWithDelay(url, { responseType: 'json' });
  // data = [query, [titles], [descriptions], [urls]]
  return (data[1] || []).map((title, i) => ({
    title,
    description: data[2]?.[i] || '',
    url: data[3]?.[i] || ''
  }));
}

export async function getPageContent(title) {
  const url = `${API}?action=parse&page=${encodeURIComponent(title)}&prop=text|categories&format=json`;
  const data = await fetchWithDelay(url, { responseType: 'json' });
  if (data.error) return null;
  const html = data.parse?.text?.['*'] || '';
  const categories = (data.parse?.categories || []).map(c => c['*']);
  return { html, categories, title: data.parse?.title };
}

export async function extractCharacters(ipTitle) {
  const page = await getPageContent(ipTitle);
  if (!page) return [];

  const $ = cheerio.load(page.html);
  const characters = [];

  // Look for character sections (common patterns in moegirl)
  $('h2, h3').each((_, el) => {
    const heading = $(el).text().trim();
    if (heading.includes('登场人物') || heading.includes('角色') || heading.includes('人物介绍')) {
      // Collect content until next heading of same or higher level
      let sibling = $(el).next();
      while (sibling.length && !sibling.is('h2, h3')) {
        const text = sibling.text().trim();
        if (text.length > 20) {
          characters.push({ rawText: text, source: 'moegirl', page: ipTitle });
        }
        sibling = sibling.next();
      }
    }
  });

  return characters;
}

export async function extractWorldSetting(ipTitle) {
  const page = await getPageContent(ipTitle);
  if (!page) return null;

  const $ = cheerio.load(page.html);
  const sections = {};

  $('h2, h3').each((_, el) => {
    const heading = $(el).text().trim()
      .replace(/\[编辑\]/, '').replace(/\[編輯\]/, '').trim();
    let content = '';
    let sibling = $(el).next();
    while (sibling.length && !sibling.is('h2, h3')) {
      content += sibling.text().trim() + '\n';
      sibling = sibling.next();
    }
    if (content.trim()) {
      sections[heading] = content.trim();
    }
  });

  return { title: ipTitle, sections, source: 'moegirl' };
}
```

**Step 2: Fandom Wiki scraper**

```javascript
// scripts/card-gen/lib/scrapers/fandom.js
import * as cheerio from 'cheerio';
import { fetchWithDelay } from '../http.js';

export async function searchFandom(query, lang = 'zh') {
  // Fandom unified search
  const url = `https://community.fandom.com/wiki/Special:Search?query=${encodeURIComponent(query)}&scope=cross-wiki`;
  const html = await fetchWithDelay(url);
  const $ = cheerio.load(html);

  const results = [];
  $('.unified-search__result__title a, .search-results a').each((_, el) => {
    const href = $(el).attr('href');
    const title = $(el).text().trim();
    if (href && title) results.push({ title, url: href });
  });
  return results.slice(0, 10);
}

export async function getFandomPage(wikiUrl) {
  const html = await fetchWithDelay(wikiUrl);
  const $ = cheerio.load(html);

  // Remove navigation, ads, etc.
  $('.nav, .ad, .footer, #toc, .references').remove();

  const title = $('h1.page-header__title, #firstHeading').first().text().trim();
  const content = $('.mw-parser-output').first();

  const sections = {};
  let currentHeading = 'intro';
  let currentContent = '';

  content.children().each((_, el) => {
    const tag = el.tagName;
    if (tag === 'h2' || tag === 'h3') {
      if (currentContent.trim()) {
        sections[currentHeading] = currentContent.trim();
      }
      currentHeading = $(el).text().replace(/\[edit\]/gi, '').trim();
      currentContent = '';
    } else {
      currentContent += $(el).text().trim() + '\n';
    }
  });
  if (currentContent.trim()) {
    sections[currentHeading] = currentContent.trim();
  }

  // Extract infobox data
  const infobox = {};
  $('.portable-infobox .pi-data, .infobox tr').each((_, el) => {
    const label = $(el).find('.pi-data-label, th').first().text().trim();
    const value = $(el).find('.pi-data-value, td').first().text().trim();
    if (label && value) infobox[label] = value;
  });

  // Extract images
  const images = [];
  content.find('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src && !src.includes('pixel') && !src.includes('icon')) {
      images.push(src.replace(/\/revision\/.*/, ''));
    }
  });

  return { title, sections, infobox, images: images.slice(0, 20), source: wikiUrl };
}
```

**Step 3: Verify scrapers load**

```bash
cd scripts/card-gen && node -e "
import('./lib/scrapers/moegirl.js').then(() => console.log('moegirl OK'));
import('./lib/scrapers/fandom.js').then(() => console.log('fandom OK'));
"
```

**Step 4: Commit**

```bash
git add scripts/card-gen/lib/scrapers/moegirl.js scripts/card-gen/lib/scrapers/fandom.js
git commit -m "feat: add moegirl and fandom wiki scrapers"
```

---

### Task 4: Build scrapers — MAL + Bangumi

**Files:**
- Create: `scripts/card-gen/lib/scrapers/mal.js`
- Create: `scripts/card-gen/lib/scrapers/bangumi.js`

**Step 1: MyAnimeList scraper (Jikan API — free, no auth)**

```javascript
// scripts/card-gen/lib/scrapers/mal.js
import { fetchWithDelay } from '../http.js';

const JIKAN = 'https://api.jikan.moe/v4';

export async function searchMAL(query, type = 'anime') {
  const url = `${JIKAN}/${type}?q=${encodeURIComponent(query)}&limit=10`;
  const data = await fetchWithDelay(url, { responseType: 'json', delayMs: 1000 });
  return (data.data || []).map(item => ({
    malId: item.mal_id,
    title: item.title,
    titleJa: item.title_japanese,
    type: item.type,
    score: item.score,
    synopsis: item.synopsis,
    genres: (item.genres || []).map(g => g.name),
    imageUrl: item.images?.jpg?.large_image_url,
    url: item.url
  }));
}

export async function getMALCharacters(malId, type = 'anime') {
  const url = `${JIKAN}/${type}/${malId}/characters`;
  const data = await fetchWithDelay(url, { responseType: 'json', delayMs: 1000 });
  return (data.data || []).map(item => ({
    malId: item.character?.mal_id,
    name: item.character?.name,
    imageUrl: item.character?.images?.jpg?.image_url,
    role: item.role
  }));
}

export async function getMALCharacterDetail(charId) {
  const url = `${JIKAN}/characters/${charId}/full`;
  const data = await fetchWithDelay(url, { responseType: 'json', delayMs: 1000 });
  const char = data.data;
  if (!char) return null;
  return {
    malId: char.mal_id,
    name: char.name,
    nameKanji: char.name_kanji,
    about: char.about,
    imageUrl: char.images?.jpg?.image_url
  };
}

export async function getSeasonalAnime(year, season) {
  // season: winter, spring, summer, fall
  const url = `${JIKAN}/seasons/${year}/${season}?limit=25&order_by=score&sort=desc`;
  const data = await fetchWithDelay(url, { responseType: 'json', delayMs: 1000 });
  return (data.data || []).map(item => ({
    malId: item.mal_id,
    title: item.title,
    titleJa: item.title_japanese,
    score: item.score,
    genres: (item.genres || []).map(g => g.name),
    synopsis: item.synopsis,
    imageUrl: item.images?.jpg?.large_image_url,
    url: item.url
  }));
}

export async function getTopAnime(page = 1) {
  const url = `${JIKAN}/top/anime?page=${page}&limit=25`;
  const data = await fetchWithDelay(url, { responseType: 'json', delayMs: 1000 });
  return (data.data || []).map(item => ({
    malId: item.mal_id,
    title: item.title,
    titleJa: item.title_japanese,
    score: item.score,
    genres: (item.genres || []).map(g => g.name),
    synopsis: item.synopsis,
    url: item.url
  }));
}
```

**Step 2: Bangumi scraper (public API)**

```javascript
// scripts/card-gen/lib/scrapers/bangumi.js
import { fetchWithDelay } from '../http.js';

const BASE = 'https://api.bgm.tv';

export async function searchBangumi(query, type = 2) {
  // type: 1=book, 2=anime, 3=music, 4=game, 6=real
  const url = `${BASE}/search/subject/${encodeURIComponent(query)}?type=${type}&responseGroup=large`;
  const data = await fetchWithDelay(url, {
    responseType: 'json',
    delayMs: 500
  });
  return (data.list || []).map(item => ({
    bangumiId: item.id,
    title: item.name,
    titleCn: item.name_cn,
    type: item.type,
    score: item.rating?.score,
    summary: item.summary,
    imageUrl: item.images?.large,
    url: `https://bgm.tv/subject/${item.id}`
  }));
}

export async function getBangumiCharacters(subjectId) {
  const url = `${BASE}/v0/subjects/${subjectId}/characters`;
  const data = await fetchWithDelay(url, { responseType: 'json', delayMs: 500 });
  return (data || []).map(item => ({
    bangumiId: item.id,
    name: item.name,
    type: item.type, // 1=character, 2=mechanic, 3=ship
    relation: item.relation,
    imageUrl: item.images?.grid
  }));
}
```

**Step 3: Commit**

```bash
git add scripts/card-gen/lib/scrapers/mal.js scripts/card-gen/lib/scrapers/bangumi.js
git commit -m "feat: add MAL (Jikan) and Bangumi scrapers"
```

---

### Task 5: Build discover.js — IP discovery script

**Files:**
- Create: `scripts/card-gen/discover.js`

**Step 1: Write discover.js**

Crawls multiple ranking sources, deduplicates, outputs to `queue/pending.json`.

```javascript
// scripts/card-gen/discover.js
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getSeasonalAnime, getTopAnime } from './lib/scrapers/mal.js';
import { searchBangumi } from './lib/scrapers/bangumi.js';

const QUEUE_DIR = join(import.meta.dirname, '../../queue');
const PENDING_PATH = join(QUEUE_DIR, 'pending.json');
const COMPLETED_PATH = join(QUEUE_DIR, 'completed.json');

async function loadJSON(path, fallback = []) {
  try { return JSON.parse(await readFile(path, 'utf-8')); }
  catch { return fallback; }
}

async function saveJSON(path, data) {
  await mkdir(join(path, '..'), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function discoverFromMAL() {
  console.log('📡 Discovering from MyAnimeList...');
  const results = [];

  // Current season
  const now = new Date();
  const year = now.getFullYear();
  const seasons = ['winter', 'spring', 'summer', 'fall'];
  const currentSeason = seasons[Math.floor(now.getMonth() / 3)];

  try {
    const seasonal = await getSeasonalAnime(year, currentSeason);
    for (const item of seasonal.slice(0, 15)) {
      results.push({
        name: item.titleJa || item.title,
        nameEn: item.title,
        slug: slugify(item.title),
        source: `MAL ${year} ${currentSeason}`,
        type: 'anime',
        score: item.score,
        genres: item.genres,
        synopsis: item.synopsis,
        refs: [item.url],
        malId: item.malId,
        discoveredAt: new Date().toISOString().split('T')[0]
      });
    }
  } catch (e) { console.warn('MAL seasonal failed:', e.message); }

  // All-time top
  try {
    const top = await getTopAnime(1);
    for (const item of top.slice(0, 15)) {
      results.push({
        name: item.titleJa || item.title,
        nameEn: item.title,
        slug: slugify(item.title),
        source: 'MAL all-time top',
        type: 'anime',
        score: item.score,
        genres: item.genres,
        synopsis: item.synopsis,
        refs: [item.url],
        malId: item.malId,
        discoveredAt: new Date().toISOString().split('T')[0]
      });
    }
  } catch (e) { console.warn('MAL top failed:', e.message); }

  return results;
}

async function main() {
  const existing = await loadJSON(PENDING_PATH);
  const completed = await loadJSON(COMPLETED_PATH);
  const completedSlugs = new Set(completed.map(c => c.slug));
  const existingSlugs = new Set(existing.map(e => e.slug));

  const discovered = await discoverFromMAL();

  // Deduplicate
  const newItems = discovered.filter(item =>
    !completedSlugs.has(item.slug) && !existingSlugs.has(item.slug)
  );

  const merged = [...existing, ...newItems];
  await saveJSON(PENDING_PATH, merged);

  console.log(`\n✅ Discovery complete:`);
  console.log(`   New IPs found: ${newItems.length}`);
  console.log(`   Total in queue: ${merged.length}`);
  console.log(`   Already completed: ${completed.length}`);

  if (newItems.length > 0) {
    console.log('\n📋 New discoveries:');
    for (const item of newItems) {
      console.log(`   - ${item.name} (${item.nameEn}) — ${item.source} — score: ${item.score}`);
    }
  }
}

main().catch(console.error);
```

**Step 2: Test it**

```bash
cd scripts/card-gen && node discover.js
```

Expected: prints discovered IPs, creates `queue/pending.json`

**Step 3: Commit**

```bash
git add scripts/card-gen/discover.js
git commit -m "feat: add IP discovery script with MAL integration"
```

---

### Task 6: Build scrape.js — material scraping script

**Files:**
- Create: `scripts/card-gen/scrape.js`

**Step 1: Write scrape.js**

Orchestrates all scrapers to collect materials for a given IP.

```javascript
// scripts/card-gen/scrape.js
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { searchMAL, getMALCharacters, getMALCharacterDetail } from './lib/scrapers/mal.js';
import { searchBangumi, getBangumiCharacters } from './lib/scrapers/bangumi.js';
import { searchMoegirl, extractCharacters, extractWorldSetting } from './lib/scrapers/moegirl.js';
import { downloadImage } from './lib/http.js';

const SOURCES_DIR = join(import.meta.dirname, '../../sources');

function slugify(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

async function saveJSON(dir, filename, data) {
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), JSON.stringify(data, null, 2), 'utf-8');
}

async function scrapeIP(name) {
  const slug = slugify(name);
  const dir = join(SOURCES_DIR, slug);
  const imgDir = join(dir, 'images');
  await mkdir(imgDir, { recursive: true });

  console.log(`\n🔍 Scraping: ${name} → sources/${slug}/\n`);

  // 1. MAL search
  const meta = { name, slug, type: 'unknown', genres: [], rating: null, synopsis: '' };
  console.log('📡 Searching MyAnimeList...');
  try {
    const malResults = await searchMAL(name);
    if (malResults.length > 0) {
      const best = malResults[0];
      meta.malId = best.malId;
      meta.type = best.type?.toLowerCase() || 'anime';
      meta.genres = best.genres;
      meta.rating = best.score;
      meta.synopsis = best.synopsis;
      meta.titleJa = best.titleJa;
      meta.imageUrl = best.imageUrl;
      console.log(`   Found: ${best.title} (score: ${best.score})`);

      // Get characters from MAL
      console.log('📡 Fetching MAL characters...');
      const malChars = await getMALCharacters(best.malId);
      const detailedChars = [];
      for (const mc of malChars.slice(0, 15)) {
        if (mc.malId) {
          const detail = await getMALCharacterDetail(mc.malId);
          if (detail) {
            detailedChars.push({ ...detail, role: mc.role });
            // Download character image
            if (detail.imageUrl) {
              try {
                const ext = detail.imageUrl.includes('.png') ? '.png' : '.jpg';
                await downloadImage(detail.imageUrl, join(imgDir, `${slugify(detail.name)}${ext}`));
              } catch (e) { console.warn(`   Image download failed: ${detail.name}`); }
            }
          }
        }
      }
      await saveJSON(dir, 'mal-characters.json', detailedChars);
      console.log(`   Characters: ${detailedChars.length}`);
    }
  } catch (e) { console.warn('MAL failed:', e.message); }

  // 2. Bangumi search
  console.log('📡 Searching Bangumi...');
  try {
    const bangumiResults = await searchBangumi(name);
    if (bangumiResults.length > 0) {
      const best = bangumiResults[0];
      meta.bangumiId = best.bangumiId;
      if (!meta.synopsis) meta.synopsis = best.summary;
      if (!meta.rating) meta.rating = best.score;

      const bgmChars = await getBangumiCharacters(best.bangumiId);
      await saveJSON(dir, 'bangumi-characters.json', bgmChars);
      console.log(`   Found: ${best.titleCn || best.title} (score: ${best.score})`);
    }
  } catch (e) { console.warn('Bangumi failed:', e.message); }

  // 3. 萌娘百科
  console.log('📡 Searching 萌娘百科...');
  try {
    const moeResults = await searchMoegirl(name);
    if (moeResults.length > 0) {
      const worldData = await extractWorldSetting(moeResults[0].title);
      if (worldData) {
        await saveJSON(dir, 'moegirl-world.json', worldData);
        console.log(`   World data extracted: ${Object.keys(worldData.sections).length} sections`);
      }

      const charData = await extractCharacters(moeResults[0].title);
      if (charData.length > 0) {
        await saveJSON(dir, 'moegirl-characters.json', charData);
        console.log(`   Characters extracted: ${charData.length}`);
      }
    }
  } catch (e) { console.warn('Moegirl failed:', e.message); }

  // Save meta
  await saveJSON(dir, 'meta.json', meta);

  console.log(`\n✅ Scraping complete for "${name}"`);
  console.log(`   Output: sources/${slug}/`);
}

// CLI
const args = process.argv.slice(2);

if (args[0] === '--from-queue') {
  const count = parseInt(args[1]) || 5;
  const queuePath = join(import.meta.dirname, '../../queue/pending.json');
  try {
    const queue = JSON.parse(await readFile(queuePath, 'utf-8'));
    const batch = queue.slice(0, count);
    console.log(`Processing ${batch.length} IPs from queue...`);
    for (const item of batch) {
      await scrapeIP(item.name);
    }
  } catch (e) {
    console.error('Failed to read queue:', e.message);
  }
} else if (args.length > 0) {
  const ipName = args.join(' ');
  await scrapeIP(ipName);
} else {
  console.log('Usage:');
  console.log('  node scrape.js "火影忍者"        — scrape specific IP');
  console.log('  node scrape.js --from-queue 5    — scrape next 5 from queue');
}
```

**Step 2: Test with a real IP**

```bash
cd scripts/card-gen && node scrape.js "進撃の巨人"
```

Expected: creates `sources/進撃の巨人/` with meta.json, character files, images

**Step 3: Commit**

```bash
git add scripts/card-gen/scrape.js
git commit -m "feat: add material scraping script with multi-source aggregation"
```

---

### Task 7: Extract templates from existing sample cards

**Files:**
- Create: `scripts/card-gen/templates/simple-char.json`
- Create: `scripts/card-gen/templates/rich-char.json`
- Create: `scripts/card-gen/templates/scenario.json`
- Create: `scripts/card-gen/templates/vn-frontend.json`
- Create: `scripts/card-gen/templates/README.md`

**Step 1: Create template files**

Extract structural patterns from the existing sample cards (壺中の毒, 桜色の季節) and the NIAH world. Templates are NOT filled-in cards — they are structural skeletons with comments explaining what each section should contain. Claude Code reads these to understand the expected format when generating cards.

The README explains each template's purpose and when to use which.

**Step 2: Commit**

```bash
git add scripts/card-gen/templates/
git commit -m "feat: add card generation templates extracted from sample cards"
```

---

### Task 8: Create schema reference document

**Files:**
- Create: `scripts/card-gen/schemas/world-schema-reference.md`

**Step 1: Extract complete field reference from engine types**

Read `packages/engine/src/types/index.ts`, `packages/engine/src/world/schema.ts`, and `packages/engine/src/types/components.ts` to produce a concise reference doc that Claude Code can read when generating cards. Include all valid values for enums, all required vs optional fields, and examples.

**Step 2: Commit**

```bash
git add scripts/card-gen/schemas/
git commit -m "docs: add WorldDefinition schema reference for card generation"
```

---

### Task 9: Integration test — full pipeline dry run

**Step 1: Run discovery**

```bash
cd scripts/card-gen && node discover.js
```

Verify: `queue/pending.json` has entries

**Step 2: Run scrape on one IP**

```bash
node scrape.js "鬼滅の刃"
```

Verify: `sources/鬼滅の刃/` has meta.json + character files

**Step 3: Verify Claude Code can read the output**

Read the scraped files and templates, generate one simple character card manually to verify the full flow works end-to-end.

**Step 4: Commit any fixes**

---

### Task 10: Add convenience scripts to root package.json

**Files:**
- Modify: `package.json` (root)

**Step 1: Add scripts**

```json
{
  "scripts": {
    "card:discover": "node scripts/card-gen/discover.js",
    "card:scrape": "node scripts/card-gen/scrape.js"
  }
}
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "feat: add card pipeline convenience scripts to root package.json"
```

---

## Summary

| Task | What | Est. Time |
|------|------|-----------|
| 1 | Scaffold directory + deps | 3 min |
| 2 | HTTP utility with rate limiting | 5 min |
| 3 | Moegirl + Fandom scrapers | 10 min |
| 4 | MAL + Bangumi scrapers | 8 min |
| 5 | discover.js | 8 min |
| 6 | scrape.js | 10 min |
| 7 | Extract templates from samples | 15 min |
| 8 | Schema reference doc | 10 min |
| 9 | Integration test | 10 min |
| 10 | Convenience scripts | 2 min |
| **Total** | | **~80 min** |
