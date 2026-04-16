# API Reference

> The complete list of **everything** the sandbox exposes — globals, components, every field and method on `useYumina()`, type definitions, and the replacements for blocked browser APIs.

This is **reference documentation**, not a tutorial. Read the [Custom UI Guide](./07-components.md) first to get the big picture; come here to look up specific signatures.

Everything on this page is derived from the actual implementation in `packages/app/sandbox/`, so it matches the sandbox version shipped with the editor.

---

## Sandbox globals

These names are **available everywhere in your root component tree with no import statement**:

| Name | Kind | What it is |
|------|------|------------|
| `React` | module | Full React (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`, `useLayoutEffect`, `Fragment`, ...) |
| `useYumina` | hook | Platform SDK — see [`useYumina()` SDK](#useyumina-sdk) |
| `useAssetFont` | hook | Load a custom font from the asset library — see [`useAssetFont()`](#useassetfont) |
| `Icons` | object | 1400+ Lucide icon components: `<Icons.Heart />`, `<Icons.Sword />`. Full catalog: <https://lucide.dev/icons> |
| `Chat` | component | Full chat building block — see [`<Chat>`](#chat) |
| `MessageList` | component | Messages without input — see [`<MessageList>`](#messagelist) |
| `MessageInput` | component | Input bar only — see [`<MessageInput>`](#messageinput) |
| `ChatCanvas` | component | Legacy alias for `<Chat />` — see [`<ChatCanvas>`](#chatcanvas) |
| `exports`, `module` | object | CJS-style export fallback; you typically ignore these |

**Do NOT import React or any of the names above** — they are injected by the sandbox. Writing `import React from "react"` is silently stripped at compile time but is redundant.

**Your own files CAN be imported** — multi-file root components use ES module syntax: `import StatBar from "./stat-bar"`. Extensions `.tsx`, `.ts`, `.jsx`, `.js` can be omitted.

---

## `useYumina()` SDK

Call it inside your component function:

```tsx
function MyWorld() {
  const api = useYumina()
  // api.variables, api.sendMessage(...), ...
}
```

Full surface, grouped by purpose:

### State reads (synchronous)

Read the latest game state. The component re-renders whenever any of these change.

| Field | Type | Meaning |
|-------|------|---------|
| `variables` | `Record<string, unknown>` | Session-scope game variables. Example: `{ health: 80, gold: 150 }` |
| `globalVariables` | `Record<string, unknown>` | Global variables shared across all sessions |
| `personalVariables` | `Record<string, unknown>` | Per-player variables that span sessions |
| `roomPersonalVariables` | `Record<string, unknown>` | Per-player variables within the current room (multiplayer) |
| `worldName` | `string` | Name of the current world |
| `worldId` | `string` | UUID of the current world |
| `sessionId` | `string` | UUID of the current play session |
| `currentUser` | `{ id, name?, image? } \| null` | Currently logged-in player; `null` when logged out |
| `room` | `Record<string, unknown> \| null` | Current multiplayer room data, `null` in single-player |
| `messages` | `Array<Record<string, unknown>>` | Full message history — see [`SandboxMessage`](#sandboxmessage) |
| `permissions` | `Record<string, unknown> \| null` | Current player's permissions for this world (edit, share, ...) |
| `isStreaming` | `boolean` | `true` while the AI is generating a reply |
| `streamingContent` | `string` | Live streaming text from the AI (updates frequently) |
| `streamingReasoning` | `string` | Live "thinking" / reasoning text from the AI (only for reasoning models) |
| `pendingChoices` | `string[]` | Choice button labels emitted by rules |
| `error` | `string \| null` | Current error message (API failure, generation error) or `null` |
| `readOnly` | `boolean` | `true` when viewing someone else's session — `<Chat />` hides the input automatically |
| `checkpoints` | `Array<Checkpoint>` | Saved checkpoints — see [`Checkpoint`](#checkpoint) |
| `greetingContent` | `string \| null` | Greeting text computed from world entries (used by `<Chat />` as empty-state content) |
| `canvasMode` | `"chat" \| "custom" \| "fullscreen"` | Current canvas mode |
| `selectedModel` | `string` | Currently selected AI model ID |
| `userPlan` | `string` | User's subscription plan (`"free"`, `"go"`, `"plus"`, `"pro"`, `"ultra"`, `"internal"`) |
| `preferredProvider` | `"official" \| "private"` | Official API vs. user's own key |

### Game actions (fire-and-forget)

These methods return nothing; they just post the intent to the parent app.

| Method | What it does |
|--------|--------------|
| `sendMessage(text)` | Send a message as the player, triggering an AI reply |
| `setVariable(id, value, options?)` | Set a variable. `options`: `{ scope?: string; targetUserId?: string }`. `scope` picks the variable scope (for global/personal), `targetUserId` lets you write variables for a specific player in multiplayer |
| `executeAction(actionId)` | Fire a named action defined by the rules engine (e.g. `"attackBoss"`) |
| `switchGreeting(index)` | Swap to a different greeting variant by index |
| `clearPendingChoices()` | Dismiss pending choice buttons without picking one |

### Chat control

Everything the default chat bar can do, exposed so your custom UI can do it too.

| Method | What it does |
|--------|--------------|
| `editMessage(messageId, content)` | Edit an existing message. Returns `Promise<boolean>`; `true` on success |
| `deleteMessage(messageId)` | Delete a message. Returns `Promise<boolean>` |
| `regenerateMessage(messageId)` | Ask the AI to regenerate the given reply (fire-and-forget) |
| `continueLastMessage()` | Continue generating from the last AI message (fire-and-forget) |
| `stopGeneration()` | Interrupt the current stream (fire-and-forget) |
| `restartChat()` | Clear all messages, reset state, start fresh |
| `swipeMessage(messageId, "left" \| "right")` | Switch between AI alternatives (swipes) for a message. Returns `Promise<Record<string, unknown>>` |

### Sessions & branching

| Method | What it does |
|--------|--------------|
| `revertToMessage(messageId)` | Rewind the conversation to just before `messageId`. Returns `Promise<void>` |
| `branchFromMessage(messageId)` | Fork a new session at the given message (clones messages up to and including it plus the state snapshot). Returns `Promise<string \| null>` — new session ID, or `null` on failure (while streaming, multiplayer rooms, missing messages all fail) |
| `getBranchContext()` | Fetch the current branch slice (self, parent, siblings, children). Returns `Promise<BranchContext>`. Re-fetched every call; no client cache. See [`BranchContext`](#branchcontext) |
| `createSession(worldId)` | Start a new session for a world. Returns `Promise<string>` with the new session ID |
| `deleteSession(sessionId)` | Delete a session. Returns `Promise<void>` |
| `listSessions(worldId)` | List all sessions for a world. Returns `Promise<Array<Record<string, unknown>>>` |

### Checkpoints

A checkpoint is a named snapshot inside the current session you can rewind to.

| Method | What it does |
|--------|--------------|
| `saveCheckpoint()` | Save the current session state as a new checkpoint. Returns `Promise<void>` (the `checkpoints` field is pushed back afterwards) |
| `loadCheckpoints()` | Ask the parent to refresh the `checkpoints` array. Returns `Promise<void>` |
| `restoreCheckpoint(checkpointId)` | Restore the session to a saved checkpoint. Returns `Promise<void>` |
| `deleteCheckpoint(checkpointId)` | Delete a checkpoint. Returns `Promise<void>` |

### Audio

| Method | What it does |
|--------|--------------|
| `playAudio(trackId, opts?)` | Play an audio track defined in entries. `opts`: `{ volume?, fadeDuration?, chainTo?, maxDuration?, duckBgm? }` — `fadeDuration` in seconds, `chainTo` picks the next trackId to play, `duckBgm` lowers BGM during playback |
| `stopAudio(trackId?, fadeDuration?)` | Stop a track (omit `trackId` to stop everything) |
| `setAudioVolume(type, volume)` | `type` is `"bgm"` or `"sfx"`, `volume` is 0–1 |
| `getAudioVolume(type)` | Synchronously returns the current volume (0–1) |

### UI / navigation

| Method | What it does |
|--------|--------------|
| `toggleImmersive()` | Toggle immersive (full-screen) mode |
| `copyToClipboard(text)` | Copy to clipboard (replaces `navigator.clipboard.writeText`) |
| `navigate(path)` | Ask the parent to route to a path like `"/app/hub"` (replaces `window.location = ...`) |
| `showToast(message, type?)` | Show a toast in the parent UI. `type`: `"success"`, `"error"`, `"info"` (default) |

### Persistent storage (per-world)

Replacement for localStorage. Scoped by `worldId`; worlds cannot read each other's keys.

| Method | What it does |
|--------|--------------|
| `storage.get(key)` | Read. Returns `Promise<string \| null>` |
| `storage.set(key, value)` | Write (strings only). Returns `Promise<void>` |
| `storage.remove(key)` | Delete. Returns `Promise<void>` |

Need complex data? `JSON.stringify` / `JSON.parse` on the way in/out.

### Raw AI completions

Call the LLM **outside** the main chat pipeline. Use for "NPC inner monologue in a side panel", "AI-generated item descriptions", and so on. **Does not** write to message history, does not trigger state updates, does not consume greetings.

```tsx
const api = useYumina()
const text = await api.ai.complete({
  messages: [
    { role: "system", content: "You are a surly merchant." },
    { role: "user", content: "Price me an iron sword." },
  ],
  onDelta: (chunk) => setStreaming((s) => s + chunk),  // optional, per-token
  model: "claude-sonnet-4-6",                           // optional, defaults to selectedModel
  maxTokens: 500,                                       // optional
  temperature: 0.7,                                     // optional
})
```

Returns `Promise<string>` with the full response. 120-second timeout.

### Context injection

Inject a **one-shot** context message into the **next** main-chat AI turn. Consumed after one use; **no** visible chat message is created. Great for "phone messages", "NPC offstage dialogue", "environment changes" — things the main AI should know about but the player shouldn't see as a chat bubble.

```tsx
api.injectContext("You just received a cryptic text: 'Tonight, 9pm, usual place.'", { role: "system" })
// On the player's next message, the main AI will see this as a system message.
```

`options`: `{ role?: "system" \| "user" }` (defaults to `"system"`).

### Model picker

| Field / method | What it does |
|----------------|--------------|
| `selectedModel` | Current model ID |
| `userPlan` | User's plan tier |
| `preferredProvider` | `"official"` or `"private"` |
| `setModel(modelId)` | Switch models (fire-and-forget) |
| `getModels()` | Returns `Promise<{ models, pinnedModels, recentlyUsed }>` where `models` is `Array<{ id, name, provider, contextLength }>` |
| `pinModel(modelId)` / `unpinModel(modelId)` | Pin / unpin a model |

### Assets

| Method | What it does |
|--------|--------------|
| `resolveAssetUrl(ref)` | Turn an `@asset:xxx` reference into a CDN URL. Pure string transform, no network. HTTP/HTTPS URLs pass through unchanged |

### Markdown

| Method | What it does |
|--------|--------------|
| `renderMarkdown(text)` | Turn markdown into **safe HTML** (HTML entities escaped, dangerous tags stripped, formatting preserved). Feed the result to `dangerouslySetInnerHTML` inside a custom bubble and you're safe — see example below |

```tsx
<div dangerouslySetInnerHTML={{ __html: api.renderMarkdown(msg.rawContent) }} />
```

---

## Components

### `<Chat>`

The platform's full chat experience. **This is the everyday building block — zero props gives you the default chat.**

Includes: message list, auto-scroll, streaming cursor, swipe controls, message actions (edit/delete/regenerate), input bar, choice buttons, model picker, read-only mode, greeting placeholder.

```tsx
<Chat renderBubble={(msg) => <MyBubble {...msg} />} />
```

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `renderBubble?` | `(props: BubbleProps) => ReactNode` | Customize how each message bubble looks. Falls back to default markdown rendering if omitted |
| `className?` | `string` | Extra CSS class on the outer container |
| `children?` | `ReactNode` | Content rendered **above** the message list (e.g. a fixed HUD header) |

#### BubbleProps

The `msg` object your `renderBubble` callback receives:

| Field | Type | Meaning |
|-------|------|---------|
| `contentHtml` | `string` | **Pre-rendered safe HTML** (markdown already converted). Usually piped to `dangerouslySetInnerHTML` |
| `rawContent` | `string` | Raw markdown text before rendering (directive text included) |
| `role` | `"user" \| "assistant" \| "system"` | Message origin |
| `messageIndex` | `number` | Position in the list (0 = first, usually the greeting) |
| `isStreaming` | `boolean` | `true` while this message is being streamed |
| `stateSnapshot` | `Record<string, unknown> \| null` | Game state at the moment this message was generated (useful for "what were HP/location back then") |
| `variables` | `Record<string, unknown>` | Current (latest) game variables |
| `renderMarkdown` | `(text) => string` | Helper: turn any markdown text into safe HTML |

### `<MessageList>`

Just the message stream (with scroll, streaming cursor, swipe controls). **No** input bar.

```tsx
<MessageList />
```

Does not take `renderBubble` — to customize bubbles use `<Chat renderBubble={...} />`, or skip `<MessageList>` entirely and read `api.messages` directly (the visual-novel pattern).

### `<MessageInput>`

Just the input bar (with model picker, choice buttons, continue/restart menu, streaming state).

```tsx
<MessageInput />
```

Auto-hides when `api.readOnly` is `true`.

### `<ChatCanvas>`

**Legacy alias** — identical to `<Chat />`. Old worlds keep working; new code should prefer `<Chat />`.

---

## `useAssetFont()`

Load an uploaded font asset as an `@font-face` and get back a string ready to drop into a CSS `font-family` value.

```tsx
const fontFamily = useAssetFont("@asset:my-font-id", {
  family: "Cinzel",
  fallback: "serif",
})
return <div style={{ fontFamily }}>Ancient runes</div>
```

### Signature

```ts
useAssetFont(
  assetRef: string | null | undefined,
  options?: AssetFontOptions
): string
```

The font loads asynchronously. While loading, the hook returns `options.fallback` (defaulting to `"serif"`); when ready, a re-render fires with the full family string (scoped with a suffix to avoid name clashes).

### `AssetFontOptions`

| Field | Type | Description |
|-------|------|-------------|
| `family?` | `string` | Font family name. Inferred from filename or `assetRef` if omitted |
| `fallback?` | `string` | Fallback font shown during load. Default `"serif"` |
| `filename?` | `string \| null` | Original filename, used to guess format |
| `mimeType?` | `string \| null` | MIME type, used to guess format |
| `format?` | `"opentype" \| "truetype" \| "woff" \| "woff2" \| null` | Explicit format override |
| `weight?` | `string \| number` | `font-weight` |
| `style?` | `string` | `font-style` (e.g. `"italic"`) |
| `stretch?` | `string` | `font-stretch` |
| `display?` | `FontDisplay` | `font-display` (default `"swap"`) |

---

## Types

### `SandboxMessage`

Shape of each entry in `api.messages`:

```ts
interface SandboxMessage {
  id: string
  sessionId: string
  role: "user" | "assistant" | "system"
  content: string
  status?: "complete" | "streaming" | "failed"
  errorMessage?: string | null
  authorUserId?: string | null          // who sent it (multiplayer)
  authorNameSnapshot?: string | null    // their display name at send time
  stateChanges?: Record<string, unknown> | null   // diff of variable updates from this message
  stateSnapshot?: Record<string, unknown> | null  // full state at message generation
  swipes?: Array<{ content, stateSnapshot }>      // alternative AI replies
  activeSwipeIndex?: number
  model?: string | null
  tokenCount?: number | null
  generationTimeMs?: number | null
  compacted?: boolean                   // hidden in the "older messages" section
  attachments?: Array<{ type, mimeType, name, url }> | null
  createdAt: string                     // ISO-8601
}
```

### `Checkpoint`

```ts
interface Checkpoint {
  id: string
  name: string
  messageCount: number
  createdAt: string   // ISO-8601
}
```

### `BranchContext`

```ts
interface BranchNode {
  id: string
  name: string | null
  parentSessionId: string | null
  branchedFromMessageId: string | null
  messageCount: number
  updatedAt: string   // ISO-8601
  createdAt: string   // ISO-8601
}

interface BranchContext {
  current: BranchNode          // the session you're in
  parent: BranchNode | null    // the branch you forked from, or null at the root
  siblings: BranchNode[]       // other branches forked from the same parent, oldest first
  children: BranchNode[]       // branches forked off `current`, oldest first
}
```

---

## Blocked browser APIs

Your code runs inside a cross-origin `sandbox="allow-scripts"` iframe with **no** `allow-same-origin`. That means:

- No access to parent-app cookies / localStorage
- No credentialed network requests
- No direct `window.parent` manipulation

The following APIs are either **fully blocked** or **transparently redirected** through the SDK bridge.

### Redirects (legacy code keeps working)

| What you wrote | What actually happens |
|----------------|----------------------|
| `fetch('/api/...')` | Proxied through the parent's authenticated fetch |
| `fetch('/cdn/...')` | Allowed (CSP permits it) |
| `fetch('any other URL')` | **Rejected** (throws) |
| `localStorage.getItem/setItem/removeItem/clear` | Routed via `api.storage`, scoped by world |
| `sessionStorage.*` | Same |
| `navigator.clipboard.writeText()` | Equivalent to `api.copyToClipboard()` |
| `navigator.clipboard.readText() / read() / write()` | **Rejected** (throws) |
| `window.location.pathname / href / assign / replace` | Synthetic object; `pathname` is always `/app/chat/{sessionId}`; assigning / calling `assign` / `replace` triggers navigation |
| `window.location.reload()` | Bridged to reload the session |
| `window.__yuminaToggleImmersive()` | Equivalent to `api.toggleImmersive()` |

### Preferred usage

When writing new code, **use the SDK directly** — the redirects exist for old worlds, but the SDK is cleaner and more stable:

| Don't write | Write |
|------------|-------|
| `fetch('/api/sessions', { method: 'POST' })` | `api.createSession(worldId)` |
| `fetch('/api/sessions/' + sid, { method: 'DELETE' })` | `api.deleteSession(sid)` |
| `localStorage.getItem("k")` | `await api.storage.get("k")` |
| `window.location = "/app/hub"` | `api.navigate("/app/hub")` |
| `navigator.clipboard.writeText(t)` | `api.copyToClipboard(t)` |

---

## At-a-glance: the whole API

One table, scan once.

```
useYumina()
├── State reads
│   ├── variables, globalVariables, personalVariables, roomPersonalVariables
│   ├── worldName, worldId, sessionId, currentUser, room
│   ├── messages, permissions
│   ├── isStreaming, streamingContent, streamingReasoning
│   ├── pendingChoices, error, readOnly, greetingContent, canvasMode
│   ├── checkpoints
│   └── selectedModel, userPlan, preferredProvider
├── Game actions
│   ├── sendMessage(text)
│   ├── setVariable(id, value, options?)
│   ├── executeAction(actionId)
│   ├── switchGreeting(index)
│   └── clearPendingChoices()
├── Chat control
│   ├── editMessage(id, content) → Promise<boolean>
│   ├── deleteMessage(id) → Promise<boolean>
│   ├── regenerateMessage(id)
│   ├── continueLastMessage()
│   ├── stopGeneration()
│   ├── restartChat()
│   └── swipeMessage(id, direction) → Promise
├── Sessions / branching
│   ├── revertToMessage(id) → Promise<void>
│   ├── branchFromMessage(id) → Promise<string | null>
│   ├── getBranchContext() → Promise<BranchContext>
│   ├── createSession(worldId) → Promise<string>
│   ├── deleteSession(id) → Promise<void>
│   └── listSessions(worldId) → Promise<Array>
├── Checkpoints
│   ├── saveCheckpoint() → Promise<void>
│   ├── loadCheckpoints() → Promise<void>
│   ├── restoreCheckpoint(id) → Promise<void>
│   └── deleteCheckpoint(id) → Promise<void>
├── Audio
│   ├── playAudio(trackId, opts?)
│   ├── stopAudio(trackId?, fadeDuration?)
│   ├── setAudioVolume(type, volume)
│   └── getAudioVolume(type) → number
├── UI / navigation
│   ├── toggleImmersive()
│   ├── copyToClipboard(text)
│   ├── navigate(path)
│   └── showToast(message, type?)
├── Storage
│   ├── storage.get(key) → Promise<string | null>
│   ├── storage.set(key, value) → Promise<void>
│   └── storage.remove(key) → Promise<void>
├── AI
│   └── ai.complete({ messages, onDelta?, model?, maxTokens?, temperature? }) → Promise<string>
├── Context injection
│   └── injectContext(message, { role? })
├── Model picker
│   ├── setModel(modelId)
│   ├── getModels() → Promise<{ models, pinnedModels, recentlyUsed }>
│   ├── pinModel(id), unpinModel(id)
├── Assets
│   └── resolveAssetUrl(ref) → string
└── Markdown
    └── renderMarkdown(text) → string   // safe HTML

Sandbox globals (no import)
├── React
├── useYumina, useAssetFont
├── Icons  (1400+ Lucide icons)
├── Chat, MessageList, MessageInput, ChatCanvas (legacy alias)
└── Tailwind utility classes (CSS-level)

Blocked / redirected
├── fetch('/api/...') → proxied
├── localStorage / sessionStorage → api.storage
├── window.location → synthetic + navigate
└── navigator.clipboard → copyToClipboard
```

---

**Next**: head back to the [Custom UI Guide](./07-components.md) for worked examples, or browse the [Recipes](./14-recipe-scene-jumping.md) for templates closest to what you're building.
