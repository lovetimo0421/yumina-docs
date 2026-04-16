# Custom UI Guide

> Your world doesn't have to look like a chat window. This guide shows you how to turn it into anything you want — and you don't need to write the code yourself.

---

## What is Custom UI?

Every world on Yumina starts with a default chat experience. Messages appear as text bubbles, there's an input box at the bottom, and everything scrolls naturally. For most worlds, that's all you need — no code required.

But if you want your world to **look different** — custom fonts, themed backgrounds, stat bars, character portraits, or even a complete visual novel engine — you add Custom UI.

Custom UI is React code (TSX) that changes how your world looks and feels. You can write it yourself, or have Studio AI generate it for you.

---

## Root Component

Every new world ships with a **Root Component** — a tiny tree of TSX files whose default entry point is `index.tsx`. Whatever React component this file exports becomes the entire UI the player sees when they open your world.

### The default

A fresh `index.tsx` is just one line:

```tsx
export default function MyWorld() {
  return <Chat />;
}
```

`<Chat />` is the platform-maintained "complete chat experience" building block — message list, input box, streaming cursor, swipe-to-alternate, checkpoints, model picker, read-only mode, opening greetings, all built in. **Change nothing and the player sees the default chat.**

### Three customization paths

Think of Yumina as a stage. `<Chat />` is the default stage — you can use it as-is, redecorate it, or tear it down and build your own.

| You want | How to do it | Difficulty |
|----------|--------------|------------|
| **Just restyle message bubbles** | `<Chat renderBubble={(msg) => <MyBubble {...msg} />} />` | Easy |
| **Chat + a floating side panel** | Put `<Chat />` and your panel in the same flex layout inside the Root Component | Medium |
| **Fully custom full-screen UI** | Skip `<Chat />`, compose from `<MessageList />` and `<MessageInput />`, or read `useYumina().messages` directly | Harder |

#### Path 1: Custom bubbles

The most common case. `<Chat />` handles all chat functionality; you just render each message:

```tsx
export default function MyWorld() {
  return (
    <Chat renderBubble={function(msg) {
      return (
        <div className={msg.role === "user"
          ? "rounded-xl bg-primary/20 px-4 py-3 ml-auto max-w-[80%]"
          : "rounded-xl bg-card px-4 py-3 mr-auto max-w-[80%]"
        }>
          <div dangerouslySetInnerHTML={{ __html: msg.contentHtml }} />
        </div>
      )
    }} />
  )
}
```

The `msg` object passed to `renderBubble` is described in the [`<Chat>` API](#chat-api) section below.

#### Path 2: Chat + floating panel

`<Chat />` takes the main area; a status bar or sidebar goes next to it:

```tsx
export default function MyWorld() {
  var api = useYumina()
  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0">
        <Chat />
      </div>
      <aside className="w-72 shrink-0 border-l border-border p-4">
        <div className="text-sm">HP: {api.variables.health}/100</div>
        <div className="text-sm">Gold: {api.variables.gold}</div>
      </aside>
    </div>
  )
}
```

#### Path 3: Fully custom full-screen

Skip `<Chat />` and compose from finer-grained building blocks, or read `api.messages` directly. Visual novels, map navigation, turn-based battle screens all fall into this bucket. See the [fully custom full-screen example](#path-3-fully-custom-full-screen-complete-example) further down.

### Multiple files

The Root Component isn't limited to one file. You can click `+` in the editor to add `stat-bar.tsx`, `dialogue-box.tsx`, etc., and import them from `index.tsx` using ES module syntax:

```tsx
// index.tsx
import StatBar from "./stat-bar"
import DialogueBox from "./dialogue-box"

export default function MyWorld() {
  return (
    <div className="flex flex-col h-full">
      <StatBar />
      <Chat renderBubble={function(msg) {
        return <DialogueBox content={msg.contentHtml} />
      }} />
    </div>
  )
}
```

The entry filename is fixed (`index.tsx` by default); other filenames are up to you.

::: tip Legacy "message renderer / app component"
Pre-v18 worlds used the `customUI[]` + `surface: "message" / "app"` model. The editor now marks those worlds with a **Legacy** badge for backwards compatibility. New worlds always use the Root Component. When you import an old Bundle, the engine auto-migrates the `messageRenderer` field into the Root Component — no manual work needed.

`<ChatCanvas />` is still available in the legacy sandbox (behavior identical to `<Chat />`); please use `<Chat />` for new code.
:::

---

## How to add Custom UI

### Use Studio AI (recommended)

The easiest path. No code required — just talk to the AI.

Open the editor and click **Enter Studio** at the top. Studio has a few panels:

| Panel | What it does |
|-------|-------------|
| **AI Assistant** | Chat with the AI and have it generate/modify code for you |
| **Canvas** | Live preview of your UI |
| **Code View** | View and edit code (the whole Root Component file tree) |
| **Playtest** | Embedded chat for testing your world |

Describe what you want in plain English. The more specific, the better:

- "Make the messages look like a horror game, dark background, creepy font"
- "Add a health bar and inventory below each message"
- "Build a visual novel engine with character sprites and scene backgrounds"
- "Turn the opening greeting into an interactive character creation screen"

Studio AI generates the code and pops up a review card. Glance at the Canvas preview — hit **Approve** if it looks right, or keep iterating: "make the health bar bigger," "add a location display."

### Use the editor directly

Open the editor and find the **Custom UI** section (the "Custom UI" tab in the sidebar). Every new world comes with a Root Component already set up — the default file tab shows `index.tsx`.

- Edit `index.tsx` directly in the tab editor
- To split into multiple files, click the **+** next to the tabs to add a new file (e.g., `stat-bar.tsx`), then import it from `index.tsx` with `import StatBar from "./stat-bar"`
- The compile status indicator at the bottom tells you if there are syntax errors

### Use an external AI

If you prefer Claude, ChatGPT, or another AI, that works too. The key is giving it Yumina's environment info. Describe what you want in plain language, then append the technical info:

```
I'm building a world on an AI interactive platform called Yumina. Write me a root component.

What I want:
[Describe in plain English — colors, layout, style, which variables to read]

My variables:
[List your variables, what each stores]

Yumina technical info (please follow when writing code):
- Code is TSX, root-component entry file index.tsx, exported via export default function MyWorld() { ... }
- Available globally in the sandbox (no imports needed): React, useYumina, Icons (Lucide),
  Tailwind, useAssetFont, Chat, MessageList, MessageInput
- Read game state via useYumina(), e.g. useYumina().variables.health
- For default chat: return <Chat />
- For custom bubbles: <Chat renderBubble={(msg) => <MyBubble {...msg} />} />
  msg fields: contentHtml (rendered HTML), rawContent, role ("user" | "assistant" | "system"),
  messageIndex, isStreaming, variables, stateSnapshot, renderMarkdown(text)
- For fully custom UI: compose from <MessageList /> and <MessageInput />, or read
  useYumina().messages directly
- Icons available: e.g. Icons.Heart, Icons.Sword, Icons.Coins (full list at https://lucide.dev/icons)
- Use var and function() instead of const/let/arrow functions (more robust in the sandbox)
- Multi-file imports allowed inside the Root Component tree: import "./other-file"
- No TypeScript syntax (no generics, interfaces, as assertions)
- Tailwind CSS and React hooks supported (call via React.useState/React.useEffect)
```

Paste the generated code into Editor → Custom UI → `index.tsx`. You're done when the status bar at the bottom reads **Compile Status: OK**. If it errors, paste the message back to the AI.

---

## Writing code: ground rules

1. Entry file must start with `export default function YourComponent` — this is required
2. These are globals in the sandbox — **do not import**: `React`, `useYumina`, `Icons`, `Chat`, `MessageList`, `MessageInput`, `useAssetFont`, Tailwind classes
3. You CAN import from other files inside the same Root Component tree, e.g. `import StatBar from "./stat-bar"`
4. Use `React.useState()`, not `useState()` — React is in scope but individual hooks aren't
5. Use `var` declarations and `function() { ... }` instead of arrow functions — avoids occasional sandbox scope gotchas
6. No TypeScript syntax — no generics, interfaces, or `as` assertions

## `<Chat>` API

`<Chat />` is the platform-maintained complete chat building block. Zero props gives you the default chat; adding `renderBubble` lets you take over bubble styling.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `renderBubble?` | `(msg: BubbleProps) => ReactNode` | Customize how each message bubble renders. Omit for the default Markdown rendering. |
| `className?` | `string` | Extra CSS classes for the container |
| `children?` | `ReactNode` | Content rendered above the message list (e.g., custom header) |

### Fields in the `msg` object passed to `renderBubble`

| Field | What it is | Example |
|-------|-----------|---------|
| `contentHtml` | Pre-rendered safe HTML (Markdown → HTML), drop straight into `dangerouslySetInnerHTML` | `"<p>You step into…</p>"` |
| `rawContent` | The original unrendered Markdown text | `"You step into the **forest**…"` |
| `role` | Who sent this message | `"user"` / `"assistant"` / `"system"` |
| `messageIndex` | Position in the conversation (0 = first / greeting) | `0` |
| `isStreaming` | Whether this message is still being generated | `true` / `false` |
| `variables` | Current game variable values | `{ health: 80, gold: 150 }` |
| `stateSnapshot` | State snapshot at the time this message was generated (may be `null`) | `{ ... }` |
| `renderMarkdown(text)` | Function to convert arbitrary Markdown to HTML | `renderMarkdown("**bold**")` → `"<strong>bold</strong>"` |

### Example 1: Custom bubbles + HUD

```tsx
export default function MyWorld() {
  var api = useYumina()

  return (
    <Chat renderBubble={function(msg) {
      // User messages: right-aligned blue bubble
      if (msg.role === "user") {
        return (
          <div className="ml-auto max-w-[80%] rounded-xl bg-blue-500/20 px-4 py-3 text-blue-100">
            {msg.rawContent}
          </div>
        )
      }

      // AI messages: card with HUD at the bottom
      return (
        <div className="mr-auto max-w-[85%] rounded-xl border border-zinc-700 bg-zinc-900 p-4">
          <div dangerouslySetInnerHTML={{ __html: msg.contentHtml }} />
          <div className="mt-3 flex gap-4 text-xs text-zinc-400">
            <span>HP {api.variables.health}/100</span>
            <span>Gold {api.variables.gold}</span>
          </div>
        </div>
      )
    }} />
  )
}
```

### Example 2: Greeting as character creation

Use `messageIndex === 0` to identify the opening greeting and render it as a button picker:

```tsx
export default function MyWorld() {
  var api = useYumina()

  return (
    <Chat renderBubble={function(msg) {
      // Greeting: show character-creation buttons
      if (msg.messageIndex === 0 && msg.role === "assistant") {
        return (
          <div className="space-y-4">
            <div dangerouslySetInnerHTML={{ __html: msg.contentHtml }} />
            <div className="flex gap-3">
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

      // Other messages: default render
      return <div dangerouslySetInnerHTML={{ __html: msg.contentHtml }} />
    }} />
  )
}
```

### Path 3: Fully custom full-screen (complete example)

Drop `<Chat />` entirely and build it yourself. The example below uses the platform-provided `<MessageList />` and `<MessageInput />` building blocks — you skip the hassle of managing scrolling / streaming / input manually:

```tsx
export default function MyGame() {
  var api = useYumina()

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundImage: api.variables.bg ? "url(" + api.variables.bg + ")" : undefined,
        backgroundSize: "cover",
      }}
    >
      {/* Top status bar */}
      <div className="shrink-0 px-4 py-2 bg-black/50 backdrop-blur text-white flex gap-4 text-xs">
        <span>HP {api.variables.health}/100</span>
        <span>Gold {api.variables.gold}</span>
        <span className="ml-auto">{api.variables.location || "Unknown location"}</span>
      </div>

      {/* Message stream */}
      <div className="flex-1 min-h-0">
        <MessageList />
      </div>

      {/* Input box */}
      <MessageInput />
    </div>
  )
}
```

If you need tighter control (say, a visual novel where you only show the latest message instead of a scrollable stream), read directly from `api.messages`:

```tsx
var lastMsg = (api.messages || []).slice(-1)[0]
return <DialogueBox content={lastMsg ? lastMsg.content : ""} />
```

A complete visual-novel shell is in the [Visual Novel Mode](./21-recipe-visual-novel.md) recipe.

---

## useYumina() SDK

The SDK is your bridge to the platform. Call `useYumina()` inside any component to access game state and trigger actions.

::: tip Looking for the full, alphabetized reference?
This section is the **guided tour** — every field and method that 95% of worlds ever use, grouped by purpose. For the exhaustive reference — including branch management, checkpoints, `ai.complete`, `injectContext`, and every other edge-case API — see **[API Reference](./08-api-reference.md)**.
:::

::: tip Most creators only need the "Basics" section
The basics cover reading variables, sending messages, playing audio, and showing notifications — 95% of worlds never need more. The advanced section is for multiplayer, model switching, and other power-user scenarios.
:::

### Basics

#### Reading state

| Property | What it gives you |
|----------|------------------|
| `api.variables` | All game variables: `{ health: 80, gold: 150, ... }` |
| `api.messages` | All chat messages: `[{ id, role, content, ... }, ...]` |
| `api.isStreaming` | `true` while the AI is generating a reply |
| `api.streamingContent` | The text the AI is currently generating (updates live) |
| `api.currentUser` | The signed-in player: `{ id, name, image }` |
| `api.worldName` | The current world's name |
| `api.sessionId` | Current play session ID |
| `api.worldId` | Current world ID |

#### Sending actions

| Method | What it does |
|--------|-------------|
| `api.sendMessage("text")` | Send a message as the player |
| `api.setVariable("health", 50)` | Set a game variable |
| `api.executeAction("attackBoss")` | Trigger a named action |

#### Chat control

| Method | What it does |
|--------|-------------|
| `api.editMessage(id, "new text")` | Edit an existing message |
| `api.deleteMessage(id)` | Delete a message |
| `api.regenerateMessage(id)` | Have the AI regenerate a reply |
| `api.continueLastMessage()` | Continue generation from the last message |
| `api.stopGeneration()` | Stop AI generation mid-stream |
| `api.restartChat()` | Clear all messages and start over |

#### Audio

| Method | What it does |
|--------|-------------|
| `api.playAudio("bgm-battle", { volume, fadeDuration, chainTo, maxDuration, duckBgm })` | Play SFX / music with various options |
| `api.stopAudio("bgm-battle", 2.0)` | Stop a specific track (optional fade-out, in seconds) |
| `api.stopAudio()` | Stop all audio |
| `api.setAudioVolume("bgm", 0.8)` | Set BGM or SFX volume |
| `api.getAudioVolume("bgm")` | Get current BGM or SFX volume (returns 0–1) |

#### Navigation & UI

| Method | What it does |
|--------|-------------|
| `api.toggleImmersive()` | Toggle full-screen mode |
| `api.copyToClipboard("text")` | Copy text to clipboard |
| `api.navigate("/app/hub")` | Navigate to another page |
| `api.showToast("Saved!", "success")` | Show a toast notification |
| `api.switchGreeting(2)` | Switch to another greeting variant |

#### Persistent storage (survives across sessions)

| Method | What it does |
|--------|-------------|
| `api.storage.get("highScore")` | Read a saved value (async) |
| `api.storage.set("highScore", "9999")` | Save a value (async) |
| `api.storage.remove("highScore")` | Delete a saved value (async) |

### Advanced

#### Extended state

| Property | What it gives you |
|----------|------------------|
| `api.globalVariables` | Global-scope variables (shared across all sessions) |
| `api.personalVariables` | Per-user variables |
| `api.roomPersonalVariables` | Per-user variables scoped to the current room |
| `api.room` | Current room data (for multiplayer worlds): `{ id, name, ... }` or `null` |
| `api.permissions` | Current user's permissions on this world: `{ canEdit, ... }` or `null` |
| `api.pendingChoices` | Choice buttons awaiting player input: `["Option 1", "Option 2"]` |
| `api.error` | Current error message (API failure, generation error), or `null` |
| `api.streamingReasoning` | The reasoning / thinking content the AI is currently streaming |
| `api.readOnly` | `true` when viewing someone else's session (input disabled) |
| `api.greetingContent` | Opening greeting text extracted from world entries, or `null` |
| `api.canvasMode` | Current display mode: `"chat"`, `"custom"`, or `"fullscreen"` |

#### Extended actions

| Method | What it does |
|--------|-------------|
| `api.setVariable("health", 50, { scope, targetUserId })` | Set a variable with options. `scope` picks which variable scope, `targetUserId` picks a specific player (multiplayer) |
| `api.clearPendingChoices()` | Clear the pending choice buttons |
| `api.swipeMessage(id, "left"/"right")` | Swipe through alternate versions of a message (AI regenerations) |

#### Assets

| Method | What it does |
|--------|-------------|
| `api.resolveAssetUrl("@asset:abc123")` | Resolve an asset reference to a CDN URL |

#### Session management

| Method | What it does |
|--------|-------------|
| `api.revertToMessage(messageId)` | Rewind the conversation to a given point |
| `api.createSession(worldId)` | Start a new play session |
| `api.deleteSession(sessionId)` | Delete a play session |
| `api.listSessions(worldId)` | List all saved sessions |

#### Model management

| Method | What it does |
|--------|-------------|
| `api.selectedModel` | Currently selected AI model ID |
| `api.userPlan` | User's subscription plan (`"free"`, `"go"`, `"plus"`, `"pro"`, `"ultra"`) |
| `api.preferredProvider` | `"official"` (platform API) or `"private"` (user's own key) |
| `api.setModel("claude-sonnet-4-6")` | Switch to a different AI model |
| `api.getModels()` | Get available models, pinned models, and recently used models (async) |
| `api.pinModel("model-id")` | Pin a model as a favorite |
| `api.unpinModel("model-id")` | Unpin a favorite model |

---

## What's available in your code

These are auto-available — no imports needed:

- **React** — `React.useState()`, `React.useEffect()`, `React.useMemo()`, `React.useRef()`
- **useYumina()** — SDK (see above)
- **`<Chat />`** — Full chat building block. Zero props = default chat; optional `renderBubble`, `className`, `children`. See [`<Chat>` API](#chat-api) above
- **`<MessageList />`** — Renders only the message stream (with scrolling / streaming / swipes), no input box. Optional `rendererComponent` takes over bubble rendering
- **`<MessageInput />`** — Renders only the input box (with disabled state / choice buttons / model picker)
- **Icons** — 1400+ Lucide icons: `Icons.Heart`, `Icons.Sword`, `Icons.Shield`, etc. Full list at https://lucide.dev/icons
- **Tailwind CSS** — Full set of utility classes for styling
- **useAssetFont()** — Load custom fonts from uploaded assets
- **`<ChatCanvas />`** _(legacy)_ — Still available in the legacy sandbox, behavior identical to `<Chat />`. Please use `<Chat />` for new code

---

## Game UI components with Tailwind + `<style>`

Yumina no longer ships a pre-built YUI component library — Tailwind is expressive enough to cover almost any visual effect you want, and a small `<style>` tag handles what inline styles can't (pseudo-elements, hover, keyframe animations, clip-path). Here are a few common patterns you can **copy and tweak**.

### Stat bar (HP, stamina, affection)

```tsx
function StatBar({ value, max, label, color = "#ef4444" }) {
  var pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-200">
      <span className="w-10 font-medium">{label}</span>
      <div className="relative flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-300"
          style={{ width: pct + "%", background: color }}
        />
      </div>
      <span className="w-14 text-right tabular-nums">{value}/{max}</span>
    </div>
  )
}
```

### Dialogue box (VN-style)

```tsx
function DialogueBox({ speaker, speakerColor = "#f472b6", children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/70 p-4 backdrop-blur-sm shadow-lg">
      {speaker && (
        <div className="mb-1 text-sm font-bold" style={{ color: speakerColor }}>
          {speaker}
        </div>
      )}
      <div className="leading-relaxed text-zinc-100">{children}</div>
    </div>
  )
}
```

### Choice buttons

```tsx
function ChoiceButtons({ choices, onSelect }) {
  return (
    <div className="flex flex-col gap-2">
      {choices.map(function(c, i) {
        return (
          <button
            key={i}
            onClick={function() { onSelect(c) }}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-left text-sm hover:bg-white/10 hover:border-white/20 transition"
          >
            {c.label}
          </button>
        )
      })}
    </div>
  )
}
```

### Scene background + sprite

```tsx
function VNScene({ bg, sprite, children }) {
  return (
    <div
      className="relative w-full h-full bg-cover bg-center"
      style={{ backgroundImage: bg ? "url(" + bg + ")" : "linear-gradient(135deg,#1e293b,#0f172a)" }}
    >
      {sprite && (
        <img
          src={sprite}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 max-h-[80%]"
        />
      )}
      <div className="absolute inset-x-4 bottom-4">{children}</div>
    </div>
  )
}
```

### Have Studio AI write them for you

These skeletons are short enough that you can just ask Studio AI to add a health bar, dialogue box, or stat card — it knows Tailwind and the dark theme. Describe the effect:

> "Add a health bar above each message that reads the `health` variable (0–100). Red, with a transition animation, and show the number on the right."

If you're working inside an app template, you can also click the "Insert snippet" menu in the top-right of the TSX editor — it has ready-made skeletons for basic chat, sidebars, and VN shells.

---

## Disallowed APIs

Your code runs in a secure sandbox. The following browser APIs are **blocked** — use the SDK alternatives instead:

| Don't use | Use instead |
|-----------|-------------|
| `fetch('/api/...')` | `api.listSessions()`, `api.createSession()`, etc. |
| `localStorage.getItem()` | `api.storage.get()` |
| `localStorage.setItem()` | `api.storage.set()` |
| `window.location` | `api.sessionId`, `api.worldId`, `api.navigate()` |
| `navigator.clipboard` | `api.copyToClipboard()` |

---

## Theme-safe colors

These Tailwind classes automatically adapt to Yumina's dark theme:

| What you want | Use this class |
|---------------|----------------|
| Card background | `bg-card` |
| Page background | `bg-background` |
| Muted / subtle background | `bg-muted` |
| Primary text | `text-foreground` |
| Secondary / dim text | `text-muted-foreground` |
| Border | `border-border` |
| Accent / brand color | `text-primary`, `bg-primary` |

---

## Common errors

| Problem | How to fix |
|---------|-----------|
| `useState is not defined` | Use `React.useState()` |
| `import ... from` | Delete all imports — everything is already in scope |
| Component doesn't show | Make sure you wrote `export default function` |
| TypeScript errors | Delete generics `<T>`, interfaces, and `as` type assertions |
| Full-screen blank | You didn't render any chat building block — add a `<Chat />`, or compose `<MessageList />` + `<MessageInput />` |
| No input box | You forgot `<MessageInput />` in your custom layout, or you need to write your own input calling `api.sendMessage()` |
| `renderMarkdown` undefined | Inside `renderBubble`, grab it from `msg.renderMarkdown`, not from the outer scope |
| Variables don't update | Make sure the AI prompt tells the AI to emit `[variableName: set value]` directives |

---

## Tips

1. **Start with Studio AI.** Describe what you want and let it generate the code. You can always tweak manually afterwards.

2. **Start simple.** Write a message template that only changes colors and fonts first. Layer in more features gradually.

3. **Reuse the skeletons in this doc.** The StatBar / DialogueBox / ChoiceButtons above are copy-paste ready. Write them once and reuse everywhere in your world — no need to have the AI reinvent them.

4. **Use the preview panel to test.** The editor's preview panel renders your component live with sample data.

5. **Use `msg.messageIndex === 0` for the greeting.** Check this inside `renderBubble` to identify the first assistant message — perfect for character creation, opening animations, or tutorial displays.

6. **Don't forget streaming.** When `msg.isStreaming` is true, the message content is still generating. Your bubble should handle incomplete text gracefully (e.g., unclosed tags).

7. **Use `<Chat />` whenever you can.** The platform keeps improving it (swipes, checkpoints, model picker are all post-launch additions). Building from scratch means you don't benefit from new features.

---

## Practical AI prompts

Each example below gives you a full prompt you can copy straight into Studio AI or an external AI.

### Example 1: Horror game status bar (message template)

**Effect**: A dark, horror-styled HP/stamina/day panel above each message.

**Copy this into Studio AI or an external AI:**

```
Customize how messages are displayed — build a horror-survival status panel.

Effect:
1. Above each message, a dark status bar — deep gray background, thin dark-red border, rounded corners
2. Inside the bar, left to right:
   - Red HP bar (reads the health variable, full = 100)
   - Green stamina bar (reads the energy variable, full = 100)
   - Right side: amber text showing "Day X · Night" (reads day and phase variables)
   - If is_armed is true, add a small white sword icon on the far right
3. The message text renders normally below the status bar
4. Style should feel oppressive, desaturated, post-apocalyptic horror

Variables: health (hp, 0-100), energy (stamina, 0-100), day (day number), phase ("night" or "day"), is_armed (boolean)
```

For an external AI, append the [technical info block](#use-an-external-ai) at the end.

### Example 2: Visual novel style (message template)

**Effect**: Full-screen scene background + character sprite + semi-transparent dialogue box at the bottom.

**Copy this into Studio AI or an external AI:**

```
Build a visual-novel / galgame style message display.

Effect:
1. The whole area looks like a game scene, 16:9 aspect ratio
   - Background image reads from currentScene variable (image URL); fallback to a deep-blue gradient
2. Character sprite centered in the screen, reads from characterPortrait variable (large, centered)
3. Semi-transparent black dialogue box at the bottom:
   - Speaker name reads from characterName variable, sakura-pink color
   - Dialogue content is the AI's reply text
4. *Asterisk-wrapped text* = action description, gray italic, rendered above the dialogue box
5. Small affection display in the top-right (reads affection variable); red when low, white mid, pink high

Variables: currentScene (background URL), characterPortrait (sprite URL), characterName (character name), affection (0-100)
```

### Example 3: Game sidebar (root component + floating panel)

**Effect**: `<Chat />` takes the main area, fixed 320px sidebar on the right shows character info + stats + inventory.

**Copy this into Studio AI or an external AI:**

```
Build a root component with a sidebar: the root div is a flex row, <Chat /> fills the remaining width on the left, and a fixed 320px sidebar sits on the right.

Sidebar design:
1. Dark gray panel, rounded
2. Top: character info
   - Left: circular avatar (reads playerAvatar variable for image URL), purple border
   - Right: character name (playerName variable) and level "Lv.X" (level variable); level in purple
3. Middle: stats area, titled "Stats":
   - Red HP bar reading hp and max_hp variables
   - Blue MP bar reading mp and max_mp variables
   - Three stat cards in a row: Strength (strength, sword icon), Defense (defense, shield icon), Speed (speed, lightning icon)
4. Bottom: inventory, titled "Inventory":
   - 3-column grid of item slots, reads inventory variable (array; each item has name, icon, count)
   - Empty slots show a gray dashed outline; 9 slots total

Variables: playerAvatar (avatar URL), playerName (character name), level (level number), hp/max_hp (current/max HP), mp/max_mp (current/max MP), strength/defense/speed (stat numbers), inventory (inventory array)
```

::: tip These prompts are ready to use
The three prompts above are ready to paste straight into Studio AI or an external AI. Drop the generated code into `index.tsx` and you're done. If something feels off, keep iterating with the AI — tweak colors, sizes, layout — a few rounds usually nail it (๑•̀ㅂ•́)و✧
:::
