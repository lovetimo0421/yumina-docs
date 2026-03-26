# Design: English Card — "Poison in the Bottle · Battle Royale"

## Summary

Translate the card `壺中の毒 · 大逃杀.json` into a full English version for English-speaking players. Output: new file `Poison in the Bottle · Battle Royale.json` in `sample card/`.

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Card title | "Poison in the Bottle · Battle Royale" | User-selected |
| Character names | Keep Japanese names, romaji transliteration | Authentic to source |
| Frontend target | customComponents only (not messageRenderer) | Custom UI is the real frontend |
| Output | New file alongside original | Preserve original |
| Approach | Chunk-by-chunk manual translation | Best quality for nuanced character content |

## Scope of Translation

All Chinese-language strings in the following sections:

1. **reactions** — `name`, `description`, inline `value` strings (notification text, directive text)
2. **entries** — all `content` blocks (worldview, island scene, character descriptions, lore)
3. **variables** — `name`, `label`, `description` fields
4. **customComponents** — all UI text (labels, stat names, notifications, kill feed text)
5. **Card-level metadata** — `name`, `author`, `description`

## What Does NOT Change

- All field keys and IDs (e.g., `"id": "dead-names"`, variable IDs) — stay as-is
- Japanese proper names within text — transliterated to romaji (e.g., 佐倉井君華 → Sakurai Kimika)
- JSON structure — identical to source
- `messageRenderer` code — not translated

## Translation Principles

- Preserve narrative voice: Kimika's inner monologue must retain its cold, calculated, contemptuous tone
- Preserve dramatic register: battle royale broadcast text stays terse and military-style
- Japanese loan phrases that have cultural weight (e.g., 「ちょろすぎ♪」) get an English equivalent that preserves the feel, not just the literal meaning
- All XML-style tags (`<worldview>`, `<character_...>`, etc.) preserved as-is

## Success Criteria

- New card file loads in Yumina without errors
- All player-visible text is English
- Character voice and narrative tone are preserved across the translation
- Japanese character names consistent throughout
