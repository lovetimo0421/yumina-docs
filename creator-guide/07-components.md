# Custom UI Guide

> Your world doesn't have to look like a chat window. This guide shows you how to turn it into anything you want — and you don't need to write the code yourself.

---

## What is Custom UI?

Every world on Yumina starts with a default chat experience. Messages appear as text bubbles, there's an input box at the bottom, and everything scrolls naturally. This works great for most worlds — no code needed.

But if you want your world to LOOK different — custom fonts, themed backgrounds, stat bars, character portraits, or even a complete visual novel engine — you can add Custom UI.

Custom UI is React code (TSX) that changes how your world looks and feels. You can write it yourself or ask the Studio AI to generate it for you.

---

## Three Levels of Customization

Think of Yumina as a theater. The stage comes with everything: walls, lights, seating, curtains. Every show gets this stage by default.

### Level 1: No Custom UI (Default Chat)

You don't write any code. Yumina shows messages as formatted text with markdown support (bold, italic, code blocks, images). The chat handles scrolling, streaming, editing, and everything else automatically.

**Best for:** Character cards, simple roleplay, conversation-focused worlds.

### Level 2: Message Template (Custom Message Styling)

You write a small component that controls how each message looks. Yumina still handles the message list, scrolling, input box, streaming, editing, and all other chat features. Your component just changes the visual presentation of each message bubble.

This is like repainting the backdrops in the theater. The stage is still there, the seats are still there, the lighting still works. You're just changing what the audience sees during each scene.

With a message template, you can:
- Change fonts, colors, and backgrounds
- Parse dialogue and narration into styled sections
- Add stat bars, health meters, resource counters below each message
- Build interactive greeting screens (character creation, faction selection)
- Show character portraits alongside text
- Theme the entire chat experience

**Best for:** Themed roleplay, games with stats, interactive fiction with HUD elements, visual upgrades to the chat experience.

**Where to set it:** Editor → **Message Renderer** section → select **Custom TSX** → paste code

### Level 3: App Template (Complete Custom UI)

You write a component that replaces the ENTIRE screen. Yumina's default chat disappears completely — no message list, no input box, no scrolling. Your component IS the entire experience. You build everything from scratch.

This is like tearing down the theater and building your own venue. You control every pixel.

With an app template, you must handle:
- Displaying messages yourself (read from `api.messages`)
- Providing your own input method (call `api.sendMessage()`)
- Streaming display (check `api.isStreaming` and `api.streamingContent`)
- Scrolling behavior
- Any other interaction you want

**Best for:** Visual novel engines, complex game UIs, completely custom experiences that don't look like a chat at all.

**Where to set it:** Editor → **Components** section → click "Add Component" → choose **App** surface

### How to choose

| | Message Template | App Template |
|--|-----------------|-------------|
| Quantity | Only one | Only one |
| What it replaces | Message rendering only | The entire screen |
| Chat features | Handled by Yumina | You build them yourself |
| Best for | Restyling messages, adding HUD | Full-screen games, visual novels |
| Difficulty | Easier | Harder |

Most worlds only need a message template. Use an app template when you need a full-screen experience.

---

## How to Add Custom UI

### Using Studio AI (Recommended)

The easiest way. No code to write — just chat with the AI.

Open your world in the editor, click **Enter Studio** at the top. Studio has several panels:

| Panel | What it does |
|-------|-------------|
| **AI Assistant** | Chat with AI to generate/modify code |
| **Canvas** | Live preview of your interface |
| **Code View** | View and edit code (message templates + custom components) |
| **Playtest** | Embedded chat for testing your game |

Describe what you want in plain English. More specific = better results:

- "Make my messages look like a horror game with dark backgrounds and creepy fonts"
- "Add a health bar and inventory below each message"
- "Build a visual novel engine with character sprites and scene backgrounds"
- "Make the greeting an interactive character creation screen"

Studio AI generates the code and shows an approval card. Check the Canvas preview, click **Approve** if you're happy, or keep iterating — "make the health bar bigger," "add a location display."

### Using the Editor

Open your world in the editor, go to the **Components** section. Click "Add Component" and select the template level:

- **Message** — for styling each chat message (Level 2)
- **Overlay** — for widgets alongside the chat
- **App** — for replacing the entire UI (Level 3)

Then write your TSX code in the editor. The compile checker will tell you if there are errors.

### Using an External AI

If you prefer Claude, ChatGPT, or another AI, that works fine. The key is telling it about Yumina's environment. Describe the effect you want in plain language, then append this tech info:

```
I'm building a world on an AI interactive platform called Yumina.
Help me write code to change the message display.

What I want:
[Describe what you want — colors, layout, style, which variables to read]

My variables:
[List your variables, specifying what each one stores]

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
- Use var instead of const/let, use function() instead of arrow functions
- No import statements, no TypeScript syntax
- Supports Tailwind CSS and React hooks (via React.useState, React.useEffect, etc.)
```

Once you have the code:
1. If it's a **message template** → editor → Message Renderer → Custom TSX → paste
2. If it's a **custom component** → Studio → Code View → click + → paste

If the bottom shows **Compile Status: OK** you're done. If there's an error, send it back to the AI to fix.

---

## Writing TSX Code

### Rules

1. Start with `export default function YourName` — this is required
2. No `import` statements — React, useYumina, Icons, and Tailwind are already available
3. Use `React.useState()` not `useState()` — React is in scope, not individual hooks
4. Use `var` for variable declarations — avoids scoping issues in the sandbox
5. No TypeScript syntax — no generics, interfaces, or type annotations
6. Everything goes in one file — define helpers inside the same file

### Message Template Props

When you write a message template, your component receives these props for each message:

| Prop | What it is | Example |
|------|-----------|---------|
| `content` | The message text (directives already removed) | `"You enter the dark forest..."` |
| `role` | Who sent the message | `"user"` or `"assistant"` |
| `messageIndex` | Position in the conversation | `0` for the first message (greeting) |
| `variables` | All game variables with current values | `{ health: 80, gold: 150 }` |
| `renderMarkdown` | A function that converts markdown to HTML | `renderMarkdown("**bold**")` → `"<strong>bold</strong>"` |
| `isStreaming` | Whether this message is still being generated | `true` or `false` |

### Basic Message Template Example

```tsx
export default function MyRenderer({ content, role, messageIndex, variables, renderMarkdown }) {
  // User messages: simple text
  if (role === "user") {
    return <div className="text-blue-300">{content}</div>
  }

  // AI messages: styled with custom background
  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />

      {/* Show health bar below each message */}
      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
        <span>HP {variables.health}/100</span>
        <span>Gold {variables.gold}</span>
      </div>
    </div>
  )
}
```

### Interactive Greeting Example

Use `messageIndex === 0` to detect the first message and show a character creation screen:

```tsx
export default function MyRenderer({ content, role, messageIndex, variables, renderMarkdown }) {
  var api = useYumina()

  // First message: show character creation
  if (messageIndex === 0 && role === "assistant") {
    return (
      <div className="space-y-4">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />

        <div className="flex gap-3 mt-4">
          <button
            onClick={function() {
              api.setVariable("class", "Warrior")
              api.sendMessage("I choose Warrior")
            }}
            className="px-4 py-3 rounded-lg border border-zinc-600 hover:bg-zinc-800"
          >
            Warrior
          </button>
          <button
            onClick={function() {
              api.setVariable("class", "Mage")
              api.sendMessage("I choose Mage")
            }}
            className="px-4 py-3 rounded-lg border border-zinc-600 hover:bg-zinc-800"
          >
            Mage
          </button>
        </div>
      </div>
    )
  }

  // Regular messages: styled text
  return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
}
```

### App Template Example

A basic full-screen chat shell. You must handle messages, input, and streaming yourself:

```tsx
export default function MyGame() {
  var api = useYumina()
  var scrollRef = React.useRef(null)
  var inputState = React.useState("")
  var input = inputState[0]
  var setInput = inputState[1]

  var msgs = api.messages || []

  // Auto-scroll when new messages arrive
  React.useEffect(function() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [msgs.length, api.streamingContent])

  function handleSend() {
    var text = input.trim()
    if (!text || api.isStreaming) return
    api.sendMessage(text)
    setInput("")
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map(function(m, i) {
          return (
            <div key={m.id || i} className={m.role === "user" ? "text-right" : ""}>
              <div className={"inline-block max-w-[80%] px-3 py-2 rounded-lg " +
                (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {m.content}
              </div>
            </div>
          )
        })}

        {/* Show streaming text while AI is generating */}
        {api.isStreaming && api.streamingContent && (
          <div className="inline-block max-w-[80%] px-3 py-2 rounded-lg bg-muted animate-pulse">
            {api.streamingContent}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={function(e) { setInput(e.target.value) }}
          onKeyDown={function(e) { if (e.key === "Enter") handleSend() }}
          placeholder="Type a message..."
          disabled={api.isStreaming}
          className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={handleSend}
          disabled={api.isStreaming}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

---

## The useYumina() SDK

The SDK is your connection to the platform. Call `useYumina()` inside your component to access game state and actions.

::: tip Most creators only need the Essentials
The Essentials section covers reading variables, sending messages, playing audio, and showing notifications — enough for 95% of worlds. The Advanced section is for multiplayer, model switching, and other niche features.
:::

### Essentials

#### Reading State

| Property | What it gives you |
|----------|------------------|
| `api.variables` | All game variables: `{ health: 80, gold: 150, ... }` |
| `api.messages` | All chat messages: `[{ id, role, content, ... }, ...]` |
| `api.isStreaming` | `true` when the AI is currently generating a response |
| `api.streamingContent` | The text being generated (updates in real-time) |
| `api.currentUser` | The logged-in player: `{ id, name, image }` |
| `api.worldName` | The name of the current world |
| `api.sessionId` | The current play session ID |
| `api.worldId` | The current world ID |

#### Sending Actions

| Method | What it does |
|--------|-------------|
| `api.sendMessage("text")` | Send a message as the player |
| `api.setVariable("health", 50)` | Set a game variable |
| `api.executeAction("attackBoss")` | Trigger a named action |

#### Chat Controls

| Method | What it does |
|--------|-------------|
| `api.editMessage(id, "new text")` | Edit an existing message |
| `api.deleteMessage(id)` | Delete a message |
| `api.regenerateMessage(id)` | Ask the AI to regenerate a response |
| `api.continueLastMessage()` | Continue generating from the last message |
| `api.stopGeneration()` | Stop the AI mid-generation |
| `api.restartChat()` | Clear all messages and start over |

#### Audio

| Method | What it does |
|--------|-------------|
| `api.playAudio("bgm-battle", { volume, fadeDuration, chainTo, maxDuration, duckBgm })` | Play a sound/music track with options |
| `api.stopAudio("bgm-battle", 2.0)` | Stop a specific track (optional fade duration in seconds) |
| `api.stopAudio()` | Stop all audio |
| `api.setAudioVolume("bgm", 0.8)` | Set BGM or SFX volume |
| `api.getAudioVolume("bgm")` | Get current volume for BGM or SFX (returns 0–1) |

#### Navigation & UI

| Method | What it does |
|--------|-------------|
| `api.toggleImmersive()` | Toggle fullscreen mode |
| `api.copyToClipboard("text")` | Copy text to clipboard |
| `api.navigate("/app/hub")` | Navigate to a different page |
| `api.showToast("Saved!", "success")` | Show a notification popup |
| `api.switchGreeting(2)` | Switch to a different greeting variant |

#### Storage (Persists Across Sessions)

| Method | What it does |
|--------|-------------|
| `api.storage.get("highScore")` | Read a saved value (async) |
| `api.storage.set("highScore", "9999")` | Save a value (async) |
| `api.storage.remove("highScore")` | Delete a saved value (async) |

### Advanced

#### Extended State

| Property | What it gives you |
|----------|------------------|
| `api.globalVariables` | Global scope variables (shared across all sessions) |
| `api.personalVariables` | Per-user personal variables |
| `api.roomPersonalVariables` | Per-user variables scoped to the current room |
| `api.room` | Current room data (for multiplayer worlds): `{ id, name, ... }` or `null` |
| `api.permissions` | Current user's permissions in this world: `{ canEdit, ... }` or `null` |
| `api.pendingChoices` | Choice buttons waiting for player input: `["option1", "option2"]` |
| `api.error` | Current error message (API failure, generation error) or `null` |
| `api.streamingReasoning` | AI reasoning/thinking content during streaming |
| `api.readOnly` | `true` when viewing someone else's session (no input allowed) |
| `api.greetingContent` | Greeting text extracted from world entries, or `null` |
| `api.canvasMode` | Current display mode: `"chat"`, `"custom"`, or `"fullscreen"` |

#### Extended Actions

| Method | What it does |
|--------|-------------|
| `api.setVariable("health", 50, { scope, targetUserId })` | Set a variable with options. `scope` specifies variable scope, `targetUserId` targets a specific player (for multiplayer) |
| `api.clearPendingChoices()` | Dismiss pending choice buttons |
| `api.swipeMessage(id, "left"/"right")` | Navigate between message swipes (alternate AI responses) |

#### Assets

| Method | What it does |
|--------|-------------|
| `api.resolveAssetUrl("@asset:abc123")` | Resolve an asset reference to a CDN URL |

#### Session Management

| Method | What it does |
|--------|-------------|
| `api.revertToMessage(messageId)` | Rewind the conversation to a specific point |
| `api.createSession(worldId)` | Start a new play session |
| `api.deleteSession(sessionId)` | Delete a play session |
| `api.listSessions(worldId)` | List all saved sessions |

#### Model Management

| Method | What it does |
|--------|-------------|
| `api.selectedModel` | Currently selected AI model ID |
| `api.userPlan` | User's subscription plan (`"free"`, `"go"`, `"plus"`, `"pro"`, `"ultra"`) |
| `api.preferredProvider` | `"official"` (platform API) or `"private"` (user's own key) |
| `api.setModel("claude-sonnet-4-6")` | Switch to a different AI model |
| `api.getModels()` | Get available models, pinned models, and recently used (async) |
| `api.pinModel("model-id")` | Pin a model to the user's favorites |
| `api.unpinModel("model-id")` | Unpin a model from favorites |

---

## Available Tools in Your Code

These are automatically available — no imports needed:

- **React** — `React.useState()`, `React.useEffect()`, `React.useMemo()`, `React.useRef()`
- **useYumina()** — the SDK (see above)
- **Icons** — 1,400+ icons from Lucide: `Icons.Heart`, `Icons.Sword`, `Icons.Shield`, etc. Browse at https://lucide.dev/icons
- **YUI** — Pre-built game UI components (see below)
- **Tailwind CSS** — Full utility classes for styling
- **useAssetFont()** — Load custom fonts from uploaded assets

---

## YUI: Pre-Built Game Components

Instead of building everything from scratch, use the YUI component library. All components default to a dark theme with smooth animations, ready to use out of the box.

### Quick Reference

| Component | Use case | Common props |
|-----------|----------|-------------|
| `YUI.Scene` | Background scene | `bg` (background URL), `transition` |
| `YUI.Sprite` | Character sprite | `src` (image URL), `position` (left/center/right), `size` |
| `YUI.DialogueBox` | Dialogue box | `speaker`, `speakerColor`, `variant` (default/thought/narration) |
| `YUI.ChoiceButtons` | Choice buttons | `choices` (array), `onSelect`, `layout` (vertical/horizontal/grid) |
| `YUI.StatBar` | Status bar | `label`, `value`, `max`, `color`, `animated` |
| `YUI.StatCard` | Stat card | `label`, `value`, `icon`, `color` |
| `YUI.Panel` | Container panel | `title`, `icon`, `children` |
| `YUI.Tabs` | Tab switcher | `tabs` (array), `activeTab`, `onTabChange` |
| `YUI.ItemGrid` | Item grid | `items` (array), `columns`, `emptySlots` |
| `YUI.ActionButton` | Action button | `label`, `icon`, `onClick` |
| `YUI.Badge` | Small badge | `children`, `variant` |
| `YUI.Fullscreen` | Full-screen toggle | `children` |

### Usage Examples

**Scenes & Characters:**

```tsx
// Background scene with character sprite
<YUI.Scene bg={variables.sceneBg}>
  <YUI.Sprite src={variables.charSprite} position="center" size="lg" />
  <YUI.DialogueBox speaker="Sakura" speakerColor="#ff69b4">
    {content}
  </YUI.DialogueBox>
</YUI.Scene>
```

**Stat Bars & Cards:**

```tsx
// Animated health bar
<YUI.StatBar value={variables.health} max={100} label="HP" color="red" animated />

// Stat display card
<YUI.StatCard label="Gold" value={variables.gold} icon={Icons.Coins} color="yellow" />
```

**Choice Buttons:**

```tsx
// Action choices
<YUI.ChoiceButtons
  choices={[
    { label: "Attack", value: "attack", icon: Icons.Sword },
    { label: "Defend", value: "defend", icon: Icons.Shield },
    { label: "Flee", value: "flee", icon: Icons.Wind },
  ]}
  onSelect={function(choice) { api.sendMessage("I choose to " + choice.value) }}
/>
```

**Panels & Tabs:**

```tsx
// Content panel with title
<YUI.Panel title="Inventory" icon={Icons.Backpack}>
  <YUI.ItemGrid items={inventoryItems} columns={4} />
</YUI.Panel>

// Tab container
<YUI.Tabs
  tabs={["Stats", "Inventory", "Map"]}
  activeTab={currentTab}
  onTabChange={setCurrentTab}
>
  {/* Tab content here */}
</YUI.Tabs>
```

You (or the AI writing code for you) can further customize any component via the `className` prop with Tailwind CSS.

---

## Forbidden APIs

Your code runs inside a secure sandbox. These browser APIs are **blocked** — use the SDK alternatives:

| Don't use this | Use this instead |
|---------------|-----------------|
| `fetch('/api/...')` | `api.listSessions()`, `api.createSession()`, etc. |
| `localStorage.getItem()` | `api.storage.get()` |
| `localStorage.setItem()` | `api.storage.set()` |
| `window.location` | `api.sessionId`, `api.worldId`, `api.navigate()` |
| `navigator.clipboard` | `api.copyToClipboard()` |

---

## Theme-Safe Colors

Use these Tailwind classes to match Yumina's dark theme automatically:

| What you want | Use this class |
|--------------|----------------|
| Card background | `bg-card` |
| Page background | `bg-background` |
| Muted/subtle background | `bg-muted` |
| Primary text | `text-foreground` |
| Secondary/dim text | `text-muted-foreground` |
| Borders | `border-border` |
| Accent/brand color | `text-primary`, `bg-primary` |

---

## Common Mistakes

| Problem | Fix |
|---------|-----|
| `useState is not defined` | Use `React.useState()` |
| `import ... from` | Remove all imports — everything is already in scope |
| Component doesn't show | Make sure you have `export default function` |
| TypeScript errors | Remove generics `<T>`, interfaces, `as` casts |
| Full-screen app shows blank | You need to read `api.messages` and render them yourself |
| Full-screen app has no input | Add your own input and call `api.sendMessage()` |
| `renderMarkdown` is undefined | Only message templates get this prop. App templates handle text themselves. |
| Variables not updating | Make sure the AI's prompt tells it to output `[variableName: set value]` directives |

---

## Tips

1. **Start with the Studio AI.** Describe what you want and let it generate the code. You can always edit it afterward.

2. **Start simple.** Begin with a message template that just changes colors and fonts. Add features gradually.

3. **Use YUI components.** Don't build stat bars and dialogue boxes from scratch. YUI has pre-built versions that look good and work out of the box.

4. **Test with the Preview panel.** The editor's preview panel shows a live preview of your component with sample data.

5. **Use `messageIndex === 0` for greetings.** The first assistant message is the greeting. Use this to build character creation screens, intro sequences, or tutorial displays.

6. **Don't forget streaming.** When `isStreaming` is true, the message content is still being generated. Your component should handle partial text gracefully.

---

## Practical AI Prompts

Each example includes a complete prompt you can copy and send directly to Studio AI or an external AI.

### Example 1: Horror game status bar (Message Template)

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

Variables: health (health, 0-100), energy (energy, 0-100), day (day count), phase ("night" or "day"), is_armed (whether armed, true/false)
```

If using an external AI, append the [technical info block](#using-an-external-ai) from above.

### Example 2: Visual novel style (Message Template)

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
5. Small affection display top-right (reads affection variable), low = red, mid = white, high = pink

Variables: currentScene (background URL), characterPortrait (character sprite URL), characterName (character name), affection (affection meter, 0-100)
```

### Example 3: Game sidebar (App Template)

**Effect**: a sidebar next to the chat showing character info + stats + inventory.

**Copy this and send to Studio AI or an external AI:**

```
Build a game sidebar (as a custom component, not a message template).

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

::: tip These prompts work as-is
All three prompts above can be copied directly and sent to Studio AI or an external AI. Once you have the code, paste it in. If the effect isn't right, keep talking to the AI — adjust colors, sizes, layouts.
:::

::: info Message Template vs App Template: the full comparison
Want to understand the technical differences between message-surface and app-surface components? See [Renderer vs Components](./07b-renderer-vs-components.md) for a detailed comparison.
:::

::: info Deep dive
Want to understand how renderers work under the hood? TSX crash course, styling techniques, animations, debugging → [Message Renderer Deep Dive](./08-message-renderer.md)
:::
