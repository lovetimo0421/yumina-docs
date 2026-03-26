# 桜色の季節 Map UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a hand-drawn style town map overlay to the 桜色の季節 card's VN component, showing 10 landmarks with real geographical layout and current-location highlighting.

**Architecture:** All code lives inside the card's TSX (`customComponents[0].tsxCode` in the JSON file). New constants (`LANDMARKS`, `BG_TO_LANDMARK`), one new state (`showMap`), one render function (`renderMap`), and a map button replacing the existing placeholder div in the top bar. CSS-only hand-drawn aesthetic with parchment background, dashed roads, and landmark cards.

**Tech Stack:** Pure React.createElement (no JSX), CSS inline styles, existing Ma Shan Zheng font.

---

### Task 1: Add LANDMARKS and BG_TO_LANDMARK constants

**Files:**
- Modify: `sample card/桜色の季節.json` → `customComponents[0].tsxCode`

**What:** Insert two new constants after the existing `SPRITES` object (after line 59 in the extracted TSX). These define the 10 landmarks and map each `currentBg` value to its parent landmark.

**Step 1: Add the constants**

Insert after the closing `};` of SPRITES (after line 59):

```javascript
var LANDMARKS = [
  { id: 'shrine', emoji: '⛩️', name: '桜ヶ丘神社', sub: null, top: 8, left: 12 },
  { id: 'school', emoji: '🏫', name: '桜ヶ丘学園', sub: '校门・教室・走廊・图书馆・体育馆・操场・天台・会议室', top: 6, left: 58 },
  { id: 'hina_home', emoji: '🎀', name: '陽菜の家', sub: '陽菜的房间', top: 24, left: 72 },
  { id: 'rin_home', emoji: '📚', name: '凛の家', sub: '凛的房间', top: 42, left: 8 },
  { id: 'cherry_path', emoji: '🌸', name: '樱花小路', sub: null, top: 30, left: 42 },
  { id: 'park', emoji: '🌳', name: '中央公園', sub: null, top: 48, left: 40 },
  { id: 'mari_home', emoji: '🏅', name: '茉莉の家', sub: '茉莉的房间', top: 48, left: 70 },
  { id: 'shopping', emoji: '🛍️', name: '商店街', sub: '喫茶店・花店・便利店・食堂', top: 64, left: 35 },
  { id: 'station', emoji: '🚉', name: '桜ヶ丘駅', sub: '夕阳街道', top: 82, left: 40 },
  { id: 'home', emoji: '🏠', name: '自宅', sub: null, top: 80, left: 68 }
];

var BG_TO_LANDMARK = {
  school_gate: 'school', classroom: 'school', hallway: 'school', library: 'school',
  gym: 'school', track: 'school', rooftop: 'school', meeting_room: 'school',
  cherry_path: 'cherry_path',
  shrine: 'shrine',
  park: 'park',
  cafe: 'shopping', flower_shop: 'shopping', convenience_store: 'shopping', cafeteria: 'shopping',
  station: 'station', evening_street: 'station',
  home: 'home',
  hina_room: 'hina_home',
  rin_room: 'rin_home',
  mari_room: 'mari_home'
};
```

**Step 2: Verify JSON is still valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('sample card/桜色の季節.json','utf8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

**Step 3: Commit**

```bash
git add "sample card/桜色の季節.json"
git commit -m "feat(card): add LANDMARKS and BG_TO_LANDMARK constants for map system"
```

---

### Task 2: Add showMap state and map keyframe animations

**Files:**
- Modify: `sample card/桜色の季節.json` → `customComponents[0].tsxCode`

**Step 1: Add showMap state**

Insert after the existing `showBacklog`/`setShowBacklog` state (after line 95 in extracted TSX):

```javascript
var mapArr = React.useState(false);
var showMap = mapArr[0];
var setShowMap = mapArr[1];
```

**Step 2: Add map CSS keyframes**

In the existing `React.createElement('style', null, ...)` block (line 747-751), append these keyframes to the string:

```javascript
'@keyframes mapPulse{0%,100%{box-shadow:0 0 0 0 rgba(244,114,182,0.4)}50%{box-shadow:0 0 0 8px rgba(244,114,182,0)}}' +
'@keyframes mapFadeIn{from{opacity:0}to{opacity:1}}'
```

**Step 3: Verify JSON valid, commit**

---

### Task 3: Add renderMap function

**Files:**
- Modify: `sample card/桜色の季節.json` → `customComponents[0].tsxCode`

**What:** Add the `renderMap()` function that builds the full map overlay element. Insert before the `return React.createElement(...)` statement (before line 736).

**Step 1: Write the renderMap function**

```javascript
function renderMap() {
  var currentLandmark = BG_TO_LANDMARK[v.currentBg] || 'home';

  // SVG dashed roads connecting landmarks
  var roads = [
    { x1: 22, y1: 16, x2: 48, y2: 36 },   // shrine → cherry_path
    { x1: 65, y1: 14, x2: 52, y2: 36 },   // school → cherry_path
    { x1: 78, y1: 30, x2: 68, y2: 14 },   // hina_home → school
    { x1: 48, y1: 38, x2: 46, y2: 52 },   // cherry_path → park
    { x1: 18, y1: 48, x2: 36, y2: 52 },   // rin_home → park
    { x1: 75, y1: 54, x2: 54, y2: 54 },   // mari_home → park
    { x1: 46, y1: 56, x2: 42, y2: 68 },   // park → shopping
    { x1: 42, y1: 72, x2: 46, y2: 86 },   // shopping → station
    { x1: 54, y1: 88, x2: 72, y2: 86 }    // station → home
  ];

  var roadEls = React.createElement('svg', {
    style: { position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 },
    viewBox: '0 0 100 100',
    preserveAspectRatio: 'none'
  },
    roads.map(function(r, i) {
      return React.createElement('line', {
        key: i,
        x1: r.x1, y1: r.y1, x2: r.x2, y2: r.y2,
        stroke: '#a0845e',
        strokeWidth: '0.4',
        strokeDasharray: '1.2 0.8',
        strokeLinecap: 'round',
        opacity: 0.5
      });
    })
  );

  var landmarkEls = LANDMARKS.map(function(lm) {
    var isCurrent = lm.id === currentLandmark;
    return React.createElement('div', {
      key: lm.id,
      'data-no-advance': 'true',
      onMouseEnter: function(e) {
        if (!isCurrent) e.currentTarget.style.borderColor = 'rgba(244,114,182,0.5)';
        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
      },
      onMouseLeave: function(e) {
        if (!isCurrent) e.currentTarget.style.borderColor = 'rgba(160,132,94,0.3)';
        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
        e.currentTarget.style.boxShadow = isCurrent ? '0 0 0 3px rgba(244,114,182,0.3)' : '0 2px 8px rgba(0,0,0,0.1)';
      },
      onMouseDown: function(e) {
        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(0.95)';
      },
      onMouseUp: function(e) {
        e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.08)';
      },
      style: {
        position: 'absolute',
        top: lm.top + '%',
        left: lm.left + '%',
        transform: 'translate(-50%, -50%)',
        background: isCurrent ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.8)',
        border: isCurrent ? '2px solid #f472b6' : '1px solid rgba(160,132,94,0.3)',
        borderRadius: 10,
        padding: '8px 12px',
        cursor: 'pointer',
        zIndex: 2,
        textAlign: 'center',
        minWidth: 80,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: isCurrent ? '0 0 0 3px rgba(244,114,182,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
        animation: isCurrent ? 'mapPulse 2s ease-in-out infinite' : 'none',
        fontFamily: "'Ma Shan Zheng','LXGW WenKai','Noto Serif SC',serif"
      }
    },
      isCurrent ? React.createElement('div', {
        style: {
          position: 'absolute', top: -10, right: -10,
          background: '#f472b6', color: '#fff',
          fontSize: 9, padding: '2px 6px', borderRadius: 8,
          whiteSpace: 'nowrap', fontWeight: 700,
          boxShadow: '0 1px 4px rgba(244,114,182,0.4)'
        }
      }, '\ud83d\udccd\u73fe\u5728\u5730') : null,
      React.createElement('div', {
        style: { fontSize: 20, lineHeight: 1.2 }
      }, lm.emoji),
      React.createElement('div', {
        style: { fontSize: 13, color: '#4a3728', fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap' }
      }, lm.name),
      lm.sub ? React.createElement('div', {
        style: { fontSize: 10, color: '#8b7355', marginTop: 3, lineHeight: 1.4, maxWidth: 120 }
      }, lm.sub) : null
    );
  });

  // Decorative cherry blossom petals on map corners
  var petalDeco = ['🌸', '🌸', '🌸', '🌸'].map(function(p, i) {
    var positions = [
      { top: 4, left: 4 }, { top: 4, right: 4 },
      { bottom: 4, left: 4 }, { bottom: 4, right: 4 }
    ];
    var pos = positions[i];
    var s = { position: 'absolute', fontSize: 22, opacity: 0.3, pointerEvents: 'none' };
    Object.keys(pos).forEach(function(k) { s[k] = pos[k] + '%'; });
    return React.createElement('span', { key: 'petal' + i, style: s }, p);
  });

  // Hilltop green gradient (top area)
  var hilltopGradient = React.createElement('div', {
    style: {
      position: 'absolute', top: 0, left: 0, right: 0, height: '28%',
      background: 'linear-gradient(180deg, rgba(139,195,130,0.2) 0%, transparent 100%)',
      borderRadius: '16px 16px 0 0',
      pointerEvents: 'none', zIndex: 0
    }
  });

  return React.createElement('div', {
    'data-no-advance': 'true',
    onClick: function(e) { e.stopPropagation(); setShowMap(false); },
    style: {
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
      animation: 'mapFadeIn 0.2s ease'
    }
  },
    React.createElement('div', {
      onClick: function(e) { e.stopPropagation(); },
      style: {
        position: 'relative',
        width: '92%', maxWidth: 600,
        height: '80vh', maxHeight: 700,
        background: 'linear-gradient(170deg, #f5e6c8 0%, #efe0c4 40%, #e8d5b0 100%)',
        borderRadius: 16,
        border: '2px solid rgba(160,132,94,0.4)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }
    },
      // Title bar
      React.createElement('div', {
        style: {
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '14px 18px', position: 'relative', flexShrink: 0
        }
      },
        React.createElement('span', {
          style: {
            fontSize: 20, color: '#4a3728', fontWeight: 700,
            fontFamily: "'Ma Shan Zheng','LXGW WenKai','Noto Serif SC',serif",
            textShadow: '0 1px 0 rgba(255,255,255,0.6)'
          }
        }, '\u685c\u30f6\u4e18 \u753a\u5185\u30de\u30c3\u30d7'),
        React.createElement('button', {
          onClick: function() { setShowMap(false); },
          style: {
            position: 'absolute', right: 14, top: 12,
            background: 'rgba(160,132,94,0.15)', border: '1px solid rgba(160,132,94,0.3)',
            color: '#8b7355', fontSize: 16, cursor: 'pointer',
            width: 30, height: 30, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease'
          },
          onMouseEnter: function(e) { e.currentTarget.style.background = 'rgba(160,132,94,0.3)'; },
          onMouseLeave: function(e) { e.currentTarget.style.background = 'rgba(160,132,94,0.15)'; }
        }, '\u2715')
      ),
      // Map body
      React.createElement('div', {
        style: {
          flex: 1, position: 'relative', margin: '0 14px 14px', borderRadius: 12,
          border: '1px solid rgba(160,132,94,0.2)', overflow: 'hidden'
        }
      },
        hilltopGradient,
        roadEls,
        landmarkEls,
        petalDeco
      )
    )
  );
}
```

**Step 2: Verify JSON valid**

**Step 3: Commit**

```bash
git add "sample card/桜色の季節.json"
git commit -m "feat(card): add renderMap function for town map overlay"
```

---

### Task 4: Add map button and wire up overlay

**Files:**
- Modify: `sample card/桜色の季節.json` → `customComponents[0].tsxCode`

**Step 1: Replace the placeholder div with a map button**

In the top bar (line 795-796 in extracted TSX), replace:

```javascript
// 占位元素保持布局平衡
React.createElement('div', { style: { width: 80 } })
```

with:

```javascript
React.createElement('button', {
  onClick: function(e) { e.stopPropagation(); setShowMap(true); },
  style: {
    background: 'rgba(10,20,50,0.55)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.2)',
    borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)'
  }
}, '\ud83d\uddfa\ufe0f \u5730\u56f3')
```

**Step 2: Add map overlay to render tree**

In the main return statement, after the backlog overlay (after line 1186 — `showBacklog && React.createElement(...)`), and before the final closing `)` of the root div, add:

```javascript
showMap && renderMap()
```

**Step 3: Add Escape key handler for map**

In the existing Escape handler or as a new useEffect, close the map on Escape. Find the existing keyboard handling or add a new effect after the showMap state:

```javascript
React.useEffect(function() {
  if (!showMap) return;
  function handleKey(e) {
    if (e.key === 'Escape') setShowMap(false);
  }
  window.addEventListener('keydown', handleKey);
  return function() { window.removeEventListener('keydown', handleKey); };
}, [showMap]);
```

**Step 4: Verify JSON valid, test in browser**

Open http://localhost:5173, load the 桜色の季節 card, click the 🗺️ 地図 button in the top-right corner. Verify:
- Map overlay appears with fade-in
- 10 landmarks visible at correct positions
- Current location has pink border + 📍現在地 badge + pulse animation
- Hovering landmarks: scale up + shadow deepens
- Clicking landmarks: press effect
- Close via ✕ / click outside / Escape

**Step 5: Commit**

```bash
git add "sample card/桜色の季節.json"
git commit -m "feat(card): wire up map button and overlay in VN top bar"
```

---

### Task 5: Visual polish and position tuning

**Files:**
- Modify: `sample card/桜色の季節.json` → `customComponents[0].tsxCode`

**What:** After seeing the map in the browser, fine-tune landmark positions (top/left percentages) and road connections so the layout looks balanced and natural. Adjust spacing if landmarks overlap.

**Step 1: Open in browser and screenshot**

Check for overlapping landmarks, road lines that don't connect properly, or unbalanced spacing.

**Step 2: Adjust positions if needed**

Tune the `top` and `left` values in the `LANDMARKS` array and the `x1/y1/x2/y2` values in the `roads` array inside `renderMap()`.

**Step 3: Final verify and commit**

```bash
git add "sample card/桜色の季節.json"
git commit -m "style(card): tune map landmark positions and road layout"
```
