# Visual Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the messageRenderer into an immersive "surveillance terminal" with rich text, dual fonts, atmospheric effects, and content-aware styling.

**Architecture:** All changes are inside the card JSON file's embedded TSX code (`messageRenderer.tsxCode` and `customComponents[0].tsxCode`). Use Python patching scripts (like previous phases) to modify the TSX strings programmatically. Each task patches one logical unit.

**Tech Stack:** Python (JSON manipulation), embedded React/Preact TSX (card renderer), CSS-in-JS

**Target file:** `sample card/壺中の毒 · 大逃杀.json`

---

### Task 1: Color Palette + Panel Glow (messageRenderer)

**Files:**
- Modify: `sample card/壺中の毒 · 大逃杀.json` (messageRenderer.tsxCode)

**What:** Update the `C = {` color constants and add panel glow.

**Changes:**
- `red: "#a03020"` → `"#8a0303"` (dried blood)
- Add `system: "#7a9a6a"` (amber-green for system text)
- Add `systemDim: "rgba(122,154,106,.3)"`
- Kill broadcast header color `#c05040` → `#8a0303`
- Find panel/sidebar elements with `backdropFilter` or `border` → add `boxShadow: "0 0 10px rgba(138,106,58,.15), inset 0 0 1px rgba(255,255,255,.08)"`

**Verify:** JSON round-trip valid.

---

### Task 2: Color Palette + Panel Glow (customComponent)

**Files:**
- Modify: `sample card/壺中の毒 · 大逃杀.json` (customComponents[0].tsxCode)

**What:** Sync customComponent colors with messageRenderer.

**Changes:**
- `blood: "#6b3a3a"` → `"#8a0303"`
- `red: "#a03040"` → `"#8a0303"`
- Add `system: "#7a9a6a"` to C object
- Kill broadcast text `#c05050` → `#8a0303`
- Panel borders → add glow boxShadow

**Verify:** JSON round-trip valid.

---

### Task 3: Atmospheric Layer (messageRenderer)

**Files:**
- Modify: `sample card/壺中の毒 · 大逃杀.json` (messageRenderer.tsxCode)

**What:** Add vignette background + CRT scanlines overlay.

**Changes:**

1. Find the outermost container div of the message render (the one with `background: linear-gradient(170deg, ...)`) and layer the vignette underneath:
   - Container background: `radial-gradient(ellipse at center, #1a1814 0%, #050504 100%)`
   - The existing time-of-day gradient goes on top as an overlay

2. Add a `<style>` block (or inline) for CRT scanlines:
   ```
   After the main content div, add a pseudo-overlay div:
   position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
   background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.03) 2px, rgba(0,0,0,.03) 4px)"
   ```

**Verify:** Visual check — message area should have darker edges and barely-visible horizontal lines.

---

### Task 4: Rich Text Renderer (messageRenderer)

**Files:**
- Modify: `sample card/壺中の毒 · 大逃杀.json` (messageRenderer.tsxCode)

**What:** Replace the plain text rendering with a content-aware rich text system. This is the largest task.

**The renderer function `renderRichText(text)`:**

Processing order:
1. Already-extracted: `♠佐倉井の心声♠` (handled before this, replaced with placeholders)
2. Split text into segments by detecting patterns
3. Render each segment with appropriate styling

**Pattern priority (processed in this order):**

```javascript
function renderRichText(text) {
  // Split into lines first
  var lines = text.split("\n");
  var elements = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // 1. Status header: 【第X日 | 存活:... | KP:...】
    if (/^【第\d+日/.test(line)) {
      elements.push(h("div", { style: STATUS_HEADER_STYLE }, line));
      continue;
    }

    // 2. Markdown heading: # Title
    if (/^#{1,3}\s/.test(line)) {
      var level = line.match(/^(#{1,3})/)[1].length;
      var text = line.replace(/^#{1,3}\s+/, "");
      elements.push(h("div", { style: HEADING_STYLES[level] }, text));
      continue;
    }

    // 3. Horizontal rule: ---
    if (/^---+$/.test(line.trim())) {
      elements.push(h("hr", { style: HR_STYLE }));
      continue;
    }

    // 4. Blockquote: > text
    if (/^>\s/.test(line)) {
      elements.push(h("div", { style: QUOTE_STYLE }, renderInline(line.slice(2))));
      continue;
    }

    // 5. Normal line → render inline markdown
    elements.push(h("div", { style: PARAGRAPH_STYLE }, renderInline(line)));
  }

  return elements;
}
```

**Inline rendering `renderInline(text)`:**
```javascript
function renderInline(text) {
  // Process: **bold**, *italic*, 「dialogue」
  var parts = [];
  var regex = /(\*\*(.+?)\*\*|\*(.+?)\*|「(.+?)」)/g;
  var lastIndex = 0;
  var match;

  while ((match = regex.exec(text)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // **bold**
      parts.push(h("strong", { style: { color: C.text, fontWeight: 600 } }, match[2]));
    } else if (match[3]) {
      // *italic*
      parts.push(h("em", { style: { fontStyle: "italic", opacity: .85 } }, match[3]));
    } else if (match[4]) {
      // 「dialogue」
      parts.push(h("span", { style: DIALOGUE_STYLE }, "「" + match[4] + "」"));
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : text;
}
```

**Style constants:**
```javascript
var STATUS_HEADER_STYLE = {
  fontFamily: mono, color: C.system, fontSize: "15px", fontWeight: 700,
  letterSpacing: "2px", textAlign: "center", padding: "12px 0 8px",
  background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(122,154,106,.02) 2px, rgba(122,154,106,.02) 4px)",
  borderBottom: "1px solid rgba(122,154,106,.15)", marginBottom: "12px"
};

var HEADING_STYLES = {
  1: { fontSize: "18px", fontWeight: 600, letterSpacing: "3px", textAlign: "center", color: C.text, margin: "16px 0 8px" },
  2: { fontSize: "15px", fontWeight: 600, letterSpacing: "1px", color: C.gold, margin: "12px 0 6px" },
  3: { fontSize: "13px", fontWeight: 600, color: C.textDim, margin: "8px 0 4px" }
};

var HR_STYLE = {
  border: "none", borderTop: "1px solid rgba(138,106,58,.15)",
  margin: "16px 0", opacity: .6
};

var QUOTE_STYLE = {
  borderLeft: "2px solid rgba(138,106,58,.25)", paddingLeft: "12px",
  marginLeft: "4px", color: C.textDim, fontStyle: "italic", lineHeight: "1.8"
};

var DIALOGUE_STYLE = {
  color: "#d4c8a0", fontSize: "1.02em"
};

var PARAGRAPH_STYLE = {
  lineHeight: "2.0", margin: "2px 0"
};
```

**Integration point:** Find where the message body text is currently rendered (likely a single `h("div", ..., displayContent)` or `h("span", ..., displayContent)`). Replace the plain text output with `renderRichText(displayContent)`.

**Verify:** JSON valid. Test with a message containing `**bold**`, `# heading`, `> quote`, `「dialogue」`.

---

### Task 5: Update Greeting Entries

**Files:**
- Modify: `sample card/壺中の毒 · 大逃杀.json` (entries array)

**What:** Add Markdown markup to greeting entries so the rich text renderer makes them visually interesting.

**Entry: br-greeting-create (角色创建 + 毕业典礼)**
Current: plain text paragraph.
Changes:
- Keep content essentially the same
- Add `---` scene breaks between major beats
- Wrap 権藤's rules in detectable terminal format
- Use `**bold**` for dramatic emphasis

**Entry: br-greeting-day3 (Day3 洞窟)**
- The status line `【第3日 | 存活：32/40 | KP：0】` already exists → renderer auto-styles it
- Add `**bold**` on key dramatic lines
- Add `---` between scene shifts

**Entry: br-greeting-day7 (Day7 最终日)**
- Status line already exists
- Add `**bold**` for 击杀播报 data
- Add `---` between the broadcast reading and the aftermath
- 権藤's terminal message gets wrapped as a quote: `> 发送者：権藤英治`

**Verify:** Load the card, check that greetings render with styled headers, bold text, separators.

---

### Task 6: Commit + Final Verification

**Step 1:** Run `pnpm typecheck` to ensure no engine/app breakage
**Step 2:** Verify JSON validity with Python round-trip
**Step 3:** Visual checklist:
- [ ] Status headers render in monospace amber-green with scanline bg
- [ ] Kill broadcasts use deep blood red `#8a0303`
- [ ] `**bold**` text renders bold
- [ ] `「dialogue」` has gold tint
- [ ] `> quote` has left border + indent
- [ ] `---` renders as subtle separator
- [ ] Panels have subtle glow shadow
- [ ] Message area has vignette (darker edges)
- [ ] CRT scanlines barely visible

---

## Execution Notes

- All changes are via Python scripts modifying the JSON file's embedded TSX strings
- No engine/server code changes needed
- The `renderRichText` function is the core addition (~80 lines of JS)
- Greeting content changes are plain text edits in the entries array
- customComponent only gets color sync, no rich text (it's UI, not narrative)
