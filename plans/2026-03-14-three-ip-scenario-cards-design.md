# Three IP Scenario Cards — Design Doc

Date: 2026-03-14

## Overview

Three premium scenario-level cards for IPs with existing scraped source material:
- Chainsaw Man (電鋸人)
- Attack on Titan (進撃の巨人)
- Hunter x Hunter (全職獵人)

Each card: one per IP, high quality, story-immersive, arc-selection model.

## Shared Architecture

### Card Structure
- **Type**: Scenario (single card per IP)
- **First Message**: Two-step selection
  1. Choose character (with avatar + brief intro)
  2. Choose story arc (3-4 major arcs)
- **System Prompt**: World context + selected character personality + arc setup
- **Lorebook**: Conditional entries per arc (`arc_id == "xxx"`)
- **Variables**: `arc_id`, `player_character`, `story_phase`, affinity per character, IP-specific mechanics
- **Rules**: Story progression triggers, phase transitions, relationship changes
- **messageRenderer**: Unique per card, IP-themed, with character avatars from downloaded images
- **Language**: All user-facing text in Chinese, Japanese proper nouns preserved

### messageRenderer Requirements
- Parse message content: dialogue, action, narration (visually distinct)
- Character avatars from downloaded MAL images
- Status panel (arc progress, relationships, IP mechanics)
- IP-specific color scheme and visual motifs
- All UI labels in Chinese

## Card 1: Chainsaw Man — 「恶魔猎人的日常」

### Playable Characters
- デンジ (Denji) — 492407.jpg
- 早川アキ (Aki Hayakawa) — 395003.jpg
- パワー (Power) — 494969.jpg
- ヒグマヤマコベニ (Kobeni) — 467961.jpg

### Story Arcs
1. **永恒恶魔篇** — Trapped in infinite hotel, 3-day fight
2. **武士刀篇** — Public Safety ambush, revenge arc
3. **蕾塞篇** — Rain-soaked romance and assassination
4. **支配恶魔篇** — Makima's true identity, final confrontation

### IP Mechanics
- 恐惧值 (Fear Level): affects devil power strength
- 血量 (Blood): drink blood to regenerate
- 契约代价 (Contract Cost): track lifespan/body costs

### messageRenderer Theme
Dark punk aesthetic. Blood red + iron gray palette. Chainsaw-tooth borders, blood splatter decorations. Character dialogue boxes with avatars.

### Key Characters (with images)
Denji, Makima, Aki, Power, Reze, Kobeni, Pochita, Himeno, Kishibe, Beam, Angel Devil, Samurai Sword

## Card 2: Attack on Titan — 「自由的代价」

### Playable Characters
- エレン (Eren Yeager) — 216895.jpg
- ミカサ (Mikasa Ackerman) — 215563.jpg
- リヴァイ (Levi) — 241413.jpg
- アルミン (Armin Arlert) — 220267.jpg

### Story Arcs
1. **托洛斯特攻防战** — First titan transformation, humanity's first victory
2. **女型巨人篇** — 57th Expedition, Female Titan pursuit
3. **玛利亚之墙夺还战** — Beast Titan, serum choice, basement truth
4. **马莱篇** — Infiltration, declaration of war

### IP Mechanics
- 立体机动装置 (ODM Gear): fuel + blade durability
- 巨人化次数 (Titan Shifts): limited per arc
- 兵团信任度 (Corps Trust): affects ally support

### messageRenderer Theme
Military briefing style. Dark green + earthy brown palette. Wings of Freedom crest. Wall texture backgrounds. Battle report format panels.

### Key Characters (with images)
Eren, Mikasa, Armin, Levi, Erwin, Hange, Jean, Annie, Krista/Historia, Ymir, Bertolt, Connie, Sasha, Reiner, Petra, Grisha

## Card 3: Hunter x Hunter — 「猎人的觉悟」

### Playable Characters
- ゴン (Gon Freecss) — 174517.jpg
- キルア (Killua Zoldyck) — 327920.jpg
- クラピカ (Kurapika) — 549312.jpg
- レオリオ (Leorio) — 549311.jpg

### Story Arcs
1. **猎人考试篇** — Deadly selection, first encounter with Hisoka
2. **约克新城篇** — Phantom Troupe vs mafia auction, Kurapika's revenge
3. **贪婪之岛篇** — Nen training, game world adventure
4. **嵌合蚁篇** — Ant King and Komugi, humanity's malice

### IP Mechanics
- 念能力等级 (Nen Level): 纏→絶→練→發 progression
- 战斗经验值 (Combat XP): unlocks techniques
- 猎人积分 (Hunter Points): story progression currency

### messageRenderer Theme
Adventure map style. Emerald green + gold palette. Hunter License card elements. Nen aura glow borders. Hexagonal ability radar chart.

### Key Characters (with images)
Gon, Killua, Kurapika, Leorio, Hisoka, Meruem, Chrollo, Netero, Neferpitou, Kite, Illumi, Alluka, Komugi, Ging, Biscuit

## Image Assets

All character images downloaded to `sources/{slug}/images/`:
- Chainsaw Man: 24 images (4 Main + 20 Supporting)
- Attack on Titan: 23 images (3 Main + 20 Supporting)
- Hunter x Hunter: 24 images (4 Main + 20 Supporting)

## Output

Cards written to `output/` directory as WorldDefinition v13 JSON.
