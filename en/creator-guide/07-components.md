# Custom Frontend Guide

> Your world doesn't have to look like a chat window. This guide shows you how to turn it into anything you want — without writing the code yourself.

---

## The short version

By default, Yumina displays AI replies as plain text. But you can customize two things:

- **Message Renderer (`messageRenderer`)**: changes how each AI message looks. Turn plain text into speech bubbles, visual novels, battle logs…
- **Custom Components (`customComponents`)**: additional UI panels. Build character creation screens, game sidebars, full-screen maps…

Both require TSX code, but **you don't need to write it yourself**. Use AI to generate it:

- **Built-in method**: click **Enter Studio** in the editor → open the **AI Assistant** panel → describe what you want in plain English
- **External method**: describe your requirements to Claude / ChatGPT / DeepSeek, get the code, copy and paste it in

That's really all there is to it. Details below ᕕ( ᐛ )ᕗ

---

## The detailed version

### Three rendering modes

Yumina's frontend rendering has three levels, from simple to complex:

#### 1. Default mode: do nothing

AI replies display as plain Markdown text. Works fine, but nothing special. Good for when you're first building a world and just want the logic working.

#### 2. messageRenderer: reskin message display

A TSX code snippet that replaces the default text rendering. Every AI reply passes through it.

Good for:
- Speech bubbles with character avatars and names
- Visual novel style (background + character sprite + dialogue box)
- Color-coded battle logs
- Showing a status panel above or below each message

Where to set it: editor → **Message Renderer** section → select **Custom TSX** → paste code

#### 3. customComponents: independent UI panels

One or more TSX components that appear as extra panels — they don't replace message display, they add something alongside it.

Good for:
- Character creation screens
- Game sidebar (stats, inventory, map)
- Full-screen takeover (set `fullScreenComponent: true` in settings, and customComponents occupy the entire screen with chat hidden)

Where to set it: **Studio** → **Code View** panel → click **+** to add a component → write code or have AI write it (requires clicking **Enter Studio** first)

#### messageRenderer vs customComponents — how to choose

| | messageRenderer | customComponents |
|--|-----------------|-----------------|
| Quantity | Only one | Can have multiple |
| Position | Replaces message rendering | Alongside/above messages, or full-screen |
| Good for | Restyling messages | Building independent game UI |
| Where to edit | Editor or Studio | Studio only |

Most worlds only need a messageRenderer. Use customComponents when you need a full-screen game interface.

---

### Using Studio AI to generate UI

This is the recommended approach. No code to write — just chat with the AI.

#### Enter Studio

Editor top bar → click **Enter Studio**

Studio has several panels:

| Panel | What it does |
|-------|-------------|
| **AI Assistant** | Chat with AI to generate/modify code |
| **Canvas** | Live preview of your interface |
| **Code View** | View and edit code (messageRenderer + customComponents) |
| **Playtest** | Embedded chat for testing your game |

#### How to talk to Studio AI

Just describe what you want in plain English. More specific = better results.

**Example 1 — RPG status panel:**

```
Revamp how messages are displayed for my fantasy RPG world. I want a status panel.

What I want:
1. A dark purple panel above each message, with a faint purple glowing border and rounded corners
2. Three things displayed in a row:
   - A red health bar showing current HP (hp variable) and max HP (max_hp variable)
   - A blue mana bar showing current MP (mp variable) and max MP (max_mp variable)
   - Gold-colored coin count reading the gold variable, with a coin icon next to it
3. Normal message text below the panel
4. Dark fantasy aesthetic, panel shouldn't be too tall

My variables:
- hp — current health, number
- max_hp — max health, number
- mp — current mana, number
- max_mp — max mana, number
- gold — coins, number
- location — current location, string
```

Studio AI generates the code and shows an approval card. Check the Canvas preview, click **Approve** if you're happy, or keep specifying — "make the health bar bigger," "add a location display."

**Example 2 — Visual novel style:**

```
Build a visual novel / galgame-style message display.

What I want:
1. The whole area looks like a game scene, roughly 16:9 aspect ratio
   - Background image read from currentScene variable (stores an image URL)
   - No background = deep blue gradient
2. Character sprite displayed at center of the scene
   - Image read from characterPortrait variable (also a URL)
   - Large, centered
3. Semi-transparent black dialogue box at the bottom
   - Speaker name read from characterName variable, name in cherry blossom pink
   - Dialogue is the AI's reply text
4. *Italicized text in asterisks* is action description — display in gray italic above the dialogue box
5. Small affection counter top-right (affection variable), low = red, high = pink

My variables:
- currentScene — background image URL, string
- characterPortrait — character sprite URL, string
- characterName — character name, string
- affection — affection meter, number, 0–100
```

---

### Using an external AI to generate UI

If you prefer Claude, ChatGPT, or another AI, that works just fine. The key is telling it about Yumina's environment.

#### What to tell an external AI

External AI tools (Claude, ChatGPT, DeepSeek, etc.) don't know Yumina, so alongside describing your desired effect, you need to include some technical info. The format is simple — describe the effect in plain language first, then append the tech info:

```
I'm building a world on an AI interactive platform called Yumina. Help me write code to change the message display.

What I want:
[Describe what you want — colors, layout, style, which variables to read]

My variables:
[List your variables, specifying what each one is and stores]

Yumina technical info (please follow these rules when writing code):
- TSX format, exported as: export default function Renderer({ content, renderMarkdown }) { ... }
- useYumina() reads variables, e.g. useYumina().variables.health
- Built-in YUI component library (no import needed):
  YUI.Scene (background), YUI.Sprite (character sprite), YUI.DialogueBox (dialogue box),
  YUI.StatBar (health bar), YUI.StatCard (stat card), YUI.Panel (panel container),
  YUI.Tabs (tab switcher), YUI.ItemGrid (item grid), YUI.ChoiceButtons (choice buttons),
  YUI.ActionButton (action button), YUI.Badge (badge), YUI.Fullscreen (full screen)
- Built-in Icons library (no import), e.g. Icons.Heart, Icons.Sword, Icons.Coins
- renderMarkdown(content) converts text to HTML
- Supports Tailwind CSS and React hooks
```

Once you have the code:
1. If it's a **messageRenderer** → editor → Message Renderer → Custom TSX → paste
2. If it's a **customComponent** → Studio → Code View → click + → paste

If the bottom shows **Compile Status: OK** you're done. If there's an error, send it back to the AI to fix.

---

### YUI component library — quick reference

These prebuilt components can be used directly in TSX code — no import needed:

| Component | Use case | Common props |
|-----------|----------|-------------|
| `YUI.Scene` | Background scene | `bg` (background URL), `transition` |
| `YUI.Sprite` | Character sprite | `src` (image URL), `position` (left/center/right), `size` |
| `YUI.DialogueBox` | Dialogue box | `speaker`, `speakerColor`, `variant` (default/thought/narration) |
| `YUI.ChoiceButtons` | Choice buttons | `choices` (array), `onChoice`, `layout` (vertical/horizontal/grid) |
| `YUI.StatBar` | Status bar | `label`, `value`, `max`, `color` |
| `YUI.StatCard` | Stat card | `label`, `value`, `icon` |
| `YUI.Panel` | Container panel | `title`, `children` |
| `YUI.Tabs` | Tab switcher | `tabs` (array), `activeTab`, `onTabChange` |
| `YUI.ItemGrid` | Item grid | `items` (array), `columns`, `emptySlots` |
| `YUI.ActionButton` | Action button | `label`, `icon`, `onClick` |
| `YUI.Badge` | Small badge | `children`, `variant` |
| `YUI.Fullscreen` | Full-screen toggle | `children` |

These components default to a dark theme with smooth animations, ready to use out of the box. You (or the AI writing code for you) can further customize via the `className` prop with Tailwind CSS.

---

### useYumina() — reading and writing game state

Inside TSX code, use the `useYumina()` hook to access everything in the game:

```
const api = useYumina();

api.variables          // all current variable values, e.g. api.variables.health
api.sendMessage(text)  // send a message as the player
api.setVariable(id, value)  // directly set a variable value
api.executeAction(id)  // trigger an action-type rule
api.isStreaming        // whether the AI is currently generating
api.streamingContent   // current content being generated (live)
api.resolveAssetUrl(ref)  // convert an asset reference to a real URL
api.playAudio(trackId)    // play audio
api.stopAudio(trackId)    // stop audio
```

You don't need to memorize any of this — the AI generating code for you will use these automatically. It's here for reference.

---

## Practical examples

Each example includes a complete prompt you can copy and send directly to Studio AI or an external AI.

---

### Example 1: Horror game status bar (messageRenderer)

**Effect**: a dark horror-style HP/energy/day panel above each message.

**Copy this and send to Studio AI or an external AI:**

```
Revamp the message display to create a horror survival game status panel.

Effect:
1. A dark status bar above each message — near-black dark gray background, dark red border, rounded corners
2. From left to right in the status bar:
   - A red HP bar (reads health variable, max 100)
   - A green energy bar (reads energy variable, max 100)
   - Amber text on the right: "Day X · Night" (reads day and phase variables)
   - If is_armed is true, add a small white sword icon on the far right
3. Normal message text below the status bar
4. Style should feel oppressive, desaturated, end-of-world horror

Variables: health (health, 0–100), energy (energy, 0–100), day (day count), phase ("night" or "day"), is_armed (whether armed, true/false)
```

If using an external AI, append this technical info:
> Yumina platform, TSX format, export default function Renderer({ content, renderMarkdown }), useYumina().variables for variables, YUI.StatBar for health bars, Icons.Sword for icons, renderMarkdown(content) renders text, Tailwind CSS supported.

---

### Example 2: Visual novel style (messageRenderer)

**Effect**: full-screen scene background + character sprite + semi-transparent dialogue box at the bottom.

**Copy this and send to Studio AI or an external AI:**

```
Build a visual novel / galgame-style message display.

Effect:
1. The whole area looks like a game scene, 16:9 aspect ratio
   - Background from currentScene variable (image URL), deep blue gradient when no image
2. Character sprite in the center from characterPortrait variable, large centered image
3. Semi-transparent black dialogue box at bottom:
   - Speaker name from characterName variable, name in cherry blossom pink
   - Dialogue content is the AI's reply text
4. *Asterisk-wrapped text* is action description, displayed in gray italic above the dialogue box
5. Small affection display top-right ♥ (reads affection variable), low = red, mid = white, high = pink

Variables: currentScene (background URL), characterPortrait (character sprite URL), characterName (character name), affection (affection meter, 0–100)
```

If using an external AI, append this technical info:
> Yumina platform, TSX format, export default function Renderer({ content, renderMarkdown }), useYumina().variables for variables, YUI.Scene for background, YUI.Sprite for sprites, YUI.DialogueBox for dialogue box, renderMarkdown(content) renders text, Tailwind CSS supported.

---

### Example 3: Game sidebar (customComponent)

**Effect**: a sidebar next to the chat showing character info + stats + inventory.

**Copy this and send to Studio AI or an external AI:**

```
Build a game sidebar (as a customComponent, not a messageRenderer).

Effect:
1. Dark gray background panel, rounded corners
2. Top: character info
   - Circular avatar on the left (reads playerAvatar variable for image URL), purple border
   - Character name (playerName variable) and level "Lv.X" (level variable) on the right, level in purple
3. Middle: stat section with "Stats" heading
   - Red HP bar reading hp and max_hp variables
   - Blue MP bar reading mp and max_mp variables
   - Three stat cards in a row: Strength (strength, sword icon), Defense (defense, shield icon), Speed (speed, lightning icon)
4. Bottom: inventory section with "Inventory" heading
   - 3-column item grid reading inventory variable (array, each item has name, icon, count)
   - Empty slots show dashed gray outlines, total 9 slots

Variables: playerAvatar (avatar URL), playerName (character name), level (level), hp/max_hp (current/max health), mp/max_mp (current/max mana), strength/defense/speed (stat numbers), inventory (inventory array)
```

If using an external AI, append this technical info:
> Yumina platform, TSX format, export default function Component(), useYumina().variables for variables, YUI.StatBar for health bars, YUI.StatCard for stat cards, YUI.ItemGrid for inventory, YUI.Panel for the panel container, Icons.Sword/Shield/Zap etc. icons available, Tailwind CSS supported.

::: tip These prompts work as-is
All three prompts above can be copied directly and sent to Studio AI or an external AI. Once you have the code, paste it in. If the effect isn't right, keep talking to the AI — adjust colors, sizes, layouts.
:::

::: info Technical details
For TSX syntax, Props interface, compile environment, and other technical details → [Custom Message Renderer](./08-message-renderer.md)
:::
