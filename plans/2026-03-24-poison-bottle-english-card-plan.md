# Poison in the Bottle · Battle Royale — English Card Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Translate `sample card/壺中の毒 · 大逃杀.json` into a full English card and save as `sample card/Poison in the Bottle · Battle Royale.json`.

**Architecture:** Read the source card in sections (by line offset), translate all Chinese-language strings section by section, stage each section's translated JSON text to a temp working file, then assemble and write the final card. The JSON structure and all IDs remain identical to the source.

**Tech Stack:** Claude Code Read/Write/Grep/Bash tools, Node.js for final JSON validation.

---

## Translation Conventions (reference throughout)

- Japanese proper names → romaji: 佐倉井君華 → Sakurai Kimika, 鳳惠介 → Otori Keisuke, 鑏木阳一 → Tsurugibayashi Yoichi, 椎葉梨花 → Shiiba Rika, 馆林 → Tatebayashi, 加須 → Kasu, 有沢 → Arisawa, 佐野 → Sano, 前田 → Maeda
- Card title: `壺中の毒 · 大逃杀` → `Poison in the Bottle · Battle Royale`
- Keep all XML-style tags (`<worldview>`, `<character_...>`, etc.) as-is
- Keep all JSON keys and IDs unchanged
- Preserve Kimika's contemptuous inner voice — "ちょろすぎ♪" → "too easy♪" or "such a pushover♪"
- Notification strings: keep terse and punchy (e.g. "体力即将耗尽！" → "Health critical!")
- Directive strings (injected into AI prompt): keep precise and instructional in tone
- `{{user}}` placeholder: keep as-is

---

## Source File Section Map

| Section | Lines | Content |
|---|---|---|
| Metadata + reactions | 1–233 | Card name, 8 reactions |
| Entries block 1 | 235–461 | br-worldview, br-island, br-char-sakurai, br-mechanics, br-ai-director |
| Entries block 2 | 462–591 | br-greeting-create, br-greeting-day3, br-greeting-day5, br-greeting-day7, Creative Mode entry |
| Entries block 3 | 592–891 | br-char-otori, br-char-shiiba, br-char-arisawa, br-char-sawamura, br-char-gondo, br-char-tatebayashi, br-char-kasu, br-char-sano, br-char-kurien, br-student-names |
| Settings | 892–905 | Unchanged (no Chinese text) |
| Variables | 906–1386 | ~480 lines, variable names/labels/descriptions |
| customComponents | 1387–end | Large React component, translate all Chinese JSX strings |

---

## Task 1: Read and translate metadata + reactions (L1–233)

**Files:**
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 1–120)
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 120–233)

**Step 1:** Read lines 1–120. Identify all Chinese `name`, `description`, and `value` fields in reactions. Translate:
- Card `name` → `Poison in the Bottle · Battle Royale`
- `击杀播报·自动音效` → `Kill Broadcast · Auto SFX`
- `dead-names更新时自动播放死亡音效` → `Plays death SFX automatically when dead-names updates`
- `每回合饥饿衰减` → `Hunger Decay Per Turn`
- `每回合自动扣除5点饥饿值` → `Automatically deducts 5 hunger per turn`
- `体力危急警告` → `Critical Health Warning`
- `体力低于20时显示警告通知` → `Shows warning notification when health drops below 20`
- `@ui.notification` value `体力即将耗尽！` → `Health is running out!`

**Step 2:** Read lines 120–233. Translate remaining reactions:
- `饥饿致死警告` → `Starvation Warning`
- `饥饿值低于20时显示警告通知` → `Shows warning when hunger drops below 20`
- `即将饿死！` → `Starving to death!`
- `夜晚氛围注入` → `Night Atmosphere Injection`
- `时间段变为夜晚时注入氛围directive` → `Injects atmosphere directive when time period changes to Night`
- Night directive value → `It is now night. Darkness so thick you can't see your hand before your face. Every sound could be the wind, an animal, or someone closing in. Enemy encounter rate increases sharply; visibility is severely limited. Emphasize darkness, sound, and tension in your writing.`
- `上午氛围注入` → `Morning Atmosphere Injection`
- `时间段变为上午时注入氛围directive` → `Injects atmosphere directive when time period changes to Morning`
- Morning directive value → `Dawn light filters through the canopy. Birdsong and the sound of the tide create an uncanny calm. A relatively safe window for looting and movement.`
- `下午氛围注入` → `Afternoon Atmosphere Injection`
- `时间段变为下午时注入氛围directive` → `Injects atmosphere directive when time period changes to Afternoon`
- Afternoon directive value → `The afternoon heat is stifling. Physical exertion drains faster. Active hunters are on the move. Tension mounts with every passing minute as the next broadcast approaches.`
- `位置变化上下文注入` → `Location Change Context Injection`
- `位置变化时提醒AI描写环境` → `Reminds the AI to describe the environment when location changes`
- Location directive value → `The player has just moved locations. Describe the environmental features of the current area, potential hazards, and possible NPC encounters accordingly.`

**Step 3:** Save the translated reactions section to memory for assembly in Task 8. Note: `"author": "Based on majiko's novel"` is already English — no change.

---

## Task 2: Read and translate entries block 1 — worldview + island + Sakurai (L235–380)

**Files:**
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 235–310)
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 310–380)

**Step 1:** Read lines 235–287. Translate `br-worldview` entry:
- Entry `name`: `世界观与规则` → `World & Rules`
- `content` block: translate the full `<worldview>...</worldview>` XML block to English:
  - Setting: Private Vein Academy Branch 2 — a fully residential high school on an isolated island. On graduation day, 40 students are declared participants in the killing tradition "Poison in the Bottle" (壺中の毒) — venomous insects sealed in a jar, devouring each other until only the deadliest poison survives.
  - Rules: (1) Survive 7 days to win. All survivors may win together. (2) Kill classmates for Kill Points (KP). Killing a KP-holder inherits all their points. (3) 1 KP = 10 million yen. (4) Each student receives: a terminal device, 3 days of rations (6 units), 1 random weapon. (5) Anyone who leaves the game zone is executed.
  - Known weapon assignments (AI reference only) — translate character names to romaji, keep weapon names in English
  - Broadcast system: translate
  - Tone description: translate

**Step 2:** Read lines 262–310. Translate `br-island` entry:
- Entry `name`: `孤岛场景` → `Island Map`
- `content` block `<scene_孤岛>` → `<scene_island>`: translate all 10 zone descriptions to English, keeping the terse tactical style

**Step 3:** Read lines 287–380. Translate `br-char-sakurai` entry:
- Entry `name`: `佐倉井君華` → `Sakurai Kimika`
- `content` block: full character description → translate all Chinese text to English
  - Preserve all section headers with `===` markers
  - Preserve the 3-layer behavioral spectrum (surface/mid/deep)
  - Translate all example dialogue lines faithfully, preserving the soft-menacing tone
  - Translate hunting behavior notes with all character romaji names
  - Translate AI roleplay principles, preserving "ちょろすぎ♪" → "too easy♪" and "全・都・是・骗・你・的♥" → "It · was · all · a · lie♥"

---

## Task 3: Read and translate entries block 1 — mechanics + AI director (L338–461)

**Files:**
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 312–461)

**Step 1:** Read lines 312–361. Translate `br-mechanics` entry:
- Entry `name`: `生存机制` → `Survival Mechanics`
- `content` block: translate all Chinese mechanical descriptions (hunger system, health thresholds, time periods, kill broadcast format, item system, etc.)

**Step 2:** Read lines 337–461. Translate `br-ai-director` entry:
- Entry `name`: `AI导演指令` → `AI Director Directives`
- `content` block: translate all directives in precise, instructional English

---

## Task 4: Read and translate entries block 2 — greetings + creative mode (L362–591)

**Files:**
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 362–591)

**Step 1:** Translate each greeting entry name and content:
- `br-greeting-create`: `开场白·角色创建 + 毕业典礼` → `Opening · Character Creation + Graduation`
- `br-greeting-day3`: `开场白·Day3 洞窟` → `Opening · Day 3 Cave`
- `br-greeting-day5`: `开场白·Day5 追猎` → `Opening · Day 5 Hunt`
- `br-greeting-day7`: `开场白·Day7 最终日` → `Opening · Day 7 Final Day`
- Translate all greeting prose to English, preserving dramatic and literary quality

**Step 2:** If a "Creative Mode & Style" entry exists in this range, check if it is already English. If not, translate.

---

## Task 5: Read and translate entries block 3 — character entries (L592–891)

**Files:**
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 592–730)
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 730–891)

**Step 1:** Read lines 592–730. Translate:
- `br-char-otori`: name `鳳惠介` → `Otori Keisuke`, translate content
- `br-char-shiiba`: name `椎葉梨花` → `Shiiba Rika`, translate content
- `br-char-arisawa`: name `有沢` → `Arisawa`, translate content
- `br-char-sawamura`: name `澤村` → `Sawamura`, translate content

**Step 2:** Read lines 730–891. Translate:
- `br-char-gondo`: translate name + content
- `br-char-tatebayashi`: name `馆林` → `Tatebayashi`, translate content
- `br-char-kasu`: name `加須` → `Kasu`, translate content
- `br-char-sano`: name `佐野` → `Sano`, translate content
- `br-char-kurien`: translate name + content
- `br-student-names`: name `学生名单` → `Student Roster`, translate content (all names → romaji)

---

## Task 6: Read and translate variables (L906–1386)

**Files:**
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 906–1050)
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 1050–1200)
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 1200–1386)

**Step 1:** For each variable, translate `name`, `label`, and `description` fields. Keep `id` unchanged. Common patterns:
- `体力` → `Health`, `饥饿值` → `Hunger`, `位置` → `Location`, `时间段` → `Time Period`
- `死亡名单` → `Death Roll`, `击杀数` → `Kill Count`, `存活人数` → `Survivors`
- `日期` → `Day`, `道具栏` → `Inventory`, `状态` → `Status`

**Step 2:** Translate any enum values or default value strings that are Chinese.

---

## Task 7: Find and translate customComponents Chinese strings (L1387–end)

**Files:**
- Read: `sample card/壺中の毒 · 大逃杀.json` (lines 1387–1550)
- Read: additional chunks as needed

**Step 1:** Use Grep to find all lines in the customComponents section containing Chinese characters:
```
pattern: [\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]
path: sample card/壺中の毒 · 大逃杀.json
```
Note the line numbers and context.

**Step 2:** Read each region (±5 lines around each match) to understand the UI context. Translate:
- Stat bar labels, section headers, button text
- Notification/toast messages
- Kill feed broadcast text
- Any hardcoded Chinese strings in JSX

**Step 3:** Record all translations as a map of `{lineNumber: originalString → translatedString}` for use in Task 8.

---

## Task 8: Assemble and write the final card file

**Files:**
- Create: `sample card/Poison in the Bottle · Battle Royale.json`

**Step 1:** Read the source file in chunks (50–100 lines at a time). For each chunk:
- Apply all translations from Tasks 1–7
- Accumulate the translated JSON text

**Step 2:** Write the complete translated JSON to `sample card/Poison in the Bottle · Battle Royale.json`.

**Step 3:** Validate the output is valid JSON:
```bash
node -e "JSON.parse(require('fs').readFileSync('sample card/Poison in the Bottle · Battle Royale.json', 'utf8')); console.log('Valid JSON')"
```
Expected: `Valid JSON`

**Step 4:** Verify no unintentional Chinese characters remain (non-name content):
```bash
node -e "
const s = require('fs').readFileSync('sample card/Poison in the Bottle · Battle Royale.json', 'utf8');
const matches = s.match(/[\u4e00-\u9fff]+/g);
if (matches) console.log('Remaining Chinese:', [...new Set(matches)]);
else console.log('No Chinese text found');
"
```
Review any remaining Chinese — some may be intentional (Japanese text in source material that was originally Chinese-written, or proper cultural terms).

**Step 5:** Commit:
```bash
git add "sample card/Poison in the Bottle · Battle Royale.json"
git commit -m "feat(card): add English translation of 壺中の毒 — Poison in the Bottle · Battle Royale"
```
