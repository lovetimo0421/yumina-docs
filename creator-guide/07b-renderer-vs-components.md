<div v-pre>

# Message Renderer vs Custom Components

> Two ways to customize the UI that look similar but work completely differently. This guide explains the difference and when to use which.

---

## One-sentence summary

- **Message Renderer** (also called **Message Template** in the editor) (`surface: "message"`): Changes how each AI message looks. Works in normal chat mode.
- **App Component** (`surface: "app"`): Takes over the entire screen to build an independent game UI.

Both are stored in the same `customUI` array — the `surface` field determines which mode a component belongs to.

---

## How they relate

Every custom component has a `surface` field — either `"message"` or `"app"`:

```
surface: "message"
  → Player sees: Normal chat interface
  → Your component renders each message with custom styling
  → Only one message-surface component allowed per world

surface: "app"
  → Player sees: Fullscreen custom UI (no chat box, no input field)
  → Your component fills the entire screen
  → Only one app-surface component allowed per world
```

If any visible component has `surface: "app"`, the world enters fullscreen mode automatically. Otherwise, the default chat interface is used with the message renderer active.

---

## Detailed comparison

| | Message Renderer (`surface: "message"`) | App Components (`surface: "app"`) |
|--|-----------------|-------------------|
| **Where to configure** | Editor → Components → Add → choose **Message** | Editor → Components → Add → choose **App** |
| **How many** | Only 1 | Only 1 |
| **When visible** | Normal chat mode (no app components present) | When any app component exists and is visible |
| **Where it appears** | Replaces each message's rendering | Fills the entire screen |
| **Chat interface** | Normal (message list + input box) | **Completely hidden** |
| **Data received** | Per-message `content`, `role`, `messageIndex` + `useYumina()` | Only `useYumina()` (no per-message data) |
| **Typical use** | Chat bubbles, status panels, battle logs, interactive buttons | Full visual novel UI, complete game interface |

---

## Message Renderer: How it works

The message renderer is a TSX code snippet that **replaces the default Markdown rendering**. When the AI sends a message, the engine doesn't show plain text — it hands the message content to your code to decide how to display it.

**It's called per-message.** If there are 10 messages in the chat, your renderer is called 10 times, each time with different `content` and `messageIndex`.

### Data it receives

```tsx
export default function Renderer({
  content,         // This message's text (directives stripped)
  role,            // "user" or "assistant"
  messageIndex,    // Which message this is (0-indexed)
  renderMarkdown,  // Built-in function: converts Markdown to HTML
  isStreaming,     // Whether the AI is still typing
}) {
  const api = useYumina();  // Also gets game state and interaction API
  // ...
}
```

### Good for

- Adding a status panel above/below messages (HP bars, gold display)
- Turning messages into chat bubbles
- Putting route selection buttons on the first message
- Adding an interactive input box on the last message
- Battle logs, color-coded text
- Anything that needs to **coexist with the chat interface**

### Key limitations

- **Only 1** — you can't have multiple message renderers
- **Disabled when app components exist** — if any visible `surface: "app"` component exists, the message renderer is not called
- **Called for every message** — if you only want content on a specific message, you need to check `messageIndex` or `isLastMsg` yourself

---

## App Components: How they work

App components are **completely independent UI panels**. They don't replace message rendering — they **take over the entire screen**. The chat message list, input box, and even the top navigation bar all disappear, leaving only your components.

**They activate automatically when present.** If any visible component has `surface: "app"`, the world enters fullscreen mode. No manual toggle needed.

### Data they receive

```tsx
export default function MyComponent() {
  const api = useYumina();
  // api.variables     — game state
  // api.sendMessage() — send a message (triggers AI response)
  // api.setVariable() — change a variable
  // api.executeAction() — trigger a behavior
  // api.messages      — full message history
  // api.isStreaming    — whether AI is typing
  // api.streamingContent — what the AI is typing right now
  // ...
}
```

Note: they do **not** receive `content`, `role`, `messageIndex`, or `renderMarkdown`. They're not rendering a specific message — they're a standalone fullscreen interface.

### Good for

- Visual novel fullscreen UI (backgrounds + sprites + dialogue box + choices)
- Complete game interfaces (map + status bar + inventory + chat window, all custom-built)
- Any experience where you don't want the default chat interface at all

### Key limitations

- **Chat interface disappears** — players can't see the message list or input box. You need to build your own chat using `api.messages` and `api.sendMessage()` if needed
- **ESC exits the world** — in fullscreen mode, pressing ESC navigates away from the world entirely, not just exits fullscreen

---

## How to choose

```
What you want to do → Which to use
──────────────────────────────────
Add HP bars above messages        → Message Renderer (surface: "message")
Add buttons below messages        → Message Renderer (surface: "message")
Change message appearance         → Message Renderer (surface: "message")
Build a fullscreen visual novel   → App Component (surface: "app")
Build a complete game interface   → App Component (surface: "app")
Keep chat but add a sidebar       → Not currently supported (app components are fullscreen only)
```

> **Most creators only need the message renderer.** App components are for advanced creators who want full control over the interface. If you're unsure, start with the message renderer.

---

## How to set them up in the editor

### Message Renderer

1. Open editor → **Components** section
2. Click "Add Component" → choose **Message**
3. Write your TSX code in the code editor
4. Bottom shows "Compile Status: OK" when syntax is correct
5. Save, start a new session to test

### App Components

1. Open editor → **Components** section
2. Click "Add Component" → choose **App**
3. Write your TSX code
4. The world automatically enters fullscreen mode when any app component is visible
5. Save, start a new session to test

---

## Common misconceptions

### "I wrote an app component but can't see it"

Check that the component's `visible` toggle is on in the editor. App components only render when they exist and are marked visible. Also make sure the component's `surface` is set to `"app"` — a `"message"` surface component won't trigger fullscreen mode.

### "I added an app component and the chat disappeared"

This is expected. When app components are active, they take over the entire screen — the chat interface doesn't render. If you want chat functionality, you need to build it yourself using `api.messages` and `api.sendMessage()` inside your component.

### "Can I use both at the same time?"

In the current version, **you can't have both visible to players simultaneously**:
- No app components → message renderer works
- App components present → only app components render

If you want a chat window embedded in a fullscreen game UI, you need to implement it inside your app component.

### "Do they use the same API?"

Yes. Both can call `useYumina()` and get the exact same API: `sendMessage`, `setVariable`, `executeAction`, `switchGreeting`, `playAudio`, `stopAudio`, `variables`, `messages`, etc.

The only difference is that the message renderer also receives **per-message data** (`content`, `role`, `messageIndex`, `renderMarkdown`), while app components don't.

---

## Quick reference

| What you want | Use | Surface |
|--------------|-----|---------|
| Change message appearance | Message Renderer | `"message"` |
| Add buttons/inputs to messages | Message Renderer | `"message"` |
| Build chat bubbles / battle logs | Message Renderer | `"message"` |
| Build a fullscreen visual novel | App Component | `"app"` |
| Build a complete game UI | App Component | `"app"` |
| Add a status panel next to messages | Message Renderer | `"message"` |
| Build your own chat interface | App Component | `"app"` |

</div>
