# Three IP Scenario Cards — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate three premium scenario-level WorldDefinition v13 JSON cards (Chainsaw Man, Attack on Titan, Hunter x Hunter) with arc-selection gameplay, character selection, and custom messageRenderers.

**Architecture:** Each card is a self-contained WorldDefinition v13 JSON file generated from scraped source material. Cards follow the arc-selection model: first message presents character + arc choices, lorebook entries are conditionally loaded per arc. Each card includes a unique TSX messageRenderer with IP-themed visuals and character avatars. TSX is written to a temp file first, then injected into the JSON to avoid escaping issues.

**Tech Stack:** WorldDefinition v13 JSON, TSX (messageRenderer), Node.js (TSX→JSON injection script)

---

## Prerequisites

- Source material in `sources/チェンソーマン/`, `sources/進撃の巨人/`, `sources/hunter-hunter/`
- Character images in each source's `images/` directory (patched via `patch-images.js`)
- Schema reference: `scripts/card-gen/schemas/world-schema-reference.md`
- Card writing knowledge base: `scripts/card-gen/card-writing-knowledge.md`
- Scenario template: `scripts/card-gen/templates/scenario.json`
- Sample cards for quality reference: `sample card/` directory
- Output directory: `output/` at project root

## Shared TSX Injection Script

Before generating cards, we need a helper script to inject TSX into JSON without manual escaping.

### Task 0: Create TSX injection helper

**Files:**
- Create: `scripts/card-gen/inject-renderer.js`

**Step 1: Write the script**

```js
// scripts/card-gen/inject-renderer.js
// Reads a WorldDefinition JSON and a TSX file, injects the TSX as messageRenderer.tsxCode
//
// Usage: node inject-renderer.js <card.json> <renderer.tsx>

import { readFile, writeFile } from 'fs/promises';

const [jsonPath, tsxPath] = process.argv.slice(2);
if (!jsonPath || !tsxPath) {
  console.log('Usage: node inject-renderer.js <card.json> <renderer.tsx>');
  process.exit(1);
}

const card = JSON.parse(await readFile(jsonPath, 'utf-8'));
const tsx = await readFile(tsxPath, 'utf-8');

card.messageRenderer = {
  id: 'message-renderer',
  name: 'Message Renderer',
  tsxCode: tsx,
  description: 'Custom message renderer for this card',
  order: 0,
  visible: true,
};

await writeFile(jsonPath, JSON.stringify(card, null, 2), 'utf-8');
console.log(`✅ Injected renderer from ${tsxPath} into ${jsonPath}`);
```

**Step 2: Verify it works**

Run: `node scripts/card-gen/inject-renderer.js --help` (should print usage)

---

## Card Generation Tasks

Each card follows the same workflow:
1. Read source material (already done in brainstorming phase)
2. Generate the WorldDefinition JSON (entries, variables, rules, components)
3. Write the messageRenderer TSX to a temp file
4. Inject TSX into JSON
5. Verify the JSON is valid

**These three cards are independent and CAN be parallelized via subagents.**

---

### Task 1: Chainsaw Man — 「恶魔猎人的日常」

**Files:**
- Create: `output/chainsaw-man/恶魔猎人的日常-scenario.json`
- Create: `temp-translations/chainsaw-man-renderer.tsx` (temporary, injected into JSON)

**Source material:**
- `sources/チェンソーマン/meta.json`
- `sources/チェンソーマン/mal-characters.json`
- `sources/チェンソーマン/moegirl-world.json`
- `sources/チェンソーマン/images/` (24 images)

**Step 1: Read all source material**

Read every file in `sources/チェンソーマン/`. Cross-reference character data from MAL + Moegirl to build complete character profiles. Map character images: Denji=492407.jpg, Makima=489561.jpg, Aki=395003.jpg, Power=494969.jpg, Reze=618421.jpg, Kobeni=467961.jpg, Pochita=391655.jpg, Himeno=386392.jpg, Kishibe=488553.jpg, Beam=609115.jpg, Angel Devil=586726.jpg.

**Step 2: Generate the WorldDefinition JSON**

Create the card JSON following this structure (refer to `scripts/card-gen/schemas/world-schema-reference.md` for field specs, `scripts/card-gen/card-writing-knowledge.md` for writing techniques, `scripts/card-gen/templates/scenario.json` for format reference, `sample card/` for quality reference):

**Entries to create:**
1. `worldview` (role:system, position:before_char, priority:100, alwaysSend:true) — World of devils, devil hunters, contracts, Public Safety Division 4. Core mechanics: fear system, blood regeneration, devil contracts. Detailed world rules.
2. `output-control` (role:system, position:before_char, priority:98, alwaysSend:true) — Decision stops, prohibitions, state update rules. Include specific anti-patterns for this IP.
3. `style-guide` (role:style, position:before_char, priority:95, alwaysSend:true) — Dark/gritty tone, visceral action descriptions, Fujimoto's black humor, emotional whiplash style. Constrained aesthetic vocabulary: blood, chainsaw, iron, rust palette.
4. `char-denji` (role:character, position:character, priority:90, alwaysSend:false, conditions: player_character eq "denji") — Full spectrum personality, speech patterns per state, behavioral rules, micro-narratives. "对角色的理解" section.
5. `char-aki` (role:character, position:character, priority:90, conditions: player_character eq "aki") — Same depth.
6. `char-power` (role:character, position:character, priority:90, conditions: player_character eq "power") — Same depth.
7. `char-kobeni` (role:character, position:character, priority:90, conditions: player_character eq "kobeni") — Same depth.
8. `npc-roster` (role:character, position:after_char, priority:85, alwaysSend:true) — Brief profiles of all non-player characters that appear across arcs: Makima, Himeno, Kishibe, Beam, Angel Devil, etc.
9. `example-dialogue` (role:example, position:after_char, priority:80, alwaysSend:true) — 2-3 example dialogues showing the IP's tone (dark humor + violence + emotion).
10. `lore-eternity-arc` (role:lore, conditions: arc_id eq "eternity") — Eternity Devil arc lorebook: infinite hotel, trapped team, three-day fight mechanics.
11. `lore-katana-arc` (role:lore, conditions: arc_id eq "katana") — Katana Man arc: Public Safety ambush, revenge, team dynamics.
12. `lore-reze-arc` (role:lore, conditions: arc_id eq "reze") — Reze arc: cafe meetings, rain fights, romantic tension, Bomb Devil.
13. `lore-control-arc` (role:lore, conditions: arc_id eq "control") — Control Devil arc: Makima reveal, Power sacrifice, final confrontation.
14. `lore-devils` (role:lore, keywords:["恶魔","契约","恐惧"], alwaysSend:false) — Devil system lorebook.
15. `lore-public-safety` (role:lore, keywords:["公安","猎人","部队"], alwaysSend:false) — Public Safety organization.
16. `greeting` (role:greeting, position:greeting) — Interactive first message with character selection (4 options with descriptions) then arc selection (4 arcs with brief previews). End with the opening scene of the selected arc.

**Variables:**
- `arc_id` (string, default:"", category:custom) — Selected arc
- `player_character` (string, default:"", category:custom) — Selected character
- `story_phase` (number, default:1, min:1, max:5, category:stat) — Current story phase within arc
- `fear_level` (number, default:30, min:0, max:100, category:stat) — Fear level, affects devil power. behaviorRules: "面对强敌恐惧+5~15，战胜恶魔-5~10，被保护时-3~5，单独面对黑暗+3~8"
- `blood_level` (number, default:80, min:0, max:100, category:resource) — Blood/HP. behaviorRules: "受到攻击-10~30，喝血+20~40，变身消耗-15，重伤时描写变得更加脆弱和绝望"
- `contract_cost` (number, default:0, min:0, max:100, category:stat) — Accumulated contract cost. behaviorRules: "使用契约能力+5~15，代价永久不可恢复，达到50时角色开始感到身体异常，达到80时生命危险"
- `makima_trust` (number, default:50, min:0, max:100, category:relationship) — Makima's apparent trust/control. behaviorRules: "服从玛奇玛的命令+3~5，展现独立思考-2~4，与帕瓦/秋关系加深-1~3"
- `team_bond` (number, default:40, min:0, max:100, category:relationship) — Bond with Division 4 team. behaviorRules: "共同战斗+3~8，保护队友+5~10，日常相处+1~3，队友受伤时触发强烈情感反应"

**Rules:**
- `blood-critical`: WHEN blood_level drops-below 20 → notify-player "血……不够了。视野开始模糊。" (danger) + inject-directive for desperate behavior
- `fear-power-up`: WHEN fear_level rises-above 70 → notify-player "恐惧在体内沸腾——恶魔的力量在回应。" (warning) + inject-directive allowing more powerful devil abilities
- `phase-advance`: WHEN story_phase state-change + conditions (story_phase gte 4) → notify-player arc-specific milestone message
- `contract-warning`: WHEN contract_cost rises-above 50 → notify-player "身体的某个部分开始感到麻木……代价在累积。" (warning)

**Components:**
- stat-bar for blood_level (color: #dc2626)
- stat-bar for fear_level (color: #7c3aed)
- stat-bar for contract_cost (color: #6b7280)
- stat-bar for team_bond (color: #f59e0b)
- text-display for story_phase (format: "第 {{value}} 幕")

**Step 3: Write the messageRenderer TSX**

Write to `temp-translations/chainsaw-man-renderer.tsx`. Design requirements:
- **Theme**: Dark punk. Background: near-black (#0a0a0a). Accent: blood red (#dc2626). Secondary: rust (#92400e), chain gray (#374151).
- **Message parsing**: Detect `「...」` for dialogue (highlight with character color), `*...*` for action (italic, dim), narration default.
- **Character avatars**: Show character avatar (from images/) next to their dialogue. Use base64 data URLs or image path references. Map character names to image files.
- **Status panel**: Compact header showing blood/fear/contract as mini progress bars with Chinese labels.
- **Decorative elements**: Chainsaw-tooth border pattern on message containers. Subtle blood drip SVG on section dividers.
- **All visible text in Chinese.**

**Step 4: Inject TSX into JSON**

Run: `node scripts/card-gen/inject-renderer.js output/chainsaw-man/恶魔猎人的日常-scenario.json temp-translations/chainsaw-man-renderer.tsx`

**Step 5: Validate**

Verify the JSON parses correctly: `node -e "JSON.parse(require('fs').readFileSync('output/chainsaw-man/恶魔猎人的日常-scenario.json','utf-8')); console.log('✅ Valid JSON')"`

---

### Task 2: Attack on Titan — 「自由的代价」

**Files:**
- Create: `output/attack-on-titan/自由的代价-scenario.json`
- Create: `temp-translations/aot-renderer.tsx`

**Source material:**
- `sources/進撃の巨人/meta.json`
- `sources/進撃の巨人/mal-characters.json`
- `sources/進撃の巨人/moegirl-world.json`
- `sources/進撃の巨人/images/` (23 images)

**Step 1: Read all source material**

Character image mapping: Eren=216895.jpg, Mikasa=215563.jpg, Armin=220267.jpg, Levi=241413.jpg, Erwin=559023.jpg, Hange=208637.jpg, Jean=216893.jpg, Annie=206357.jpg, Krista=216967.jpg, Ymir=206385.jpg, Bertolt=206409.jpg, Connie=208109.jpg, Sasha=251937.jpg, Reiner=206489.jpg, Petra=217555.jpg.

**Step 2: Generate the WorldDefinition JSON**

Same reference docs as Task 1.

**Entries to create:**
1. `worldview` (priority:100) — Walls, Titans, ODM gear, military structure, Survey Corps. Titan shifter mechanics. The truth about Eldians/Marley (only in later arcs). "Ripples & Waves" technique: canon events are Waves (must happen), player's role within them are Ripples.
2. `output-control` (priority:98) — Military tension atmosphere, information asymmetry (player doesn't know truths until revealed in-arc), decision stops at combat and strategic moments.
3. `style-guide` (priority:95) — Military precision prose, environmental atmosphere (rain, ash, blood), Isayama's moral ambiguity style. Vocabulary: walls, wings, freedom, sacrifice.
4. `char-eren` (conditions: player_character eq "eren") — Hot-blooded → morally complex evolution. Attack Titan powers. Contradiction-core: "freedom" = "destruction."
5. `char-mikasa` (conditions: player_character eq "mikasa") — Ackerman strength, emotional restraint, devotion to Eren. Contradiction-core: "strongest warrior" = "most vulnerable heart."
6. `char-levi` (conditions: player_character eq "levi") — Humanity's strongest, clean freak, Underground upbringing. Contradiction-core: "emotionless killer" = "most burdened by every death."
7. `char-armin` (conditions: player_character eq "armin") — Strategic genius, physically weak, dreamer. Contradiction-core: "idealist" = "willing to sacrifice everything."
8. `npc-roster` (priority:85, alwaysSend:true) — Erwin, Hange, Jean, Annie, Reiner, Bertolt, Sasha, Connie, etc.
9. `example-dialogue` (priority:80) — 2-3 examples capturing military tension + emotional weight.
10. `lore-trost-arc` (conditions: arc_id eq "trost") — Battle of Trost: first transformation, sealing the gate, military tribunal.
11. `lore-female-arc` (conditions: arc_id eq "female") — 57th Expedition, Female Titan pursuit, Levi squad, Annie reveal.
12. `lore-shiganshina-arc` (conditions: arc_id eq "shiganshina") — Return to Shiganshina, Beast Titan, Erwin's charge, serum choice, basement reveal.
13. `lore-marley-arc` (conditions: arc_id eq "marley") — Marley infiltration, Warrior perspective, Willy Tybur, declaration of war.
14. `lore-titans` (keywords, not alwaysSend) — Titan types, nine powers, Curse of Ymir.
15. `lore-military` (keywords) — Three military branches, ODM gear, Thunder Spears.
16. `greeting` — Character selection (Eren/Mikasa/Levi/Armin with portraits + brief intro) → arc selection (4 arcs) → opening scene.

**Variables:**
- `arc_id`, `player_character`, `story_phase` (same structure as CSM)
- `odm_fuel` (number, default:100, min:0, max:100, category:resource) — ODM gear fuel. behaviorRules: "每次立体机动战斗消耗10~25，回到补给点恢复至100，燃料低于20时描写为燃料报警、机动受限"
- `blade_durability` (number, default:100, min:0, max:100, category:resource) — Blade condition. behaviorRules: "攻击巨人颈部-15~25，普通战斗-5~10，更换刀刃恢复至100"
- `titan_shifts` (number, default:3, min:0, max:3, category:resource) — Available titan shifts. behaviorRules: "仅巨人化角色有此变量，每次变身-1，用完后无法变身，必须休息一天才能恢复1次"
- `corps_trust` (number, default:50, min:0, max:100, category:relationship) — Survey Corps trust. behaviorRules: "成功完成作战目标+5~10，保护同伴+3~5，违抗命令-5~15，展现巨人之力初期-10后期+5"
- `casualties` (number, default:0, min:0, max:100, category:stat) — Accumulated casualties. behaviorRules: "每次战斗根据决策死亡人数+5~20，高伤亡时士气低落，叙述中加入牺牲的重量感"

**Rules:**
- `fuel-empty`: WHEN odm_fuel drops-below 10 → notify-player "燃料即将耗尽——你在空中的时间不多了。" (danger)
- `blade-break`: WHEN blade_durability drops-below 15 → notify-player "刀刃出现裂纹，下一击可能是最后一击。" (warning)
- `trust-milestone`: WHEN corps_trust rises-above 75 → notify-player "兵团的士兵们开始以不同的眼光看你了。" (info) + inject-directive for increased NPC cooperation
- `high-casualties`: WHEN casualties rises-above 50 → inject-directive for somber atmosphere, survivors questioning the mission

**Components:**
- stat-bar for odm_fuel (color: #22c55e)
- stat-bar for blade_durability (color: #94a3b8)
- stat-bar for corps_trust (color: #3b82f6)
- text-display for story_phase (format: "第 {{value}} 幕")
- text-display for casualties (format: "牺牲: {{value}}", icon: "skull", textColor: "#ef4444")

**Step 3: Write the messageRenderer TSX**

Write to `temp-translations/aot-renderer.tsx`. Design requirements:
- **Theme**: Military briefing. Background: dark olive (#1a1c18). Accent: Survey Corps green (#2d5016). Secondary: earthy brown (#78350f), wall gray (#a8a29e).
- **Wings of Freedom**: SVG wings icon in header/dividers.
- **Message parsing**: Dialogue in `「...」` → character-colored. Internal narration in `(...思考...)` → italic muted. Action `*...*` → bold.
- **Status panel**: ODM fuel + blade as horizontal bars in a "tactical readout" style. Corps trust as a shield icon with fill.
- **Character portraits**: Show character portrait beside dialogue with military rank label.
- **Decorative**: Wall texture CSS pattern. Message dividers with wing motif. Mission briefing header font style.
- **All visible text in Chinese.**

**Step 4: Inject TSX into JSON**

**Step 5: Validate JSON**

---

### Task 3: Hunter x Hunter — 「猎人的觉悟」

**Files:**
- Create: `output/hunter-hunter/猎人的觉悟-scenario.json`
- Create: `temp-translations/hxh-renderer.tsx`

**Source material:**
- `sources/hunter-hunter/meta.json`
- `sources/hunter-hunter/mal-characters.json`
- `sources/hunter-hunter/moegirl-world.json`
- `sources/hunter-hunter/images/` (24 images)

**Step 1: Read all source material**

Character image mapping: Gon=174517.jpg, Killua=327920.jpg, Kurapika=549312.jpg, Leorio=549311.jpg, Hisoka=174561.jpg, Meruem=243861.jpg, Chrollo=182387.jpg, Netero=257355.jpg, Neferpitou=253673.jpg, Kite=203429.jpg, Illumi=174521.jpg, Alluka=294552.jpg, Komugi=243865.jpg, Ging=231795.jpg, Biscuit=194667.jpg.

**Step 2: Generate the WorldDefinition JSON**

Same reference docs as Tasks 1-2.

**Entries to create:**
1. `worldview` (priority:100) — Hunter Association, Hunter license, Nen system (Ten/Zetsu/Ren/Hatsu, six types), known world geography. Character's Nen type/abilities loaded per selection.
2. `output-control` (priority:98) — Combat decision stops, Nen battle strategy moments, investigation pauses. "Togashi narration style" — analytical narrator explaining tactics mid-fight.
3. `style-guide` (priority:95) — Adventure tone with dark undercurrents. Togashi's style: lighthearted surface → devastating emotional punches. Analytical battle narration. Constrained vocabulary: aura, Nen, predator/prey, potential.
4. `char-gon` (conditions: player_character eq "gon") — Enhancement type, Jajanken, pure-hearted but terrifying dark side. Contradiction-core: "innocent" = "most dangerous when pushed."
5. `char-killua` (conditions: player_character eq "killua") — Transmutation, Godspeed/lightning, ex-assassin finding humanity. Contradiction-core: "trained killer" = "most loyal friend."
6. `char-kurapika` (conditions: player_character eq "kurapika") — Conjuration→Specialization, Chain abilities, Scarlet Eyes. Contradiction-core: "justice seeker" = "consumed by vengeance."
7. `char-leorio` (conditions: player_character eq "leorio") — Emission, medical student, heart of gold. Contradiction-core: "seemingly selfish" = "most selfless motivation."
8. `npc-roster` (priority:85) — Hisoka, Chrollo, Phantom Troupe, Biscuit, Kite, Netero, Meruem, etc.
9. `example-dialogue` (priority:80) — Togashi-style dialogue with analytical narration interspersed.
10. `lore-exam-arc` (conditions: arc_id eq "exam") — Hunter Exam phases, Hisoka encounters, character introductions.
11. `lore-yorknew-arc` (conditions: arc_id eq "yorknew") — Phantom Troupe, mafia auction, Kurapika vs Uvogin, hostage exchange.
12. `lore-gi-arc` (conditions: arc_id eq "greed-island") — Greed Island game rules, card system, Biscuit training, Genthru the Bomber.
13. `lore-chimera-arc` (conditions: arc_id eq "chimera") — Chimera Ants, NGL, King's birth, Palace invasion, Gon's transformation.
14. `lore-nen` (keywords:["念","纏","絶","練","發","オーラ","念能力"]) — Full Nen system lorebook.
15. `lore-troupe` (keywords:["旅团","幻影","蜘蛛","クモ"]) — Phantom Troupe lorebook.
16. `greeting` — Character selection (Gon/Killua/Kurapika/Leorio with portraits) → arc selection (4 arcs) → opening scene.

**Variables:**
- `arc_id`, `player_character`, `story_phase`
- `nen_level` (number, default:10, min:0, max:100, category:stat) — Nen proficiency. behaviorRules: "修炼念能力+3~8，成功战斗中运用念+2~5，接受师傅指导+5~10，强行使用超出水平的技能时-5并受伤"
- `combat_xp` (number, default:0, min:0, max:100, category:stat) — Battle experience. behaviorRules: "参与战斗+3~10（根据对手强度），击败强敌+10~15，被击败+2~3（失败也是经验），达到50时解锁角色的招牌技能完整版"
- `hunter_points` (number, default:0, min:0, max:100, category:stat) — Story progression. behaviorRules: "完成任务目标+5~15，收集关键信息+3~8，帮助同伴+2~5"
- `affinity_main` (number, default:50, min:0, max:100, category:relationship) — Bond with main companion (depends on selected character). behaviorRules: "共同战斗+3~5，保护对方+5~8，分享秘密+3~5，背叛/隐瞒-10~20"
- `danger_level` (number, default:20, min:0, max:100, category:stat) — Current threat level. behaviorRules: "遭遇强敌+10~30，进入安全区域重置为10~20，连续战斗累积+5每轮"

**Rules:**
- `nen-awakening`: WHEN nen_level rises-above 40 → notify-player "你开始感受到纏的流动——念的世界在你眼前展开。" (achievement) + inject-directive unlocking advanced Nen techniques
- `danger-critical`: WHEN danger_level rises-above 80 → notify-player "杀意……这种压迫感令人窒息。" (danger)
- `skill-unlock`: WHEN combat_xp rises-above 50 → notify-player "身体记住了战斗的节奏——你的招牌技能觉醒了。" (achievement)
- `companion-bond`: WHEN affinity_main rises-above 75 → inject-directive for deeper trust dialogue options and combo attacks

**Components:**
- stat-bar for nen_level (color: #8b5cf6, label shows Nen type based on character)
- stat-bar for combat_xp (color: #f97316)
- stat-bar for hunter_points (color: #10b981)
- stat-bar for affinity_main (color: #ec4899)
- text-display for story_phase (format: "第 {{value}} 幕")

**Step 3: Write the messageRenderer TSX**

Write to `temp-translations/hxh-renderer.tsx`. Design requirements:
- **Theme**: Adventure map. Background: deep teal (#0f172a). Accent: emerald (#059669). Secondary: gold (#d97706), Hunter License amber (#fbbf24).
- **Nen aura effects**: Subtle glow border on message containers, color varies by selected character's Nen type (Enhancement=yellow, Transmutation=purple, Conjuration=pink, Emission=red).
- **Message parsing**: Dialogue → character-colored. Narration → default. Analytical narration (Togashi-style combat explanation) → boxed "战术分析" panel with distinct styling.
- **Status panel**: Nen level as a hexagonal radar chart (simplified). Combat XP and Hunter Points as bars. Character portrait in a "Hunter License" card frame.
- **Decorative**: Hunter License card border motif. Star badge icons for achievements. Subtle world map texture.
- **All visible text in Chinese.**

**Step 4: Inject TSX into JSON**

**Step 5: Validate JSON**

---

## Execution Notes

- **Tasks 1-3 are fully independent** — dispatch as parallel subagents
- Each subagent should read source material, card-writing-knowledge.md, and schema-reference.md before generating
- **Card content must be in Chinese** (Japanese proper nouns preserved for character names)
- **messageRenderer labels/UI text must be in Chinese** — no English labels
- Each card should be ~60-120KB (scenario tier from knowledge base)
- Write TSX to temp file first, use inject-renderer.js to merge — never hand-escape TSX in JSON
- **Quality bar**: Reference sample cards in `sample card/` directory for tone and depth. Each character should have spectrum/contradiction-core personality with micro-narratives, not generic descriptions.
- The greeting must be an interactive selection experience, not just a text dump. Present characters with brief personality hooks, arcs with vivid one-line previews.
