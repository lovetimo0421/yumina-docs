# 桜色の季節 — 町内地図 UI 設計

## Overview

Add a hand-drawn style town map overlay to the 桜色の季節 VN card. The map shows all available locations with real geographical relationships, grouped logically. Pure display — no navigation/movement. Lives entirely in the card's TSX code.

## Requirements

- **Scope**: Card-specific (桜色の季節 TSX only)
- **Purpose**: Let players see available locations and their geographical layout
- **Interaction**: View-only, with hover/tap feedback on landmarks. Highlights current location.
- **Style**: Hand-drawn Japanese game map (CSS-only, no images)

## Geographical Layout

```
        ⛩️ 神社 (hilltop, NW)
                                    🏫 学校 (hilltop, NE)
                                    🎀 陽菜の家 (near school)
        📚 凛の家 (quiet area, W)
                    🌸 樱花小路 (slope connecting school → town)
        🌳 公園 (center)            🏅 茉莉の家 (near park)

                🛍️ 商店街 (south of park)

                    🚉 車站 (south end)
                    🏠 自宅 (near station)
```

Logic:
- Shrine on hilltop (classic Japanese town layout)
- School on hill (name 桜ヶ丘 = cherry blossom hill)
- Cherry path = slope from school to town center
- 陽菜's home nearest to school (childhood friend, walks to school together)
- 凛's home in quiet western residential area
- 茉莉's home near park (athletic character)
- Player's home near station (just moved to town)

## 10 Landmarks

| # | Landmark | Sub-locations | Map position |
|---|----------|---------------|--------------|
| 1 | ⛩️ 桜ヶ丘神社 | — | Top-left |
| 2 | 🏫 桜ヶ丘学園 | 校门前・教室・走廊・图书馆・体育馆・操場・天台・会議室 | Top-right |
| 3 | 🌸 樱花小路 | — | Upper-center |
| 4 | 🌳 中央公園 | — | Center |
| 5 | 🛍️ 商店街 | 喫茶店・花店・便利店・食堂 | Lower-center |
| 6 | 🚉 桜ヶ丘駅 | 夕阳街道 | Bottom-center |
| 7 | 🏠 自宅 | — | Bottom-right |
| 8 | 🎀 陽菜の家 | 陽菜的房间 | Upper-right (near school) |
| 9 | 📚 凛の家 | 凛的房间 | Middle-left |
| 10 | 🏅 茉莉の家 | 茉莉的房间 | Middle-right (near park) |

## currentBg → Landmark Mapping

```
school_gate, classroom, hallway, library, gym, track, rooftop, meeting_room → 学校
cherry_path → 樱花小路
shrine → 神社
park → 公園
cafe, flower_shop, convenience_store, cafeteria → 商店街
station, evening_street → 車站
home → 自宅
hina_room → 陽菜の家
rin_room → 凛の家
mari_room → 茉莉の家
```

## Visual Design

### Overall
- Parchment background: `#f5e6c8` with CSS noise/grain texture
- Title: 「桜ヶ丘 町内マップ」centered top, Ma Shan Zheng font
- Dashed brown lines connecting landmarks (roads)
- Subtle green gradient for hilltop areas
- Cherry blossom petal decorations in corners

### Map Button
- Fixed position: top-right corner of VN interface
- Small circle, 🗺️ icon
- Frosted glass style (backdrop-filter: blur), matching existing card UI

### Map Overlay
- Fullscreen overlay, fade-in animation (200ms)
- Close via: ✕ button / click blank area / Escape key
- Does not block game state

### Landmark Cards
- Rounded card bubbles with emoji + name
- Sub-locations listed below in small text, separated by ・
- Normal state: 80% white bg + 1px light gray border
- Current location: pink border `#f472b6` + pulse glow + 📍現在地 badge

### Hover/Tap Feedback
- Hover: `scale(1.08)` + deeper shadow + light pink border, transition 200ms ease
- Click/Tap: brief `scale(0.95)` press → bounce to `scale(1.08)`
- Current-location landmark: same scale effect, keeps pink pulse border

## Implementation

- All code inside the card's existing TSX (React.createElement, no JSX)
- New state: `showMap` (boolean)
- New constants: `LANDMARKS`, `BG_TO_LANDMARK`
- New function: `renderMap()` → returns overlay React element
- Map button inserted into VN interface top-right area
- Estimated ~250-350 lines of new code

## Not In Scope

- No click-to-move navigation
- No map zoom/drag
- No dynamic unlock (all locations always visible)
- No platform-level changes
