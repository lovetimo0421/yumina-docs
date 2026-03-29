<div v-pre>

# Custom Message Renderer

> With a snippet of TSX code, turn AI replies from "a wall of plain text" into whatever visual experience you want — speech bubbles, visual novels, battle logs, RPG panels, you name it.

---

## The short version

### What is a renderer?

Picture this: the AI sends you a reply. By default, it displays as plain Markdown text — bold, italics, line breaks, nothing more. Like a black-and-white paperback novel.

The **message renderer** is your "layout designer." You hand it a TSX code snippet, and it intercepts every AI reply and presents it according to your design.

An analogy:
- Default rendering = reading a novel in Notepad
- Custom rendering = reading the same novel in a hardcover edition, with illustrations, typesetting, and chapter headers

### Comparison

| | Default rendering | Custom rendering |
|--|------------------|-----------------|
| Appearance | Plain Markdown | Fully custom UI |
| Character name | Uniform "Narrator" | Can vary dynamically per character |
| Game state | Separate sidebar | Can be embedded directly in the message |
| Interaction | None | Can add choice buttons, collapsible panels, etc. |
| Best for | Simple chat | Immersive game experience |

### Can't code?

No problem. You can:
1. Copy and paste from existing templates, adjusting text and colors
2. Describe what you want to an AI (like Claude) and let it write the code
3. Start with default rendering to get the logic working, then add customization gradually

That said, this is an **advanced feature**. If you've never touched HTML or React, consider trying the built-in components from 07-components.md first — those don't require any coding.

---

### Before you start: Understanding the three-layer architecture

Before diving into renderer code, take two minutes to understand how the whole system works. Once you see the big picture, the code will make much more sense.

The system has three layers:

```
User sends a message
    ↓
AI (language model) generates a text reply
    ↓
Message renderer "wraps" the text into a styled UI
```

#### Layer 1: AI response content

The AI generates a normal text reply, but it also sneaks in "instructions" alongside the text:

```
The weather is so nice today~

[affection: add 5]
[mood: set happy]
```

These `[...]` bracketed items are called **directives**. Players never see them, but the engine knows how to read them. See [Directives & Macros](./05-directives-and-macros.md) for the full reference.

#### Layer 2: Variable system

When the engine reads `[affection: add 5]`, it updates the `affection` variable from 50 to 55.

Variables are like save data in a video game — stored on the server, available anytime. See [Variables](./04-variables.md) for the full reference.

#### Layer 3: Message renderer (frontend UI)

This is the critical piece, and the main subject of this chapter.

By default, AI replies display as plain Markdown text. But when you enable a message renderer, every message passes through a TSX function (think of it as a "template") before being displayed. The function receives:

| Input | Meaning |
|-------|---------|
| `content` | What the AI said (text) |
| `variables` | Current values of all variables (affection=55, mood=happy) |

And outputs a styled UI:

```
┌─────────────────────────────┐
│ The weather is so nice today~│
│                             │
│ ❤️ Affection ████████░░ 55  │
│ 😊 Mood: happy              │
└─────────────────────────────┘
```

#### The complete flow

Putting all three layers together:

```
① You send a message: "Hello!"
        ↓
② AI generates reply text + [affection: add 2] directive
        ↓
③ Engine parses directive, updates variable (affection → 52)
        ↓
④ Message renderer function is called
   Input: { content: "Hey there~", variables: { affection: 52, mood: "happy" } }
        ↓
⑤ Function outputs HTML with a status bar, displayed on screen
```

> **In one sentence**: The AI generates text and changes data, the renderer turns data into a beautiful UI, and variables are the bridge connecting them.

---

### Reading a real renderer

Now that you understand the three layers, let's look at what a real renderer looks like. Here's a simple "affection + mood status bar" renderer:

```tsx
export default function ChatRenderer({ content, role, variables, renderMarkdown }) {
  // User messages render directly, no status bar
  if (role === "user") {
    return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />;
  }

  // Read data from variables, with defaults
  var affection = variables.affection !== undefined ? Number(variables.affection) : 50;
  var mood = variables.mood || "happy";

  // Mood → emoji and color mapping
  var moodEmoji = { "happy": "😊", "calm": "😌", "shy": "😳", "angry": "😠" };
  var moodColor = { "happy": "text-yellow-400", "calm": "text-blue-400", "shy": "text-pink-400", "angry": "text-red-400" };

  // Affection → progress bar color
  var barColor = affection >= 70 ? "bg-pink-500" : affection >= 40 ? "bg-yellow-500" : "bg-gray-500";

  return (
    <div className="space-y-2">
      {/* AI's message */}
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />

      {/* Status bar */}
      <div className="mt-3 px-3 py-2 rounded-lg bg-muted border border-border text-sm flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Icons.Heart size={14} className="text-pink-400" />
          <span>Affection</span>
          <div className="flex-1 bg-background rounded-full h-2">
            <div className={"h-2 rounded-full " + barColor} style={{ width: affection + "%" }} />
          </div>
          <span>{affection}</span>
        </div>
        <div className={"flex items-center gap-1 " + (moodColor[mood] || "text-gray-400")}>
          <span>{moodEmoji[mood] || "😐"}</span>
          <span>{mood}</span>
        </div>
      </div>
    </div>
  );
}
```

Breaking it down:

| Code | What it does |
|------|-------------|
| `if (role === "user")` | User messages render as plain text, no status bar |
| `variables.affection` | Reads the current affection value from the variable system |
| `moodEmoji` / `moodColor` | Data → style mapping: different moods show different emojis and colors |
| `barColor` | Affection level determines progress bar color (pink / yellow / gray) |
| `dangerouslySetInnerHTML` | React's standard way to render HTML strings |
| `style={{ width: affection + "%" }}` | Progress bar width is directly bound to the variable — value changes, bar updates |
| `className="rounded-lg bg-muted ..."` | Tailwind CSS classes: `rounded-lg` = rounded corners, `bg-muted` = theme-aware gray background |

> Variables are data, TSX is the template. Every time a message is displayed, data fills the template to produce the final HTML — just like an Excel formula where changing a cell value automatically updates the display.

---

## The detailed version

### Three rendering approaches — know the difference

Yumina has three ways to "customize the UI," and they serve completely different purposes. Don't mix them up:

#### 1. messageRenderer — reskin individual messages

This is the main subject of this chapter. It replaces the default Markdown rendering, making every AI reply display according to your design.

Best for: chat bubbles, visual novel dialogue boxes, battle logs.

In the world definition, it's a separate field:

```json
{
  "messageRenderer": {
    "id": "message-renderer",
    "name": "My Renderer",
    "tsxCode": "export default function Renderer({ content, renderMarkdown }) { ... }",
    "description": "",
    "order": 0,
    "visible": true
  }
}
```

#### 2. customComponents — additional UI panels

This does **not** replace message rendering — it **adds** independent panels alongside the chat. Like character creation screens, game sidebars, map panels.

In the world definition, it's an array and can have multiple:

```json
{
  "customComponents": [
    { "id": "...", "name": "Character Panel", "tsxCode": "...", "order": 0, "visible": true },
    { "id": "...", "name": "Map",             "tsxCode": "...", "order": 1, "visible": true }
  ]
}
```

#### 3. fullScreenComponent — full-screen mode

When you set `fullScreenComponent: true` in settings, customComponents take over the entire screen and the chat window disappears. Best for visual novels, full-screen games, or any completely custom experience.

```json
{
  "settings": {
    "fullScreenComponent": true
  }
}
```

One-sentence summary:
- **messageRenderer** = change what messages look like
- **customComponents** = add things alongside messages
- **fullScreenComponent** = full-screen takeover

---

### CustomComponent data structure

Whether it's a messageRenderer or a customComponent, the underlying data structure is the same `CustomComponent`:

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string | Display name (for your own reference) |
| `tsxCode` | string | TSX code — the core content |
| `description` | string | Description (optional) |
| `order` | number | Sort order (when there are multiple customComponents) |
| `visible` | boolean | Whether to display |
| `updatedAt` | string | Last updated time (auto-maintained) |

---

### TSX crash course (for people who've never written React)

TSX is basically "HTML + JavaScript mixed together." Here's the simplest example:

```tsx
export default function MyRenderer({ content }) {
  return (
    <div style={{ padding: "16px", background: "#1a1a2e", borderRadius: "8px" }}>
      <p style={{ color: "#e0e0e0" }}>{content}</p>
    </div>
  );
}
```

A few key points:

**Tags are HTML tags**, but some names are different:
- `class` becomes `className`
- `style` takes an object, not a string: `style={{ color: "red" }}` (note the double curly braces)

**Curly braces hold JavaScript expressions:**
```tsx
<span>{variables.health} / {variables.maxHealth}</span>
```

**Conditional rendering** — show something only when a condition is true:
```tsx
{health < 20 && <span style={{ color: "red" }}>Danger!</span>}
```

**List rendering** — iterate over an array:
```tsx
{items.map((item, i) => <div key={i}>{item}</div>)}
```

**Ternary** — choose between two options:
```tsx
<span style={{ color: isAlive ? "green" : "red" }}>
  {isAlive ? "Alive" : "Dead"}
</span>
```

---

### Props passed to messageRenderer

When your renderer is called, Yumina passes these parameters:

```typescript
// Your function signature should look like this:
export default function MyRenderer({
  content,         // string   — AI reply text (with [var: op value] directives stripped)
  role,            // string   — "assistant" or "user"
  messageIndex,    // number   — which message this is (0-indexed)
  variables,       // object   — current game state (all latest variable values)
  renderMarkdown,  // function — built-in Markdown renderer, returns an HTML string
  isStreaming,     // boolean  — whether the AI is currently streaming output
}) {
  // ...
}
```

Details on each parameter:

**`content`** — the most important one. After the engine processes the AI's reply, all `[health: subtract 10]`-style directives have been extracted. What you receive is clean narrative text.

**`role`** — usually `"assistant"` (AI reply). User messages don't go through the renderer by default, but if you want to handle them too, check this field.

**`variables`** — a snapshot of game state for that message. E.g. `variables.health`, `variables["player-name"]`. Each message carries the state snapshot at the time it was sent.

**`renderMarkdown`** — Yumina's built-in Markdown-to-HTML function. If you don't want to handle bold/italic yourself, just call it:

```tsx
<div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
```

**`isStreaming`** — `true` while the AI is streaming output. Use it to show a typing animation or loading indicator.

---

### useYumina() Hook — interacting with the game engine

Beyond Props, you can also get more capabilities through `useYumina()`:

```tsx
export default function MyRenderer({ content, renderMarkdown }) {
  const api = useYumina();

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      <button onClick={() => api.sendMessage("Attack")}>Attack</button>
      <button onClick={() => api.setVariable("health", 100)}>Restore Full Health</button>
      <button onClick={() => api.executeAction("flee")}>Trigger Flee Rule</button>
    </div>
  );
}
```

Full `useYumina()` API:

| Method/property | Description |
|-----------------|-------------|
| `sendMessage(text)` | Send a message as the player |
| `setVariable(id, value)` | Directly modify a game variable |
| `executeAction(actionId)` | Trigger an action-type rule |
| `variables` | All current game variables (same as the Props variables) |
| `worldName` | Current world name |
| `currentUser` | Current user info (`{ id, name, image }`) |
| `messages` | Full list of chat messages |
| `isStreaming` | Whether the AI is currently streaming |
| `streamingContent` | Current accumulated streaming content |
| `playAudio(trackId, opts)` | Play an audio track |
| `stopAudio(trackId?)` | Stop an audio track (omit ID to stop all) |
| `resolveAssetUrl(ref)` | Resolve `@asset:xxx` references to real URLs |

---

### Steps for writing a renderer

1. Open your world in the editor
2. Find the **Message Renderer** section
3. Select **Custom TSX** mode
4. Write your TSX code in the code box
5. The editor compiles in real time — the bottom shows compile status (green OK / red error)
6. Save the world and test it in the game

You can also edit in the **Studio** Code View panel — that's a better editing experience.

---

### What's available in the runtime environment

Your TSX code runs in a sandbox with these global variables available:

| Variable | Description |
|----------|-------------|
| `React` | The React library (`useState`, `useEffect`, etc. all in here) |
| `useYumina` | Hook for accessing the game API |
| `Icons` | All Lucide icons, usage: `<Icons.Heart size={16} />`. Full list at [lucide.dev/icons](https://lucide.dev/icons) |
| `YUI` | Yumina's built-in UI component library (`YUI.StatBar`, `YUI.Panel`, `YUI.DialogueBox`, etc.) |

Note: you **cannot** import any external packages. All dependencies come through the global variables above.

**YUI component library includes:**
Scene, Sprite, DialogueBox, ChoiceButtons, StatBar, StatCard, Badge, Panel, Tabs, ActionButton, ItemGrid, Fullscreen.

---

### Styling tips

**Inline styles** — most direct, no framework dependency:

```tsx
<div style={{
  background: "linear-gradient(135deg, #1a1a2e, #16213e)",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
}}>
```

**Tailwind CSS classes** — Yumina ships with Tailwind 4, most class names work directly:

```tsx
<div className="rounded-xl bg-slate-900 p-4 border border-slate-700">
```

Note: Tailwind's arbitrary value syntax (like `bg-[#1a1a2e]`) also works in custom components — the engine handles it at runtime.

**Animations** — use CSS @keyframes. Inject global styles in a `useEffect`:

```tsx
React.useEffect(() => {
  if (!document.querySelector("style[data-my-renderer]")) {
    const s = document.createElement("style");
    s.setAttribute("data-my-renderer", "1");
    s.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .my-fade-in { animation: fadeIn 0.4s ease-out; }
    `;
    document.head.appendChild(s);
  }
}, []);
```

**Google Fonts** — same approach, load dynamically in `useEffect`:

```tsx
React.useEffect(() => {
  if (!document.querySelector("link[data-my-font]")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap";
    link.setAttribute("data-my-font", "1");
    document.head.appendChild(link);
  }
}, []);
```

---

### Debugging

**Real-time editor compilation**: after every code change, the editor shows compile status at the bottom. Green "OK" means the syntax is fine.

**Common errors and fixes:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No component exported" | Forgot `export default` | Add `export default` before the function |
| "Unexpected token" | JSX syntax error, like an unclosed tag | Check every `<div>` has a matching `</div>` |
| Renderer blank screen | Runtime error (like accessing an undefined property) | Add safety checks: `variables?.health ?? 0` |
| Style not applying | Tailwind arbitrary value syntax error | Try inline style instead |
| `import` error | Sandbox doesn't support import | Use global variables: `React`, `Icons`, `YUI` |

**Browser console debugging**: open dev tools (F12) and check the Console panel for runtime errors. They'll have a `Component Error` prefix.

---

## Practical examples

### Example 1: Simple bubble renderer

Wrap the AI reply in a rounded bubble with a role label. The most basic starting template.

```tsx
export default function BubbleRenderer({ content, role, renderMarkdown }) {
  const isUser = role === "user";

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "8px",
    }}>
      <div style={{
        maxWidth: "80%",
        background: isUser
          ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
          : "linear-gradient(135deg, #1e293b, #0f172a)",
        borderRadius: "16px",
        borderTopLeftRadius: isUser ? "16px" : "4px",
        borderTopRightRadius: isUser ? "4px" : "16px",
        padding: "12px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}>
        {/* Role label */}
        <div style={{
          fontSize: "12px",
          fontWeight: "bold",
          color: isUser ? "#93c5fd" : "#fbbf24",
          marginBottom: "6px",
        }}>
          {isUser ? "You" : "Narrator"}
        </div>

        {/* Message content */}
        <div
          style={{ color: "#e2e8f0", lineHeight: "1.7", fontSize: "14px" }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      </div>
    </div>
  );
}
```

---

### Example 2: Visual novel style

Background image + character name + dialogue text, capturing that Galgame feel.

```tsx
export default function VNRenderer({ content, variables, renderMarkdown }) {
  const api = useYumina();
  const speaker = variables["current-speaker"] || "???";
  const bg = variables["current-bg"] || "";

  // Inject animation styles
  React.useEffect(() => {
    if (!document.querySelector("style[data-vn-renderer]")) {
      const s = document.createElement("style");
      s.setAttribute("data-vn-renderer", "1");
      s.textContent = `
        @keyframes vn-text-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vn-text-fade { animation: vn-text-in 0.3s ease-out; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div style={{
      position: "relative",
      borderRadius: "12px",
      overflow: "hidden",
      minHeight: "200px",
      background: "#0a0a0f",
    }}>
      {/* Background image */}
      {bg && (
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
          filter: "blur(1px)",
        }} />
      )}

      {/* Dialogue area */}
      <div style={{
        position: "relative",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        minHeight: "200px",
      }}>
        {/* Speaker name */}
        <div style={{
          display: "inline-block",
          background: "rgba(212, 168, 72, 0.15)",
          border: "1px solid rgba(212, 168, 72, 0.3)",
          borderRadius: "4px",
          padding: "2px 12px",
          marginBottom: "8px",
          alignSelf: "flex-start",
        }}>
          <span style={{
            color: "#d4a848",
            fontSize: "13px",
            fontWeight: "bold",
            letterSpacing: "2px",
          }}>
            {speaker}
          </span>
        </div>

        {/* Dialogue text */}
        <div style={{
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "16px 20px",
        }}>
          <div
            className="vn-text-fade"
            style={{
              color: "#e8e0d0",
              fontSize: "15px",
              lineHeight: "2.0",
              fontFamily: '"Noto Serif SC", "Source Han Serif SC", Georgia, serif',
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>
    </div>
  );
}
```

Usage tip: have the AI use `[current-speaker: set "CharacterName"]` directives in replies to switch speakers, and `[current-bg: set "imageURL"]` to change backgrounds.

---

### Example 3: Battle log style

Timestamped, color-coded log entries — great for combat/exploration games.

```tsx
export default function BattleLogRenderer({ content, variables, renderMarkdown }) {
  const hp = Number(variables["health"] ?? 100);
  const maxHp = Number(variables["max-health"] ?? 100);
  const hpPercent = maxHp > 0 ? Math.min(100, (hp / maxHp) * 100) : 0;
  const hpColor = hp < 30 ? "#ef4444" : hp < 60 ? "#f59e0b" : "#22c55e";

  // Split reply into log entries by line break
  const lines = (content || "").split("\n").filter(function(l) {
    return l.trim().length > 0;
  });

  // Guess the type of each log entry based on content
  function getLineType(line) {
    if (/damage|attack|hit/.test(line.toLowerCase())) return "damage";
    if (/heal|restore|recover/.test(line.toLowerCase())) return "heal";
    if (/dodge|block|defend/.test(line.toLowerCase())) return "defense";
    if (/obtain|drop|pick up|loot/.test(line.toLowerCase())) return "loot";
    return "narration";
  }

  var typeColors = {
    damage:    { dot: "#ef4444", text: "#fca5a5" },
    heal:      { dot: "#22c55e", text: "#86efac" },
    defense:   { dot: "#3b82f6", text: "#93c5fd" },
    loot:      { dot: "#f59e0b", text: "#fcd34d" },
    narration: { dot: "#6b7280", text: "#d1d5db" },
  };

  return (
    <div style={{
      background: "#0c0c0c",
      border: "1px solid #1f2937",
      borderRadius: "8px",
      padding: "12px",
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    }}>
      {/* HP status bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
        padding: "8px 10px",
        background: "#111",
        borderRadius: "6px",
      }}>
        <Icons.Heart size={14} style={{ color: hpColor }} />
        <div style={{ flex: 1, height: "6px", background: "#1f2937", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{
            width: hpPercent + "%",
            height: "100%",
            background: hpColor,
            borderRadius: "3px",
            transition: "width 0.5s ease",
          }} />
        </div>
        <span style={{ color: hpColor, fontSize: "12px", fontWeight: "bold" }}>
          {hp}/{maxHp}
        </span>
      </div>

      {/* Log entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {lines.map(function(line, i) {
          var type = getLineType(line);
          var colors = typeColors[type];
          return (
            <div key={i} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "4px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              {/* Line number */}
              <span style={{ color: "#4b5563", fontSize: "11px", whiteSpace: "nowrap", marginTop: "2px" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {/* Type dot */}
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: colors.dot,
                marginTop: "6px",
                flexShrink: 0,
              }} />
              {/* Content */}
              <span style={{ color: colors.text, fontSize: "13px", lineHeight: "1.6" }}>
                {line}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Next steps

- Want independent UI panels (sidebar, character creation screen)? See **07-components.md**
- Want AI replies to automatically change game state? See **06-rules-engine.md** and **04-variables.md**
- Want to add background music and sound effects? See **09-audio.md**

</div>
