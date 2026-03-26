# Visual Overhaul Design: 壺中の毒 · 大逃杀

## Goal
Transform the chat rendering from flat uniform text into an immersive "surveillance terminal" experience with rich typography, atmospheric effects, and content-aware styling.

## Design Decisions

### 1. Dual Font System
- **Narrative** (serif): `Noto Serif SC, Songti SC, Georgia, serif` — story, dialogue, inner thoughts
- **System** (mono): `SF Mono, Consolas, Courier New, monospace` — status headers, kill broadcasts data, rules, HUD, terminal messages
- System text color: **amber-green `#7a9a6a`** (harmonizes with existing gold palette)

### 2. Atmospheric Layer (CSS overlays on message area)
- **Vignette**: `radial-gradient(ellipse at center, #1a1814 0%, #050504 100%)` on container background
- **CRT scanlines**: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px)` overlay, pointer-events:none
- Existing paper texture opacity bumped from .04 to .06

### 3. Color Palette Update
| Token | Old | New | Usage |
|---|---|---|---|
| blood/death | `#a03020` | `#8a0303` | Dead names, kill broadcasts, low HP |
| system text | `#8a6a3a` (gold) | `#7a9a6a` (amber-green) | Status headers, rules, terminal |
| panel glow | none | `boxShadow: 0 0 10px rgba(138,106,58,.15), inset 0 0 1px rgba(255,255,255,.08)` | Floating tactical panel feel |

### 4. Rich Text Rendering (messageRenderer)
Auto-detect patterns in message content and apply styled rendering:

| Pattern | Detection | Rendering |
|---|---|---|
| `【第X日 \| 存活:...\| KP:...】` | Regex | Large monospace, amber-green, centered, scanline bg |
| `【击杀播报】...` | indexOf (existing) | Dark red bg, monospace header, blood border, flicker (existing enhanced) |
| `「dialogue」` | Regex `「...」` | Serif, slightly larger, gold quote marks, subtle left indent |
| `♠佐倉井の心声：...♠` | Regex (existing) | Ink blot hidden text (keep existing) |
| Terminal/権藤 messages | Detect `「発信者：権藤」` or similar | Monospace, amber-green, terminal-style box with border |
| `**bold**` | Markdown | Bold + slight color brightening |
| `*italic*` | Markdown | Italic, used for inner thoughts |
| `# Heading` | Markdown | Large text, centered, wide letter-spacing |
| `> Quote` | Markdown | Left border + indent + darker bg strip |
| `---` | Markdown | Decorative separator line |

Processing order: extract ♠心声♠ first → split by patterns → render each segment with appropriate style.

### 5. Greeting Content Enhancement
Modify greeting entries to use Markdown + detectable patterns:
- Status header on its own line: `【第1日 | 存活: 40/40】`
- Use `**bold**` for dramatic emphasis
- Use `---` for scene breaks
- Use `>` for flashback/memory segments
- Rules section wrapped in detectable pattern for terminal styling

### 6. CustomComponent Color Sync
Update the `C` object in customComponent to match new palette:
- `blood` / `red` → `#8a0303`
- Panel borders get glow shadow
- No rich text changes needed (game panel is UI, not narrative)

## Files to Modify
- `sample card/壺中の毒 · 大逃杀.json`:
  - messageRenderer tsxCode (rich text renderer, colors, atmosphere)
  - customComponent tsxCode (color sync, panel glow)
  - greeting entries content (Markdown markup)

## Not In Scope
- customComponent internal UI layout changes
- New animations beyond color/shadow tweaks
- Font file bundling (all fonts are web-safe or Google Fonts already loaded)
