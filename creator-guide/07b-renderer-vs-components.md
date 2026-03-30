<div v-pre>

# Message Renderer vs Custom Components

> Two ways to customize the UI that look similar but work completely differently. This guide explains the difference and when to use which.

---

## One-sentence summary

- **Message Renderer (`messageRenderer`)**: Changes how each AI message looks. Works in normal chat mode.
- **Custom Components (`customComponents`)**: Take over the entire screen to build an independent game UI. Only work in fullscreen mode.

**They don't work at the same time.** A single toggle controls which one is active: `fullScreenComponent`.

---

## How they relate

```
fullScreenComponent = false (default)
  → Player sees: Normal chat interface
  → messageRenderer: ✅ Active (renders each message)
  → customComponents: ❌ Not shown (even if you wrote code for them)

fullScreenComponent = true
  → Player sees: Fullscreen custom UI (no chat box, no input field)
  → messageRenderer: ❌ Not active (never called)
  → customComponents: ✅ Fill the entire screen
```

This is not "two things coexisting" — it's **one or the other**. Toggle off → message renderer path. Toggle on → custom component path.

---

## Detailed comparison

| | Message Renderer | Custom Components |
|--|-----------------|-------------------|
| **Where to configure** | Message Renderer tab in editor | Enter Studio → Code View |
| **How many** | Only 1 | Multiple allowed |
| **When visible** | Normal chat mode (default) | Fullscreen mode only |
| **Where it appears** | Replaces each message's rendering | Fills the entire screen |
| **Chat interface** | Normal (message list + input box) | **Completely hidden** |
| **Data received** | Per-message `content`, `role`, `messageIndex` + `useYumina()` | Only `useYumina()` (no per-message data) |
| **Typical use** | Chat bubbles, status panels, battle logs, interactive buttons | Full visual novel UI, complete game interface |
| **In fullscreen mode** | Disabled | Active |
| **In normal mode** | Active | Disabled |

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

- **Only 1** — you can't have multiple renderers
- **Disabled in fullscreen mode** — if `fullScreenComponent: true`, the renderer is never called
- **Called for every message** — if you only want content on a specific message, you need to check `messageIndex` or `isLastMsg` yourself

---

## Custom Components: How they work

Custom components are **completely independent UI panels**. They don't replace message rendering — they **take over the entire screen**. The chat message list, input box, and even the top navigation bar all disappear, leaving only your components.

**You must enable fullscreen mode to see them.** In the editor's Overview tab or world settings, set `fullScreenComponent` to `true`.

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

- **Only visible in fullscreen mode** — with `fullScreenComponent: false` (default), components don't render at all
- **Chat interface disappears** — players can't see the message list or input box. You need to build your own chat using `api.messages` and `api.sendMessage()` if needed
- **ESC exits the world** — in fullscreen mode, pressing ESC navigates away from the world entirely, not just exits fullscreen

---

## How to choose

```
What you want to do → Which to use
──────────────────────────────────
Add HP bars above messages        → Message Renderer
Add buttons below messages        → Message Renderer
Change message appearance         → Message Renderer
Build a fullscreen visual novel   → Custom Components + fullScreenComponent: true
Build a complete game interface   → Custom Components + fullScreenComponent: true
Keep chat but add a sidebar       → Not currently supported (components are fullscreen only)
```

> **Most creators only need the message renderer.** Custom components are for advanced creators who want full control over the interface. If you're unsure, start with the message renderer.

---

## How to set them up in the editor

### Message Renderer

1. Open editor → sidebar → **Message Renderer** tab
2. Select "Custom TSX"
3. Write your TSX code in the code box
4. Bottom shows "Compile Status: OK" when syntax is correct
5. Save, start a new session to test

### Custom Components

1. Open editor → click **Enter Studio** at the top
2. In the Studio's Code View panel, click **+** to add a component
3. Write your TSX code
4. Back in editor → **Overview** tab → confirm fullscreen mode is enabled
5. Save, start a new session to test

---

## Common misconceptions

### "I wrote a custom component but can't see it"

Most common reason: **fullscreen mode is off**. Custom components only render when `fullScreenComponent: true`. Check this in the editor's Overview tab.

### "I turned on fullscreen mode but the chat disappeared"

This is expected. In fullscreen mode, custom components take over the entire screen — the chat interface doesn't render. If you want chat functionality, you need to build it yourself using `api.messages` and `api.sendMessage()` inside your component.

### "Can I use both at the same time?"

In the current version, **you can't have both visible to players simultaneously**:
- Normal mode → only message renderer works
- Fullscreen mode → only custom components work

If you want a chat window embedded in a fullscreen game UI, you need to implement it inside your custom component.

### "Do they use the same API?"

Yes. Both can call `useYumina()` and get the exact same API: `sendMessage`, `setVariable`, `executeAction`, `switchGreeting`, `playAudio`, `stopAudio`, `variables`, `messages`, etc.

The only difference is that the message renderer also receives **per-message data** (`content`, `role`, `messageIndex`, `renderMarkdown`), while custom components don't.

---

## Quick reference

| What you want | Use | Need fullscreen? |
|--------------|-----|-----------------|
| Change message appearance | Message Renderer | No |
| Add buttons/inputs to messages | Message Renderer | No |
| Build chat bubbles / battle logs | Message Renderer | No |
| Build a fullscreen visual novel | Custom Components | Yes |
| Build a complete game UI | Custom Components | Yes |
| Add a status panel next to messages | Message Renderer | No |
| Build your own chat interface | Custom Components | Yes |

</div>
