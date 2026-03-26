# Shelter Simulator (避难所模拟器) Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the SillyTavern "避难所模拟器" card to a Yumina WorldDefinition with Fallout/Pip-Boy themed messageRenderer.

**Architecture:** 12 JSON variables (dot-path stateChanges for granular updates), structuredOutput JSON mode, custom TSX messageRenderer with CRT terminal aesthetic. Choices stored in a `choices` variable rendered by messageRenderer.

**Tech Stack:** Yumina WorldDefinition v14, React TSX messageRenderer, structuredOutput JSON

---

## Variable Design

12 variables, all JSON type except where noted:

| Variable ID | Type | Purpose |
|---|---|---|
| `world` | json | { date, time, disaster, status, timeline } |
| `shelter` | json | { spaceSize, spaceDesc, equipment, equipmentDesc, jobComp, jobDesc, ethnicComp, ethnicDesc, experiment, experimentDesc, resources: { power, water, food, pop (each {current,max}) }, environment: { hygiene, sanity }, macro: { governance, defense, stealth } } |
| `social` | json | 7 policies, each { name, desc } |
| `overseer` | json | { name, location, ap, hp, special: {S,P,E,C,I,A,L}, traits, personality, status } |
| `factions` | json | Record<name, { purpose, favor, leader, count }> |
| `facilities` | json | Record<name, { level, effect, desc }> |
| `inventory` | json | Record<name, { type, desc, effects, quantity }> |
| `followers` | json | Record<name, { age, gender, appearance, personality, hobby, weakness, contrast, combat, management, exploration, hp, armor, status, loyalty, equipment, traits }> |
| `diplomacy` | json | Record<id, { name, intro, level, favor, relation }> |
| `chronicle` | json | string[] event log |
| `choices` | json | string[] current options |
| `opening_config` | json | Opening game settings (set once) |

## Entry Design (9 entries)

1. **game-system** (system, top, priority 100) — Core game instructions + output format (adapted from 单api正文格式)
2. **variable-rules** (system, after_char, depth 1, priority 90) — Variable update rules (adapted from 变量更新规则)
3. **special-system** (lore, after_char, depth 1, priority 85) — SPECIAL attributes + bonus table + difficulty classes + luck (merged 判定规则)
4. **special-descriptions** (lore, after_char, depth 4, priority 50) — Flavorful SPECIAL level descriptions
5. **opening-config** (system, after_char, depth 0, priority 95) — Current game configuration (adapted from 开局信息)
6. **cot-opening** (system, after_char, depth 0, priority 80, conditions: only first turns) — Compressed opening COT
7. **cot-gameplay** (system, post_history, priority 99) — Compressed gameplay COT + anti-flattery check
8. **chronicle-context** (lore, after_char, depth 4, priority 60) — Injects chronicle variable for context
9. **greeting** (greeting, greeting) — Opening narrative

## MessageRenderer Design

Fallout Pip-Boy / CRT terminal themed TSX:
- Dark background with green (#00ff41) phosphor text
- CRT scanline overlay
- Monospace font (VT323 or similar)
- Tab navigation: STATUS | INVENTORY | DATA
- Resource bars with Fallout-style ASCII art
- Narrative text with typing/fade effect
- Choice buttons with terminal aesthetics
- Streaming support via isStreaming/streamingContent

## Tasks

### Task 1: Build Variable Definitions
Create all 12 variables with correct types, defaults from [InitVar], categories, and behaviorRules.

### Task 2: Migrate Core Entries (game-system, variable-rules, opening-config)
Adapt the 3 most critical entries from ST format to Yumina structuredOutput format.

### Task 3: Migrate Mechanics Entries (special-system, special-descriptions)
Merge 判定规则 + SPECIAL into optimized entries.

### Task 4: Build Compressed COT Entries (cot-opening, cot-gameplay)
Compress the 14-step opening COT and 6-step gameplay COT to ~40% of original while preserving core logic.

### Task 5: Build MessageRenderer TSX
Create the Fallout/Pip-Boy terminal themed message renderer.

### Task 6: Create Greeting & Chronicle Entry
Build the opening narrative and chronicle context entry.

### Task 7: Assemble WorldDefinition JSON
Combine all pieces into final output file.

### Task 8: Review & Polish
Verify all fields, fix inconsistencies, ensure greeting works.
