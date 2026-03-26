# Card Generation Pipeline Design

**Date:** 2026-03-13
**Approach:** Option A — Claude Code driven semi-automated pipeline

## Problem

Yumina needs a steady stream of high-quality cards (worlds) across all complexity levels to grow its community. Creating cards manually is slow. We need a pipeline that automates discovery, scraping, and generation while keeping creative quality high.

## Architecture

```
scripts/card-gen/          — Pipeline tooling
  discover.js              — IP discovery (crawl rankings → queue)
  scrape.js                — Material scraping (wiki/MAL → sources/)
  lib/
    scrapers/
      moegirl.js           — 萌娘百科 scraper
      fandom.js            — Fandom Wiki scraper
      mal.js               — MyAnimeList scraper
      narou.js             — なろう scraper
      douban.js            — 豆瓣 scraper
      bangumi.js           — Bangumi scraper
      pixiv.js             — Pixiv novel scraper (needs cookie)
      asmr.js              — asmr.one scraper (needs cookie)
      chub.js              — chub.ai reference scraper (inspiration only)
    utils.js               — Shared utilities (HTTP, rate limiting, text cleaning)
  templates/               — Sample card templates extracted from existing cards
    simple-char.json
    rich-char.json
    scenario.json
    vn-frontend.json
  .env                     — Optional cookies/keys

sources/                   — Scraped materials (gitignored)
  {ip-slug}/
    characters.json
    world.json
    plot.json
    images/

queue/
  pending.json             — Discovered IPs to process
  completed.json           — Processed IPs log

output/                    — Generated cards (gitignored)
  {ip-slug}/
    {ip}-simple-{char}.json
    {ip}-rich-{char}.json
    {ip}-scenario-{name}.json
    {ip}-vn-{name}.json
```

## Module 1: IP Discovery (discover.js)

### Sources (all public, no login required)
- MyAnimeList: seasonal rankings, all-time top, trending
- 萌娘百科: recent updates, popular pages
- なろう: weekly/monthly novel rankings
- 豆瓣读书/Bangumi: book/anime rankings
- Fandom Wiki: popular communities

### Output
`queue/pending.json` — array of:
```json
{
  "name": "葬送的芙莉莲",
  "slug": "frieren",
  "source": "MAL seasonal top 10",
  "type": "anime",
  "score": 8.9,
  "refs": ["https://myanimelist.net/anime/..."],
  "discoveredAt": "2026-03-13"
}
```

### Dedup
Compare against `completed.json` to skip already-processed IPs.

## Module 2: Material Scraping (scrape.js)

### Usage
```bash
node scripts/card-gen/scrape.js "火影忍者"
node scripts/card-gen/scrape.js --from-queue 5   # process next 5 from queue
```

### Scrape Flow
1. Search 萌娘百科 → Fandom Wiki for IP main page
2. Extract: world setting, character list (name, appearance, personality, relationships), plot summary
3. Supplement from MAL/Bangumi: genre tags, rating, synopsis
4. Download character images + scene images from wiki (public domain)
5. Save to `sources/{ip-slug}/`

### Output Format
```
sources/naruto/
  meta.json         — { name, type, genres, rating, synopsis }
  characters.json   — [{ name, jaName, appearance, personality, abilities, relationships }]
  world.json        — { setting, factions, powerSystem, geography }
  plot.json         — { arcs: [{ name, summary, keyEvents }] }
  images/           — downloaded images
```

### Rate Limiting
- 1-2 second delay between requests
- Respect robots.txt
- Cache responses to avoid re-scraping

## Module 3: Card Generation (Claude Code)

This is NOT a script — it's what Claude Code does when the user requests it.

### Trigger Phrases
- "用 sources/naruto/ 生成火影全套卡"
- "从队列里挑5个IP生成卡"
- "自己找10个有意思的IP生成卡"

### Generation Strategy
For each IP, Claude Code:
1. Reads all material in `sources/{ip}/`
2. Reads templates in `templates/` for structural reference
3. Determines which cards to generate based on IP characteristics
4. Generates cards following Yumina WorldDefinition v13 schema
5. Writes JSON files to `output/{ip}/`

### Card Types & When to Generate

| Level | When | Content |
|-------|------|---------|
| Simple char | Every named character with enough info | 1 system entry + 1 char entry + 1 greeting |
| Rich char | Top 2-3 most important characters | Multiple entries + lorebook + variables + rules |
| Scenario | When IP has a distinctive story premise | Multi-character + game mechanics + multiple greetings |
| VN frontend | When IP suits visual novel format | Custom TSX + backgrounds + segments + choices |

### Quality Standards
- All content in Chinese (日本語 proper nouns preserved)
- Character depth matching 壺中の毒 and 桜色の季節 quality level
- Valid WorldDefinition v13 JSON
- VN cards include working TSX component code
- Multiple greeting options for variety

### Parallelization
- Simple character cards: generated via subagents in parallel (5-8 simultaneously)
- Complex cards: generated sequentially for quality

## Module 4: Image Handling

### Priority Order
1. Wiki/public images (free, immediate)
2. Gradient color fallbacks for VN backgrounds (like 桜色の季節)
3. AI-generated images via free APIs (when needed)

### For VN Cards
Background scenes defined in TSX with:
- `@asset:` references if images available
- Gradient CSS fallbacks always included
- Label text for scene identification

## User Workflow

### First-Time Setup (~5 min)
```bash
cd scripts/card-gen
pnpm install
# Optional: configure .env with pixiv/asmr cookies
```

### Daily Usage
```bash
# 1. Discover new IPs (optional, can run periodically)
node scripts/card-gen/discover.js

# 2. Scrape specific IP
node scripts/card-gen/scrape.js "火影忍者"

# 3. Open Claude Code in yumina/ root, say:
#    "生成火影全套卡"
#    or "从队列挑5个IP生成卡"

# 4. Review output/ folder
# 5. Import into Yumina
```

### Expected Output Per IP
- Simple character cards: 5-8 (1-2 min each, parallelizable)
- Rich character cards: 2-3 (3-5 min each)
- Scenario cards: 1-2 (5-10 min each)
- VN frontend cards: 0-1 (10-15 min)
- Total: ~10-14 cards in 40-60 min per IP

## Technical Decisions

- **Node.js** for scripts (consistent with Yumina stack)
- **Cheerio** for HTML parsing (lightweight, no browser needed)
- **undici/fetch** for HTTP requests
- **Rate limiting** built into all scrapers
- **No database** — flat JSON files for simplicity
- **gitignore** sources/ and output/ (large files, not code)

## Constraints & Rules

- chub.ai content is **reference only** — never copy card content directly
- Respect website terms of service and rate limits
- Famous IP content based on publicly available wiki/fan information
- No copyrighted full-text novels stored (only summaries and character data)
- All generated content is original creative work inspired by source material
