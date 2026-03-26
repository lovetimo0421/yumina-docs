# Scraping Pipeline v2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the card-gen scraping pipeline with new data sources (Wikipedia, AniList, VNDB), integrate the unused Fandom scraper, add smart search matching, auto character detail fetching, and cross-source character merging.

**Architecture:** Keep the existing modular pattern (`lib/scrapers/*.js` + orchestrator `scrape.js`). Add 3 new scraper modules, 2 new utility modules (`search.js`, `merge.js`), enhance 2 existing scrapers, and rewrite the orchestrator to use all of them. All modules are ESM, use the shared `http.js` for caching/rate-limiting.

**Tech Stack:** Node.js ESM, cheerio (HTML parsing), existing `lib/http.js` (cached fetch with rate limit), external APIs: Jikan v4, Bangumi v0, MediaWiki API, AniList GraphQL, VNDB REST.

---

### Task 1: Wikipedia scraper (`lib/scrapers/wikipedia.js`)

**Files:**
- Create: `scripts/card-gen/lib/scrapers/wikipedia.js`

**Context:** MediaWiki API works the same way as moegirl (both are MediaWiki). We want both Chinese and English Wikipedia. Main use: plot summaries, setting descriptions, character lists for non-anime IPs and supplementary lore.

**Step 1: Create `wikipedia.js`**

```js
// scripts/card-gen/lib/scrapers/wikipedia.js
// Wikipedia scraper — Chinese + English, MediaWiki API.

import * as cheerio from 'cheerio';
import { fetchWithDelay } from '../http.js';

const WIKIS = {
  zh: { api: 'https://zh.wikipedia.org/w/api.php', base: 'https://zh.wikipedia.org' },
  en: { api: 'https://en.wikipedia.org/w/api.php', base: 'https://en.wikipedia.org' },
};

const DELAY = 500;

/**
 * Search Wikipedia.
 * @param {string} query
 * @param {'zh'|'en'} lang
 * @returns {Promise<Array<{title: string, description: string, url: string}>>}
 */
export async function searchWikipedia(query, lang = 'zh') {
  const wiki = WIKIS[lang];
  const params = new URLSearchParams({
    action: 'opensearch',
    search: query,
    limit: '10',
    namespace: '0',
    format: 'json',
  });
  const url = `${wiki.api}?${params}`;
  const data = await fetchWithDelay(url, { responseType: 'json', delayMs: DELAY });
  const [, titles = [], descriptions = [], urls = []] = data;
  return titles.map((title, i) => ({
    title,
    description: descriptions[i] || '',
    url: urls[i] || `${wiki.base}/wiki/${encodeURIComponent(title)}`,
  }));
}

/**
 * Get parsed page content via MediaWiki parse API.
 * @param {string} title - Exact page title
 * @param {'zh'|'en'} lang
 * @returns {Promise<{title: string, sections: Record<string, string>, categories: string[]}>}
 */
export async function getWikipediaPage(title, lang = 'zh') {
  const wiki = WIKIS[lang];
  const params = new URLSearchParams({
    action: 'parse',
    page: title,
    prop: 'text|categories',
    format: 'json',
    redirects: '1',
    disabletoc: '1',
  });
  const url = `${wiki.api}?${params}`;

  let html, categories;
  try {
    const json = await fetchWithDelay(url, { responseType: 'json', delayMs: DELAY });
    html = json.parse?.text?.['*'] || '';
    categories = (json.parse?.categories || []).map((c) => c['*'] || c.title || '');
  } catch {
    // Fallback: direct page scrape (some wikis block parse API)
    const pageUrl = `${wiki.base}/wiki/${encodeURIComponent(title)}`;
    const rawHtml = await fetchWithDelay(pageUrl, { responseType: 'text', delayMs: DELAY * 2 });
    const $page = cheerio.load(rawHtml);
    html = $page('.mw-parser-output').html() || '';
    categories = [];
    $page('#mw-normal-catlinks li a').each((_, el) => {
      categories.push($page(el).text().trim());
    });
  }

  const $ = cheerio.load(html);

  // Clean noise
  $('sup.reference, .reference, .reflist, .navbox, .mw-editsection, style, script').remove();
  $('[style*="display:none"]').remove();

  // Parse sections
  const sections = {};
  const children = $('body > *');
  let currentHeading = 'Introduction';
  let currentContent = [];

  children.each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    const $el = $(el);

    // Detect headings (direct or wrapped in div.mw-heading)
    let headingText = null;
    if (/^h[2-4]$/.test(tag)) {
      headingText = $el.text().trim();
    } else if (tag === 'div') {
      const innerH = $el.children('h2, h3, h4').first();
      if (innerH.length) headingText = innerH.text().trim();
    }

    if (headingText) {
      if (currentContent.length > 0) {
        sections[currentHeading] = (sections[currentHeading] || '') +
          (sections[currentHeading] ? '\n' : '') + currentContent.join('\n');
      }
      currentHeading = headingText;
      currentContent = [];
    } else {
      const text = $el.text().trim();
      if (text) currentContent.push(text);
    }
  });

  // Flush last section
  if (currentContent.length > 0) {
    sections[currentHeading] = (sections[currentHeading] || '') +
      (sections[currentHeading] ? '\n' : '') + currentContent.join('\n');
  }

  // Remove low-value sections
  const skipSections = /^(References|External links|See also|Notes|参考资料|外部链接|参见|注释|脚注)$/i;
  for (const key of Object.keys(sections)) {
    if (skipSections.test(key)) delete sections[key];
  }

  return { title, sections, categories };
}

/**
 * Convenience: search + get best page.
 * @param {string} query
 * @param {'zh'|'en'} lang
 * @returns {Promise<{title: string, sections: Record<string, string>, categories: string[]} | null>}
 */
export async function searchAndGetPage(query, lang = 'zh') {
  const results = await searchWikipedia(query, lang);
  if (results.length === 0) return null;
  return getWikipediaPage(results[0].title, lang);
}
```

**Step 2: Smoke test**

```bash
cd scripts/card-gen && node -e "
import { searchWikipedia, getWikipediaPage } from './lib/scrapers/wikipedia.js';
const r = await searchWikipedia('进击的巨人', 'zh');
console.log('Search results:', r.length);
if (r.length > 0) {
  const page = await getWikipediaPage(r[0].title, 'zh');
  console.log('Sections:', Object.keys(page.sections));
}
"
```

Expected: prints section headings from the Chinese Wikipedia article.

**Step 3: Commit**

```bash
git add scripts/card-gen/lib/scrapers/wikipedia.js
git commit -m "feat(card-gen): add Wikipedia scraper (zh + en)"
```

---

### Task 2: AniList scraper (`lib/scrapers/anilist.js`)

**Files:**
- Create: `scripts/card-gen/lib/scrapers/anilist.js`

**Context:** AniList has a free GraphQL API at `https://graphql.anilist.co`. No auth needed. Provides structured tags, genres, relations (sequels/prequels), recommendations, and character data with descriptions. Much better structured metadata than MAL.

**Step 1: Create `anilist.js`**

```js
// scripts/card-gen/lib/scrapers/anilist.js
// AniList scraper — GraphQL API, no auth required.

import { fetchWithDelay } from '../http.js';

const ENDPOINT = 'https://graphql.anilist.co';
const DELAY = 700;

/**
 * Execute an AniList GraphQL query.
 */
async function gql(query, variables = {}) {
  const cacheKey = ENDPOINT + '?' + JSON.stringify({ query: query.replace(/\s+/g, ' ').trim(), variables });
  const res = await fetchWithDelay(cacheKey, {
    delayMs: DELAY,
    responseType: 'json',
    // fetchWithDelay uses GET by default; we need POST for GraphQL.
    // We'll handle this by using fetch directly with caching wrapper.
  });
  return res;
}

/**
 * Low-level POST to AniList GraphQL with caching.
 * We bypass fetchWithDelay's GET-only design and implement our own cache check.
 */
async function anilistQuery(query, variables = {}) {
  const body = JSON.stringify({ query: query.replace(/\s+/g, ' ').trim(), variables });

  // Use fetchWithDelay for caching — encode the query as a fake URL
  const fakeUrl = `${ENDPOINT}?q=${encodeURIComponent(body)}`;

  // Try cache first via http.js infrastructure
  try {
    const cached = await fetchWithDelay(fakeUrl, { delayMs: 0, responseType: 'json', useCache: true });
    if (cached?.data) return cached;
  } catch {
    // Cache miss or stale, proceed to fetch
  }

  // Rate limit
  await new Promise((r) => setTimeout(r, DELAY));

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
  });

  if (!res.ok) throw new Error(`AniList HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`AniList: ${json.errors[0]?.message}`);
  return json;
}

/**
 * Search for anime/manga on AniList.
 * @param {string} query - Search term
 * @param {'ANIME'|'MANGA'} type
 * @returns {Promise<Array<{anilistId, title, titleRomaji, titleEnglish, titleNative, format, score, genres, tags, synopsis, coverImage, siteUrl}>>}
 */
export async function searchAniList(query, type = 'ANIME') {
  const gqlQuery = `
    query ($search: String, $type: MediaType) {
      Page(perPage: 10) {
        media(search: $search, type: $type, sort: SEARCH_MATCH) {
          id
          title { romaji english native }
          format
          averageScore
          genres
          tags { name rank }
          description(asHtml: false)
          coverImage { large }
          siteUrl
          relations { edges { relationType node { id title { romaji } format } } }
          recommendations(sort: RATING_DESC, perPage: 5) { nodes { mediaRecommendation { id title { romaji } format } } }
        }
      }
    }
  `;

  const json = await anilistQuery(gqlQuery, { search: query, type });
  const media = json.data?.Page?.media || [];

  return media.map((m) => ({
    anilistId: m.id,
    title: m.title?.romaji || '',
    titleRomaji: m.title?.romaji || null,
    titleEnglish: m.title?.english || null,
    titleNative: m.title?.native || null,
    format: m.format || null,
    score: m.averageScore ? m.averageScore / 10 : null, // Normalize to 0-10
    genres: m.genres || [],
    tags: (m.tags || []).filter((t) => t.rank >= 60).map((t) => t.name),
    synopsis: m.description || null,
    coverImage: m.coverImage?.large || null,
    siteUrl: m.siteUrl || null,
    relations: (m.relations?.edges || []).map((e) => ({
      type: e.relationType,
      id: e.node.id,
      title: e.node.title?.romaji,
      format: e.node.format,
    })),
    recommendations: (m.recommendations?.nodes || [])
      .filter((n) => n.mediaRecommendation)
      .map((n) => ({
        id: n.mediaRecommendation.id,
        title: n.mediaRecommendation.title?.romaji,
        format: n.mediaRecommendation.format,
      })),
  }));
}

/**
 * Get characters for an AniList media entry.
 * @param {number} mediaId - AniList media ID
 * @returns {Promise<Array<{anilistId, name, nameNative, role, description, imageUrl}>>}
 */
export async function getAniListCharacters(mediaId) {
  const gqlQuery = `
    query ($id: Int) {
      Media(id: $id) {
        characters(sort: [ROLE, RELEVANCE], perPage: 25) {
          edges {
            role
            node {
              id
              name { full native }
              description(asHtml: false)
              image { large }
            }
          }
        }
      }
    }
  `;

  const json = await anilistQuery(gqlQuery, { id: mediaId });
  const edges = json.data?.Media?.characters?.edges || [];

  return edges.map((e) => ({
    anilistId: e.node.id,
    name: e.node.name?.full || '',
    nameNative: e.node.name?.native || null,
    role: e.role || null,
    description: e.node.description || null,
    imageUrl: e.node.image?.large || null,
  }));
}
```

**Step 2: Smoke test**

```bash
cd scripts/card-gen && node -e "
import { searchAniList, getAniListCharacters } from './lib/scrapers/anilist.js';
const r = await searchAniList('Attack on Titan');
console.log('Found:', r[0]?.title, 'score:', r[0]?.score, 'tags:', r[0]?.tags?.slice(0,5));
if (r[0]) {
  const chars = await getAniListCharacters(r[0].anilistId);
  console.log('Characters:', chars.slice(0,3).map(c => c.name + ' (' + c.role + ')'));
}
"
```

**Step 3: Commit**

```bash
git add scripts/card-gen/lib/scrapers/anilist.js
git commit -m "feat(card-gen): add AniList GraphQL scraper"
```

---

### Task 3: VNDB scraper (`lib/scrapers/vndb.js`)

**Files:**
- Create: `scripts/card-gen/lib/scrapers/vndb.js`

**Context:** VNDB REST API at `https://api.vndb.org/kana`. POST-based with JSON filter syntax. No auth for public data. Only used when IP is detected as a visual novel.

**Step 1: Create `vndb.js`**

```js
// scripts/card-gen/lib/scrapers/vndb.js
// VNDB scraper — REST API for visual novel IPs.

const ENDPOINT = 'https://api.vndb.org/kana';
const DELAY = 500;

let lastRequestTime = 0;

/**
 * POST to VNDB API with rate limiting.
 */
async function vndbPost(path, body) {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < DELAY) await new Promise((r) => setTimeout(r, DELAY - elapsed));

  lastRequestTime = Date.now();
  const res = await fetch(`${ENDPOINT}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`VNDB HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Search for visual novels.
 * @param {string} query
 * @returns {Promise<Array<{vndbId, title, titleOriginal, released, rating, length, description, imageUrl, tags}>>}
 */
export async function searchVNDB(query) {
  const data = await vndbPost('/vn', {
    filters: ['search', '=', query],
    fields: 'id, title, alttitle, released, rating, length, description, image.url, tags.name, tags.rating',
    sort: 'searchrank',
    results: 10,
  });

  return (data.results || []).map((vn) => ({
    vndbId: vn.id,
    title: vn.title || '',
    titleOriginal: vn.alttitle || null,
    released: vn.released || null,
    rating: vn.rating ? Math.round(vn.rating) / 10 : null, // 0-100 → 0-10
    length: vn.length ?? null, // 1-5 scale
    description: vn.description || null,
    imageUrl: vn.image?.url || null,
    tags: (vn.tags || [])
      .filter((t) => t.rating >= 2)
      .map((t) => t.name),
  }));
}

/**
 * Get characters for a visual novel.
 * @param {string} vnId - VNDB VN ID (e.g. "v17")
 * @returns {Promise<Array<{vndbId, name, nameOriginal, role, description, traits, imageUrl}>>}
 */
export async function getVNDBCharacters(vnId) {
  const data = await vndbPost('/character', {
    filters: ['vn', '=', ['id', '=', vnId]],
    fields: 'id, name, original, description, image.url, traits.name, traits.group_name, vns.role',
    results: 25,
  });

  return (data.results || []).map((ch) => ({
    vndbId: ch.id,
    name: ch.name || '',
    nameOriginal: ch.original || null,
    role: ch.vns?.[0]?.role || null,
    description: ch.description || null,
    traits: (ch.traits || []).map((t) => `${t.group_name}: ${t.name}`),
    imageUrl: ch.image?.url || null,
  }));
}
```

**Step 2: Smoke test**

```bash
cd scripts/card-gen && node -e "
import { searchVNDB, getVNDBCharacters } from './lib/scrapers/vndb.js';
const r = await searchVNDB('Steins;Gate');
console.log('Found:', r[0]?.title, 'rating:', r[0]?.rating);
if (r[0]) {
  const chars = await getVNDBCharacters(r[0].vndbId);
  console.log('Characters:', chars.slice(0,3).map(c => c.name + ' (' + c.role + ')'));
}
"
```

**Step 3: Commit**

```bash
git add scripts/card-gen/lib/scrapers/vndb.js
git commit -m "feat(card-gen): add VNDB scraper for visual novel IPs"
```

---

### Task 4: Smart search module (`lib/search.js`)

**Files:**
- Create: `scripts/card-gen/lib/search.js`

**Context:** Current scrape.js blindly takes `searchResults[0]` which often mismatches (e.g. Naruto → "ROAD OF NARUTO PV" on Bangumi). Smart search tries multiple query variants and scores results by title similarity + type + popularity.

**Step 1: Create `search.js`**

```js
// scripts/card-gen/lib/search.js
// Smart search: multi-query, result scoring, best-match selection.

/**
 * Compute simple normalized similarity between two strings.
 * Uses longest common subsequence ratio.
 */
export function titleSimilarity(a, b) {
  if (!a || !b) return 0;
  const la = a.toLowerCase().trim();
  const lb = b.toLowerCase().trim();
  if (la === lb) return 1;

  // LCS length
  const m = la.length;
  const n = lb.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = la[i - 1] === lb[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const lcs = dp[m][n];
  return (2 * lcs) / (m + n);
}

/**
 * Generate query variants from a name.
 * Returns an array of unique queries to try, in priority order.
 * @param {string} name - Primary name
 * @param {Record<string, string>} [knownTitles] - Known alternate titles from earlier sources
 *   e.g. { en: "Attack on Titan", ja: "進撃の巨人", cn: "进击的巨人" }
 * @returns {string[]}
 */
export function generateQueryVariants(name, knownTitles = {}) {
  const variants = new Set();
  variants.add(name);

  // Add known alternate titles
  for (const t of Object.values(knownTitles)) {
    if (t) variants.add(t);
  }

  return [...variants];
}

/**
 * Score a search result against expected criteria.
 * @param {object} result - Must have at minimum { title: string }
 * @param {string} query - The query that produced this result
 * @param {object} [hints] - Optional hints: { expectedType, knownTitles }
 * @returns {number} 0-1 score
 */
export function scoreResult(result, query, hints = {}) {
  const { expectedType, knownTitles = {} } = hints;

  // Title similarity (against query + all known titles)
  const allTargets = [query, ...Object.values(knownTitles)].filter(Boolean);
  const resultTitles = [
    result.title,
    result.titleJa, result.titleCn, result.titleEnglish,
    result.titleRomaji, result.titleNative, result.titleOriginal,
    result.name, result.nameEn,
  ].filter(Boolean);

  let bestSimilarity = 0;
  for (const target of allTargets) {
    for (const rt of resultTitles) {
      bestSimilarity = Math.max(bestSimilarity, titleSimilarity(target, rt));
    }
  }

  // Type match bonus
  let typeScore = 0.5; // neutral if no expectedType
  if (expectedType && result.type) {
    const rt = String(result.type).toLowerCase();
    const et = expectedType.toLowerCase();
    typeScore = rt.includes(et) || et.includes(rt) ? 1 : 0.2;
  }

  // Popularity (normalize score to 0-1, assume max 10)
  const rawScore = result.score ?? result.bangumiScore ?? result.rating ?? 0;
  const popScore = Math.min(rawScore / 10, 1);

  return bestSimilarity * 0.55 + typeScore * 0.25 + popScore * 0.2;
}

/**
 * Pick the best result from a list of search results.
 * @param {Array} results
 * @param {string} query
 * @param {object} [hints]
 * @returns {{ best: object|null, score: number }}
 */
export function pickBest(results, query, hints = {}) {
  if (!results || results.length === 0) return { best: null, score: 0 };

  let best = results[0];
  let bestScore = scoreResult(best, query, hints);

  for (let i = 1; i < results.length; i++) {
    const s = scoreResult(results[i], query, hints);
    if (s > bestScore) {
      best = results[i];
      bestScore = s;
    }
  }

  return { best, score: bestScore };
}

/**
 * Run a search function with multiple query variants, return the best overall result.
 * @param {Function} searchFn - async (query) => Array<results>
 * @param {string} name - Primary query
 * @param {Record<string, string>} [knownTitles]
 * @param {object} [hints]
 * @returns {Promise<{ best: object|null, score: number, query: string }>}
 */
export async function smartSearch(searchFn, name, knownTitles = {}, hints = {}) {
  const queries = generateQueryVariants(name, knownTitles);
  let overallBest = null;
  let overallScore = 0;
  let winningQuery = name;

  for (const query of queries) {
    try {
      const results = await searchFn(query);
      const { best, score } = pickBest(results, query, { ...hints, knownTitles });
      if (score > overallScore) {
        overallBest = best;
        overallScore = score;
        winningQuery = query;
      }
      // If we got a very good match, stop early
      if (overallScore > 0.85) break;
    } catch {
      // Source search failed for this query, try next
    }
  }

  return { best: overallBest, score: overallScore, query: winningQuery };
}
```

**Step 2: Quick test**

```bash
cd scripts/card-gen && node -e "
import { titleSimilarity, scoreResult, pickBest } from './lib/search.js';
console.log('exact:', titleSimilarity('Naruto', 'Naruto'));
console.log('close:', titleSimilarity('Naruto', 'Naruto Shippuden'));
console.log('diff:', titleSimilarity('Naruto', 'One Piece'));

const results = [
  { title: 'ROAD OF NARUTO PV', type: 'Special', score: 6.5 },
  { title: 'NARUTO -ナルト-', type: 'TV', score: 8.0 },
];
const { best } = pickBest(results, 'Naruto', { expectedType: 'TV' });
console.log('Best pick:', best.title); // Should be NARUTO -ナルト-
"
```

**Step 3: Commit**

```bash
git add scripts/card-gen/lib/search.js
git commit -m "feat(card-gen): add smart search with multi-query + scoring"
```

---

### Task 5: Character merge module (`lib/merge.js`)

**Files:**
- Create: `scripts/card-gen/lib/merge.js`

**Context:** Characters from different sources use different names (MAL: "Uzumaki, Naruto", Bangumi: "うずまきナルト", Moegirl: "漩涡鸣人"). We need to fuzzy-match and merge them into unified records.

**Step 1: Create `merge.js`**

```js
// scripts/card-gen/lib/merge.js
// Cross-source character merging with fuzzy name matching.

import { titleSimilarity } from './search.js';

/**
 * Normalize a character name for matching.
 * Handles "Last, First" → "First Last", trims whitespace, lowercases.
 */
function normalizeName(name) {
  if (!name) return '';
  let n = name.trim();
  // MAL format: "Last, First" → "First Last"
  if (/^[^,]+,\s+[^,]+$/.test(n)) {
    const [last, first] = n.split(',').map((s) => s.trim());
    n = `${first} ${last}`;
  }
  return n.toLowerCase();
}

/**
 * Check if two character names likely refer to the same person.
 * Uses exact match, contains check, and similarity threshold.
 */
function namesMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;

  // Exact match
  if (na === nb) return true;

  // One contains the other (handles "Naruto" vs "Uzumaki Naruto")
  if (na.includes(nb) || nb.includes(na)) return true;

  // Similarity threshold
  return titleSimilarity(na, nb) > 0.7;
}

/**
 * Try to match a character against a list of known names.
 * Returns the index of the match, or -1 if no match found.
 */
function findMatch(charNames, existingGroups) {
  for (let i = 0; i < existingGroups.length; i++) {
    const group = existingGroups[i];
    for (const cn of charNames) {
      for (const gn of group.allNames) {
        if (namesMatch(cn, gn)) return i;
      }
    }
  }
  return -1;
}

/**
 * Determine role priority for sorting (Main > Supporting > Appears).
 */
function rolePriority(role) {
  if (!role) return 99;
  const r = role.toLowerCase();
  if (r === 'main' || r === '主角' || r === 'protagonist') return 1;
  if (r === 'supporting' || r === '配角') return 2;
  if (r === 'appears' || r === 'background') return 3;
  return 50;
}

/**
 * Merge characters from multiple sources into unified records.
 *
 * @param {object} sourceData - Keyed by source name, value is array of characters.
 *   Each character should have at minimum: { name: string }
 *   Optional fields picked up: nameKanji, nameNative, nameOriginal, role, about,
 *     description, imageUrl, portraitUrl, infoboxData/infobox, traits, etc.
 * @returns {Array<{
 *   name_cn: string|null,
 *   name_jp: string|null,
 *   name_en: string|null,
 *   role: string|null,
 *   about: string|null,
 *   personality: string|null,
 *   portrait_url: string|null,
 *   infobox: Record<string, string>,
 *   traits: string[],
 *   sources: string[],
 *   _raw: Record<string, object>
 * }>}
 */
export function mergeCharacters(sourceData) {
  const groups = []; // Array of { allNames: Set<string>, sources: Map<source, charData> }

  for (const [source, characters] of Object.entries(sourceData)) {
    if (!Array.isArray(characters)) continue;

    for (const char of characters) {
      if (!char || !char.name) continue;

      // Collect all name variants for this character
      const names = [
        char.name,
        char.nameKanji, char.nameNative, char.nameOriginal,
        char.nameCn, char.nameEn,
      ].filter(Boolean);

      const matchIdx = findMatch(names, groups);

      if (matchIdx >= 0) {
        // Merge into existing group
        groups[matchIdx].allNames = new Set([...groups[matchIdx].allNames, ...names.map(normalizeName)]);
        groups[matchIdx].sources.set(source, char);
      } else {
        // Create new group
        const group = {
          allNames: new Set(names.map(normalizeName)),
          sources: new Map([[source, char]]),
        };
        groups.push(group);
      }
    }
  }

  // Build merged records
  const merged = groups.map((group) => {
    const sources = Object.fromEntries(group.sources);
    const sourceNames = [...group.sources.keys()];

    // Pick best value for each field across sources (priority order)
    const mal = sources.mal;
    const bangumi = sources.bangumi;
    const moegirl = sources.moegirl;
    const anilist = sources.anilist;
    const vndb = sources.vndb;
    const fandom = sources.fandom;
    const wikipedia = sources.wikipedia;

    // Name resolution
    const name_cn = moegirl?.name || bangumi?.nameCn || null;
    const name_jp = mal?.nameKanji || bangumi?.name || anilist?.nameNative || vndb?.nameOriginal || null;
    const name_en = mal?.name || anilist?.name || fandom?.name || vndb?.name || null;

    // Role (prefer MAL/AniList which have Main/Supporting)
    const role = mal?.role || anilist?.role || bangumi?.relation || vndb?.role || null;

    // About/description (prefer longest)
    const aboutCandidates = [
      anilist?.description,
      mal?.about,
      moegirl?.content || moegirl?.description,
      fandom?.description,
      vndb?.description,
    ].filter(Boolean);
    const about = aboutCandidates.sort((a, b) => b.length - a.length)[0] || null;

    // Portrait URL
    const portrait_url =
      moegirl?.portraitUrl || moegirl?.imageUrl ||
      anilist?.imageUrl ||
      mal?.imageUrl ||
      vndb?.imageUrl ||
      null;

    // Infobox
    const infobox = moegirl?.infoboxData || moegirl?.infobox || fandom?.infobox || {};

    // Traits (VNDB-specific)
    const traits = vndb?.traits || [];

    return {
      name_cn,
      name_jp,
      name_en,
      role,
      about,
      portrait_url,
      infobox,
      traits,
      sources: sourceNames,
      _raw: sources,
    };
  });

  // Sort: Main characters first, then by source count (more sources = more important)
  merged.sort((a, b) => {
    const rp = rolePriority(a.role) - rolePriority(b.role);
    if (rp !== 0) return rp;
    return b.sources.length - a.sources.length;
  });

  return merged;
}
```

**Step 2: Quick test**

```bash
cd scripts/card-gen && node -e "
import { mergeCharacters } from './lib/merge.js';
const result = mergeCharacters({
  mal: [
    { name: 'Yeager, Eren', nameKanji: 'エレン・イェーガー', role: 'Main', about: 'The protagonist...' },
    { name: 'Ackerman, Mikasa', nameKanji: 'ミカサ・アッカーマン', role: 'Main' },
  ],
  bangumi: [
    { name: 'エレン・イェーガー', relation: '主角' },
    { name: 'ミカサ・アッカーマン', relation: '主角' },
  ],
  moegirl: [
    { name: '艾伦·耶格尔', portraitUrl: 'https://example.com/eren.jpg' },
  ],
});
console.log(JSON.stringify(result, null, 2));
"
```

Expected: Eren's record merges all 3 sources, has CN/JP/EN names, portrait from moegirl.

**Step 3: Commit**

```bash
git add scripts/card-gen/lib/merge.js
git commit -m "feat(card-gen): add cross-source character merging"
```

---

### Task 6: Enhance Bangumi scraper — add character detail

**Files:**
- Modify: `scripts/card-gen/lib/scrapers/bangumi.js`

**Context:** Current `getBangumiCharacters` only returns name/type/relation/imageUrl. Bangumi v0 API supports `/v0/characters/{id}` with full details including summary (personality/background). We add a `getBangumiCharacterDetail` function.

**Step 1: Add `getBangumiCharacterDetail` to `bangumi.js`**

Append after the existing `getBangumiCharacters` function:

```js
/**
 * Get detailed info for a single Bangumi character.
 * @param {number} charId - Bangumi character ID
 * @returns {Promise<{bangumiId: number, name: string, nameCn: string|null, summary: string|null, infobox: Array, imageUrl: string|null}>}
 */
export async function getBangumiCharacterDetail(charId) {
  const url = `${BASE}/v0/characters/${charId}`;
  const json = await fetchWithDelay(url, { delayMs: DELAY, responseType: 'json' });
  return {
    bangumiId: json.id ?? charId,
    name: json.name ?? null,
    nameCn: json.name_cn || null,
    summary: json.summary || null,
    infobox: json.infobox || [],
    imageUrl: json.images?.large ?? json.images?.grid ?? null,
  };
}
```

**Step 2: Smoke test**

```bash
cd scripts/card-gen && node -e "
import { searchBangumi, getBangumiCharacters, getBangumiCharacterDetail } from './lib/scrapers/bangumi.js';
const results = await searchBangumi('進撃の巨人');
if (results[0]) {
  const chars = await getBangumiCharacters(results[0].bangumiId);
  if (chars[0]?.bangumiId) {
    const detail = await getBangumiCharacterDetail(chars[0].bangumiId);
    console.log(detail.name, '|', detail.nameCn, '| summary length:', detail.summary?.length);
  }
}
"
```

**Step 3: Commit**

```bash
git add scripts/card-gen/lib/scrapers/bangumi.js
git commit -m "feat(card-gen): add Bangumi character detail fetching"
```

---

### Task 7: Rewrite `scrape.js` orchestrator

**Files:**
- Modify: `scripts/card-gen/scrape.js`

**Context:** This is the big integration task. The new scrape.js should:
1. Use smart search (multi-query, scoring) for all sources
2. Accumulate `knownTitles` across sources (so later sources benefit from earlier title discoveries)
3. Integrate Fandom as a source
4. Add Wikipedia (zh + en)
5. Add AniList
6. Add VNDB (only for VN-type IPs)
7. Auto-fetch character detail pages from moegirl (top N characters)
8. Auto-fetch Bangumi character details (top N)
9. Run character merge at the end, output `merged-characters.json`
10. Keep the existing queue processing logic

**Step 1: Rewrite `scrape.js`**

The full rewrite is large. Key structural changes:

```js
// New imports
import { searchAniList, getAniListCharacters } from './lib/scrapers/anilist.js';
import { searchVNDB, getVNDBCharacters } from './lib/scrapers/vndb.js';
import { searchWikipedia, getWikipediaPage } from './lib/scrapers/wikipedia.js';
import { searchFandom, getFandomPage } from './lib/scrapers/fandom.js';
import { smartSearch, generateQueryVariants } from './lib/search.js';
import { mergeCharacters } from './lib/merge.js';

// Accumulated known titles for smarter searching
const knownTitles = {}; // { en, ja, cn }

export async function scrapeIP(name) {
  // ... create dirs ...

  const knownTitles = {};
  const allCharacterData = {}; // For merge step

  // ── AniList (first — best structured, gives us title variants) ──
  // Use smartSearch with searchAniList
  // Store anilistId, tags, relations, recommendations
  // Extract title variants → knownTitles.en, knownTitles.ja

  // ── MAL (enhanced with smart search + knownTitles) ──
  // Smart search with knownTitles from AniList
  // Character details (existing logic, unchanged)
  // allCharacterData.mal = malCharacters

  // ── Bangumi (enhanced with smart search + character detail) ──
  // Smart search with knownTitles
  // Character list + detail for top 10
  // allCharacterData.bangumi = bangumiCharacters

  // ── 萌娘百科 (enhanced with auto character detail pages) ──
  // Smart search with knownTitles
  // World setting (existing)
  // Character sections (existing)
  // NEW: auto-fetch individual character pages for top 10 characters
  //   using extractCharacterPortrait() → portrait + infobox
  // allCharacterData.moegirl = moegirlCharacters

  // ── Wikipedia (NEW — zh + en) ──
  // Search zh first, then en
  // Save as wikipedia-zh.json and/or wikipedia-en.json

  // ── Fandom (NEW integration) ──
  // Search Fandom, get best wiki page
  // Save as fandom.json (sections + infobox + images)

  // ── VNDB (NEW — conditional) ──
  // Only if detected as VN (check AniList format, genres, or user hint)
  // Save as vndb.json + vndb-characters.json

  // ── Character Merge ──
  // mergeCharacters(allCharacterData) → merged-characters.json

  // ── Save meta ──
  // Enhanced meta with anilistId, tags, relations, all title variants
}
```

The full implementation should preserve the existing error handling pattern (warn and continue on source failure) and the queue processing logic.

**Step 2: Test with a known IP**

```bash
cd scripts/card-gen && node scrape.js "進撃の巨人"
```

Verify output:
```bash
ls sources/進撃の巨人/
# Should now include: anilist.json, wikipedia-zh.json, wikipedia-en.json,
# fandom.json (if found), merged-characters.json, plus all existing files
```

**Step 3: Test with a game IP**

```bash
cd scripts/card-gen && node scrape.js "原神"
```

Verify that VNDB is skipped (not a VN) and all other sources work.

**Step 4: Test with a VN IP**

```bash
cd scripts/card-gen && node scrape.js "Steins;Gate"
```

Verify that VNDB data is fetched.

**Step 5: Commit**

```bash
git add scripts/card-gen/scrape.js
git commit -m "feat(card-gen): integrate all sources + smart search + character merge"
```

---

### Task 8: Update pipeline documentation and memory

**Files:**
- Modify: `scripts/card-gen/card-writing-knowledge.md` (add note about merged-characters.json)
- Update memory: `project_card_gen_pipeline.md`

**Step 1: Update card-writing-knowledge.md**

Add a section noting that `merged-characters.json` is now the primary character reference when generating cards, and that individual source files still exist for deep-dive.

**Step 2: Update memory**

Update `project_card_gen_pipeline.md` to reflect:
- 7 data sources (MAL, Bangumi, 萌娘百科, Fandom, Wikipedia, AniList, VNDB)
- Smart search instead of blind [0]
- `merged-characters.json` as primary character reference
- Auto character detail fetching

**Step 3: Commit**

```bash
git add scripts/card-gen/card-writing-knowledge.md
git commit -m "docs(card-gen): update knowledge base for pipeline v2"
```

---

## Execution Order

Tasks 1-3 (new scrapers) are fully independent → **can be parallelized**.
Task 4 (search.js) is independent → **can parallel with 1-3**.
Task 5 (merge.js) depends on Task 4 (imports `titleSimilarity`).
Task 6 (bangumi enhancement) is independent → **can parallel with 1-4**.
Task 7 (scrape.js rewrite) depends on ALL of 1-6.
Task 8 (docs) depends on 7.

```
Parallel batch 1: Tasks 1, 2, 3, 4, 6
Sequential: Task 5 (after 4)
Sequential: Task 7 (after all above)
Sequential: Task 8 (after 7)
```
