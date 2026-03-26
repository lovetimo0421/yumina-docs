# Gacha Game Character Cards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate 6 rich-char cards for 3 gacha games (Genshin Impact, Honkai Star Rail, Blue Archive), each with innovative game-UI-style messageRenderers and character art from Moegirl Wiki.

**Architecture:** Enhance moegirl scraper to extract character portrait URLs from infobox HTML. Scrape 3 game IPs. Generate rich-char JSON cards with game-authentic messageRenderers that use character images inline. Each game gets a fundamentally different UI paradigm (not just theme colors).

**Tech Stack:** Node.js scrapers (cheerio), Yumina WorldDefinition v13 JSON, React TSX messageRenderers (Tailwind + CSS animations), Moegirl Wiki HTML scraping

---

## Game + Character Matrix

| Game | Char 1 | Char 2 | Moegirl Page |
|------|--------|--------|-------------|
| Genshin Impact | Raiden Shogun (雷电将军) | Zhongli (钟离) | `雷电将军`, `钟离` |
| Honkai Star Rail | Sparkle (花火) | Silver Wolf (银狼) | `花火(崩坏:星穹铁道)`, `银狼(崩坏:星穹铁道)` |
| Blue Archive | Aris (爱丽丝/アリス) | Shiroko (白子/シロコ) | `天童爱丽丝`, `砂狼白子` |

## MessageRenderer Design Per Game

### Genshin Impact — "Character Archive Terminal"
- **Greeting (messageIndex 0):** Gacha pull reveal — gold/purple particle burst CSS animation, card flip (3D rotateY transform), reveal character portrait + name + element badge + star rating
- **Messages:** Bottom dialogue box mimicking Genshin's in-game dialogue — character portrait on left (30% width, half-body crop via `object-position`), dialogue text in styled panel on right, actions in italic, inner thoughts in translucent overlay card
- **Bond system:** "Constellation" (命座) — 6 diamond nodes in a horizontal line, each lights up at affinity thresholds (0/15/30/50/70/90), with a tooltip-like label for each node
- **Images:** Full character art from moegirl infobox (portrait, used in both pull reveal and dialogue sidebar)
- **Colors:** Raiden=purple (#9B59B6 electro), Zhongli=amber (#D4A017 geo)

### Honkai Star Rail — "Astral Express Data Terminal"
- **Greeting (messageIndex 0):** Star burst animation — concentric circles expand, character art fades in from center, Path + Element badges orbit in, character name + title typewriter effect
- **Messages:** Full-width narrative style (Star Rail's cutscene dialogue) — round avatar (60px) top-left of each message, character name label, text with subtle gradient background, inner monologue in dashed-border translucent box
- **Bond system:** "Eidolon" (星魂) — 6 star nodes in an arc, lighting up progressively. Each node shows a short description on unlock
- **Images:** Character portrait from moegirl, cropped to circle for avatar + full art for greeting reveal
- **Colors:** Sparkle=#E84393 (Harmony/虚无), Silver Wolf=#0984E3 (Nihility/虚无)

### Blue Archive — "MomoTalk"
- **Greeting (messageIndex 0):** MomoTalk notification — phone notification banner slides down, then transitions to MomoTalk chat view with character profile header
- **Messages:** Full MomoTalk emulation — top bar with back arrow + character name + online status, messages as left-aligned chat bubbles with round avatar, timestamps generated from Date(), actions/narration as centered gray system messages (like WeChat system notices), user messages right-aligned (if role=user)
- **Bond system:** Blue hearts (💙) row — 10 hearts, filled proportionally to affinity, with "羁绊等级 Lv.X" label
- **Images:** Character avatar (small round, 40px) next to each message bubble, full portrait in profile header
- **Colors:** BA blue=#4A9DEC (primary), white/light gray backgrounds, pink accents

---

## Task 1: Enhance Moegirl Scraper — Extract Character Portrait URLs

**Files:**
- Modify: `scripts/card-gen/lib/scrapers/moegirl.js`

**Step 1: Add `extractCharacterPortrait` function**

Add a new exported function that fetches a character's own moegirl page and extracts the infobox portrait image URL.

```javascript
/**
 * Extract the main portrait image URL from a character's Moegirl page.
 * Looks for the infobox image (div.moe-infobox .infobox-image-container img).
 * Returns the full-resolution URL (strips !/fw/ resize suffix).
 *
 * @param {string} charTitle - Character page title on Moegirl (e.g. "雷电将军")
 * @returns {Promise<{portraitUrl: string|null, infoboxData: Record<string,string>}>}
 */
export async function extractCharacterPortrait(charTitle) {
  const { html } = await getPageContent(charTitle);
  const $ = cheerio.load(html);

  // Find infobox portrait
  let portraitUrl = null;
  const infoboxImg = $('div.moe-infobox .infobox-image-container img, div.infobox .infobox-image-container img').first();
  if (infoboxImg.length) {
    let src = infoboxImg.attr('src') || '';
    // Strip moegirl's CDN resize/watermark suffixes to get full resolution
    // Format: https://storage.moegirl.org.cn/.../file.webp!/fw/280/watermark/...
    src = src.split('!/')[0];
    if (src) portraitUrl = src;
  }

  // Also extract infobox key-value data
  const infoboxData = {};
  $('div.moe-infobox div[style*="display: flex"], div.moe-infobox div[style*="display:flex"]').each((_, row) => {
    const $row = $(row);
    const children = $row.children('div');
    if (children.length >= 2) {
      const key = $(children[0]).text().trim();
      const val = $(children[1]).text().trim();
      if (key && val) infoboxData[key] = val;
    }
  });

  return { portraitUrl, infoboxData };
}
```

**Step 2: Add `scrapeGameCharacter` convenience function**

```javascript
/**
 * Scrape a game character: world setting from game page + portrait from character page.
 * @param {string} gameName - Game name for world setting (e.g. "原神")
 * @param {string} charTitle - Character page title (e.g. "雷电将军")
 * @returns {Promise<{portrait: string|null, infobox: Record<string,string>, charSections: Array}>}
 */
export async function scrapeGameCharacter(gameName, charTitle) {
  // Get character portrait + infobox
  const { portraitUrl, infoboxData } = await extractCharacterPortrait(charTitle);

  // Get character page content for personality/story details
  const { html } = await getPageContent(charTitle);
  const $ = cheerio.load(html);
  cleanDocument($);
  const sections = parseSections($);

  return {
    portrait: portraitUrl,
    infobox: infoboxData,
    charSections: sections.map(s => ({ heading: s.heading, content: s.content })),
  };
}
```

**Step 3: Test manually**

Run: `cd scripts/card-gen && node -e "import('./lib/scrapers/moegirl.js').then(m => m.extractCharacterPortrait('雷电将军').then(r => console.log(JSON.stringify(r, null, 2))))"`

Expected: JSON with `portraitUrl` = `https://storage.moegirl.org.cn/moegirl/commons/5/5e/Genshin_raiden_shogun_intro.webp` and `infoboxData` containing fields like `本名`, `性别`, etc.

**Step 4: Commit**

```bash
git add scripts/card-gen/lib/scrapers/moegirl.js
git commit -m "feat(card-gen): add character portrait + infobox extraction from moegirl"
```

---

## Task 2: Scrape All 6 Characters

**Files:**
- Output: `sources/genshin/`, `sources/honkai-star-rail/`, `sources/blue-archive/`

**Step 1: Scrape game IPs for world setting**

Run scrape.js for each game (gets world lore + character list from moegirl):
```bash
cd scripts/card-gen
node scrape.js "原神"
node scrape.js "崩坏：星穹铁道"
node scrape.js "蔚蓝档案"
```

**Step 2: Scrape individual character pages**

For each character, run the new `scrapeGameCharacter` to get portrait URLs and detailed character info. Write a small script or use Node REPL:

```bash
node -e "
import { scrapeGameCharacter } from './lib/scrapers/moegirl.js';
import { writeFile, mkdir } from 'fs/promises';

const chars = [
  { game: 'genshin', name: '雷电将军' },
  { game: 'genshin', name: '钟离' },
  { game: 'honkai-star-rail', name: '花火(崩坏:星穹铁道)' },
  { game: 'honkai-star-rail', name: '银狼(崩坏:星穹铁道)' },
  { game: 'blue-archive', name: '天童爱丽丝' },
  { game: 'blue-archive', name: '砂狼白子' },
];

for (const ch of chars) {
  const data = await scrapeGameCharacter(ch.game, ch.name);
  const dir = 'sources/' + ch.game;
  await mkdir(dir, { recursive: true });
  const slug = ch.name.replace(/[^\\p{L}\\p{N}]/gu, '_');
  await writeFile(dir + '/' + slug + '-detail.json', JSON.stringify(data, null, 2));
  console.log(ch.name, '→', data.portrait ? 'portrait OK' : 'NO PORTRAIT');
}
"
```

**Step 3: Verify portrait URLs are accessible**

Spot-check a few portrait URLs by opening them in browser or curl. Confirm they load without auth.

**Step 4: Commit**

```bash
git add sources/
git commit -m "feat(card-gen): scrape genshin, star rail, blue archive character data"
```

---

## Task 3: Generate Genshin Impact — Raiden Shogun Card

**Files:**
- Read: `sources/genshin/` (scraped data), `scripts/card-gen/templates/rich-char.json`, `scripts/card-gen/card-writing-knowledge.md`
- Create: `output/raiden-shogun-rich.json`

**Step 1: Read all source material**

Read from `sources/genshin/`:
- `moegirl-world.json` — Genshin world setting
- `雷电将军-detail.json` — Character details + portrait URL
- Any MAL/Bangumi data if available

Also read:
- `scripts/card-gen/templates/rich-char.json` — template structure
- `scripts/card-gen/card-writing-knowledge.md` — writing techniques

**Step 2: Write the card JSON**

Generate complete WorldDefinition v13 JSON following rich-char template structure:

Entries needed:
1. `worldview` — Genshin/Inazuma world setting (system, before_char, priority 100, alwaysSend)
2. `style-guide` — Writing style for Genshin RP (style, before_char, priority 95, alwaysSend)
3. `char-raiden` — Full Raiden Shogun character card using Color Palette model (character, character, priority 90, alwaysSend)
   - Main: Eternal authority, composed ruler
   - Base: Ei's warmth and loneliness beneath the Shogun puppet
   - Accent: Curiosity about mortal pleasures (desserts, light novels)
   - Contradiction: "Eternity" vs connection to fleeting moments
4. `example-dialogue` — 2 example dialogues showing Shogun vs Ei personas (example, after_char, priority 80, alwaysSend)
5. `lore-inazuma` — Inazuma lore entry (lore, before_char, keywords, alwaysSend false)
6. `lore-plane-euthymia` — Plane of Euthymia / 一心净土 (lore, before_char, keywords, alwaysSend false)
7. `greeting-1` — Formal Shogun encounter (greeting, greeting)
8. `greeting-2` — Casual Ei encounter in Plane of Euthymia (greeting, greeting)

Variables:
- `affinity` (number, 0-100, relationship, detailed behaviorRules)
- `persona` (string, default "shogun", "shogun" or "ei" — tracks which personality is dominant)

Rules:
- `affinity-milestone-30` — Ei starts showing through (variable-crossed, inject-directive)
- `affinity-milestone-60` — Ei becomes dominant (variable-crossed, inject-directive)
- `constellation-unlock` — notify-player at thresholds with in-universe text

Components:
- `affinity-bar` (stat-bar, variableId: affinity)

**Step 3: Write messageRenderer TSX**

Write TSX to a temporary file first, then inject into JSON using Node.js (avoid manual escaping).

The Genshin renderer must implement:
- `messageIndex === 0`: Gacha pull reveal with character portrait
- Regular messages: Genshin dialogue box style with portrait sidebar
- Constellation progress system driven by `affinity` variable
- Purple electro theme (#9B59B6)
- Character portrait URL hardcoded from scraped moegirl URL

TSX file: `scripts/card-gen/temp/raiden-renderer.tsx`

```tsx
export default function RaidenRenderer({ content, role, messageIndex, renderMarkdown }) {
  var api = useYumina();
  var vars = api.variables;
  var affinity = typeof vars["affinity"] === "number" ? vars["affinity"] : 0;
  var persona = vars["persona"] || "shogun";

  // Character image URLs (from moegirl)
  var portraitUrl = "https://storage.moegirl.org.cn/moegirl/commons/5/5e/Genshin_raiden_shogun_intro.webp";

  // Constellation thresholds
  var constellationThresholds = [0, 15, 30, 50, 70, 90];
  var constellationNames = ["净土之雷", "万世的暗夜", "永恒的真意", "不动的威光", "梦想的斩击", "愿望的尽头"];

  if (!content) return null;

  // === GREETING: Gacha Pull Reveal ===
  if (messageIndex === 0) {
    var [revealed, setRevealed] = React.useState(false);
    React.useEffect(function() { var t = setTimeout(function() { setRevealed(true); }, 800); return function() { clearTimeout(t); }; }, []);

    return React.createElement("div", { className: "relative overflow-hidden rounded-xl", style: { minHeight: "420px", background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)" } },
      // Star particles background (CSS)
      React.createElement("style", null, `
        @keyframes sparkle { 0%,100% { opacity:0; transform:scale(0); } 50% { opacity:1; transform:scale(1); } }
        @keyframes cardReveal { 0% { transform:rotateY(90deg) scale(0.8); opacity:0; } 100% { transform:rotateY(0deg) scale(1); opacity:1; } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 20px #9B59B6; } 50% { box-shadow: 0 0 40px #9B59B6, 0 0 60px #7B3FA0; } }
        .gacha-star { position:absolute; width:4px; height:4px; background:#fff; border-radius:50%; }
      `),
      // Particle effects
      ...Array.from({length: 20}, function(_, i) {
        return React.createElement("div", {
          key: "star-" + i, className: "gacha-star",
          style: { left: Math.random()*100+"%", top: Math.random()*100+"%", animation: "sparkle " + (1+Math.random()*2)+"s " + (Math.random()*2)+"s infinite" }
        });
      }),
      // Character card
      React.createElement("div", {
        className: "relative z-10 flex flex-col items-center justify-center p-6",
        style: { animation: revealed ? "cardReveal 0.8s ease-out forwards" : "none", opacity: revealed ? 1 : 0 }
      },
        // Stars
        React.createElement("div", { className: "flex gap-1 mb-3" },
          ...Array.from({length: 5}, function(_, i) {
            return React.createElement("span", { key: i, className: "text-xl", style: { color: "#FFD700", textShadow: "0 0 8px #FFD700" } }, "\u2605");
          })
        ),
        // Portrait
        React.createElement("div", { className: "relative mb-4", style: { animation: "glowPulse 2s infinite" } },
          React.createElement("img", {
            src: portraitUrl, alt: "雷电将军",
            className: "rounded-lg object-cover",
            style: { width: "200px", height: "200px", border: "2px solid #9B59B6" }
          })
        ),
        // Name + Element
        React.createElement("div", { className: "text-center" },
          React.createElement("h2", { className: "text-2xl font-bold mb-1", style: { color: "#E8D5F5" } }, "雷电将军"),
          React.createElement("div", { className: "flex items-center justify-center gap-2 mb-3" },
            React.createElement("span", { className: "px-2 py-0.5 rounded text-xs font-bold", style: { background: "#9B59B6", color: "#fff" } }, "\u26a1 雷元素"),
            React.createElement("span", { className: "px-2 py-0.5 rounded text-xs", style: { background: "rgba(155,89,182,0.3)", color: "#E8D5F5", border: "1px solid #9B59B6" } }, "长柄武器")
          )
        ),
        // Greeting text
        React.createElement("div", {
          className: "mt-3 p-4 rounded-lg max-w-lg text-sm leading-relaxed",
          style: { background: "rgba(155,89,182,0.15)", border: "1px solid rgba(155,89,182,0.3)", color: "#E8D5F5" },
          dangerouslySetInnerHTML: { __html: renderMarkdown(content) }
        })
      )
    );
  }

  // === REGULAR MESSAGES ===
  if (role === "user") {
    return React.createElement("div", { className: "flex justify-end mb-3" },
      React.createElement("div", {
        className: "p-3 rounded-lg max-w-[75%] text-sm",
        style: { background: "rgba(155,89,182,0.2)", color: "#E8D5F5", border: "1px solid rgba(155,89,182,0.15)" },
        dangerouslySetInnerHTML: { __html: renderMarkdown(content) }
      })
    );
  }

  // AI message — Genshin dialogue style
  return React.createElement("div", { className: "mb-4" },
    // Dialogue area with portrait
    React.createElement("div", { className: "flex gap-3 mb-3" },
      // Portrait sidebar
      React.createElement("div", { className: "flex-shrink-0", style: { width: "80px" } },
        React.createElement("img", {
          src: portraitUrl, alt: "雷电将军",
          className: "rounded-lg object-cover object-top w-full",
          style: { height: "100px", border: "1px solid rgba(155,89,182,0.4)" }
        }),
        React.createElement("div", {
          className: "text-center text-xs mt-1 font-bold",
          style: { color: "#C9A0DC" }
        }, persona === "ei" ? "影" : "雷电将军")
      ),
      // Dialogue box
      React.createElement("div", { className: "flex-1 min-w-0" },
        React.createElement("div", {
          className: "p-3 rounded-lg text-sm leading-relaxed",
          style: {
            background: "linear-gradient(135deg, rgba(26,10,46,0.9) 0%, rgba(45,27,78,0.9) 100%)",
            border: "1px solid rgba(155,89,182,0.3)",
            color: "#E8D5F5"
          },
          dangerouslySetInnerHTML: { __html: renderMarkdown(content) }
        })
      )
    ),
    // Constellation progress
    React.createElement("div", {
      className: "flex items-center justify-center gap-2 py-2 px-3 rounded-lg mt-2",
      style: { background: "rgba(26,10,46,0.6)", border: "1px solid rgba(155,89,182,0.15)" }
    },
      React.createElement("span", { className: "text-xs mr-2", style: { color: "#9B7FBF" } }, "命座"),
      ...constellationThresholds.map(function(thresh, i) {
        var unlocked = affinity >= thresh;
        return React.createElement("div", {
          key: i, className: "group relative flex flex-col items-center",
          title: constellationNames[i] + (unlocked ? " (已解锁)" : " (未解锁)")
        },
          React.createElement("div", {
            className: "transition-all duration-500",
            style: {
              width: "16px", height: "16px",
              transform: "rotate(45deg)",
              background: unlocked ? "#9B59B6" : "transparent",
              border: "2px solid " + (unlocked ? "#C9A0DC" : "#4A3660"),
              boxShadow: unlocked ? "0 0 8px #9B59B6" : "none"
            }
          }),
          i < 5 ? React.createElement("div", {
            style: { position: "absolute", right: "-10px", top: "6px", width: "12px", height: "2px", background: unlocked ? "#9B59B6" : "#4A3660" }
          }) : null
        );
      }),
      React.createElement("span", { className: "text-xs ml-2", style: { color: "#9B7FBF" } },
        constellationThresholds.filter(function(t) { return affinity >= t; }).length + "/6"
      )
    )
  );
}
```

**Step 4: Inject TSX into JSON**

```javascript
// inject-renderer.js
const tsx = fs.readFileSync('temp/raiden-renderer.tsx', 'utf-8');
const card = JSON.parse(fs.readFileSync('output/raiden-shogun-rich.json', 'utf-8'));
card.messageRenderer = { id: 'raiden-renderer', name: '雷电将军渲染器', tsxCode: tsx, description: '原神风格对话界面', visible: true };
fs.writeFileSync('output/raiden-shogun-rich.json', JSON.stringify(card, null, 2));
```

**Step 5: Commit**

```bash
git add output/raiden-shogun-rich.json
git commit -m "feat(card-gen): add Raiden Shogun rich-char card with Genshin-style renderer"
```

---

## Task 4: Generate Genshin Impact — Zhongli Card

Same structure as Task 3 but for Zhongli:
- Portrait: scrape from `钟离` moegirl page
- Theme: Amber/Gold geo colors (#D4A017)
- Constellation names: Zhongli's actual constellation names
- Character: Archon-retired persona, contract obsession, "mora-less" running gag, classical Chinese speech patterns
- Same Genshin renderer structure but with geo color scheme
- Write to `output/zhongli-rich.json`

---

## Task 5: Generate Star Rail — Sparkle Card

**Files:**
- Read: `sources/honkai-star-rail/` data, Sparkle portrait from moegirl
- Create: `output/sparkle-rich.json`

Same card structure as rich-char template. Key differences:

**MessageRenderer:** Star Rail Data Terminal style
- Greeting: Star burst animation with concentric circles, character art fade-in
- Messages: Full-width narrative with round avatar, name label, gradient bg
- Bond: 6 star eidolon nodes in arc formation
- Colors: Pink/magenta (#E84393)

**Character:** Sparkle's trickster personality — chaos, 4th wall awareness, theatrical masks, Penacony/dream themes

---

## Task 6: Generate Star Rail — Silver Wolf Card

Same Star Rail renderer structure as Task 5 but for Silver Wolf:
- Portrait: scrape from `银狼(崩坏:星穹铁道)` moegirl page
- Theme: Blue/cyan hacker aesthetic (#0984E3)
- Character: Gamer girl, hacker, everything-is-a-game worldview, competitive personality
- Write to `output/silver-wolf-rich.json`

---

## Task 7: Generate Blue Archive — Aris Card

**Files:**
- Read: `sources/blue-archive/` data, Aris portrait from moegirl
- Create: `output/aris-rich.json`

**MessageRenderer:** MomoTalk emulation
- Greeting: Phone notification slide-down, then MomoTalk chat view
- Messages: Chat bubbles with avatar, timestamps, system messages for actions
- Bond: Blue heart row (💙)
- Top bar: Character name + online status
- Colors: BA blue #4A9DEC

**Character:** Game dev student (Game Development Club), curious about the world, earnest and literal-minded, loves games

---

## Task 8: Generate Blue Archive — Shiroko Card

Same MomoTalk renderer as Task 7 but for Shiroko:
- Portrait: scrape from `砂狼白子` moegirl page
- Character: Abydos High School, stoic/cool exterior, bank robbery jokes, survival-focused, protective of friends
- Write to `output/shiroko-rich.json`

---

## Task 9: Final Review & Commit

**Step 1:** Read all 6 output JSON files and verify:
- [ ] All have valid WorldDefinition v13 structure
- [ ] All messageRenderers have valid TSX (no syntax errors)
- [ ] All portrait URLs are correct and load
- [ ] Each game's renderer is structurally different (not just color swap)
- [ ] All user-visible text is in Chinese
- [ ] behaviorRules are detailed and character-specific

**Step 2:** Commit all cards

```bash
git add output/
git commit -m "feat(card-gen): add 6 gacha game character cards (genshin, star rail, blue archive)"
```

---

## Reference: Image URL Pattern

Moegirl images follow this pattern:
```
https://storage.moegirl.org.cn/moegirl/commons/{hash_prefix}/{hash}/{Filename.ext}
```

To get full resolution: use base URL without `!/fw/` suffix.
To get resized: append `!/fw/{width}` (e.g. `!/fw/400` for 400px width).
No auth required. Yumina's `referrerPolicy="no-referrer"` prevents CORS issues.

## Reference: TSX Injection Script

Always write TSX to a temp file first, then inject into JSON via Node.js:

```bash
node -e "
const fs = require('fs');
const tsx = fs.readFileSync('scripts/card-gen/temp/RENDERER.tsx', 'utf-8');
const card = JSON.parse(fs.readFileSync('output/CARD.json', 'utf-8'));
card.messageRenderer = { id: 'ID', name: 'NAME', tsxCode: tsx, description: 'DESC', visible: true };
fs.writeFileSync('output/CARD.json', JSON.stringify(card, null, 2));
console.log('Injected renderer into CARD.json');
"
```
