# Core Concepts at a Glance

Creating interactive experiences in Yumina comes down to understanding seven core concepts. No more, no less — just right.

---

## World

A complete, self-contained interactive experience.

If Yumina is a game platform, then a world is one "game" on that platform. It's not just a single character or a plot excerpt — it's everything bundled together: characters, story, rules, UI, music, all in one package. When a player opens a world, they step into a fully immersive experience.

Technically speaking, a world contains entries, variables, rules, components, a renderer, audio tracks, settings… everything you need is in this one bundle. Think of it as a self-sufficient little universe.

---

## Entry

A fragment of your world's content.

Character profiles, scene descriptions, writing style instructions, example dialogue, world-building lore — all of these are entries. Every entry has a "role" tag (`character`, `lore`, `plot`, `style`, `example`, etc.) that tells the engine what kind of content it is.

Entries work in two modes:

- **Always-on**: Entries marked "always send" are included in the prompt every time the AI generates a reply. Use these for core character profiles and foundational world-building that needs to be in effect at all times.
- **Triggered**: Entries with keywords are only activated when matching keywords appear in recent chat messages. If you write a piece of lore about a "black market," that content is only sent to the AI when the conversation mentions "black market."

Think of entries like pages in a script. The AI doesn't read the whole script at once — it flips to the relevant page based on what's happening right now. This way the AI has enough context without wasting precious token budget.

---

## Variable

The world's memory.

HP, gold, affection, current location, inventory items… any data that needs to persist between turns goes into a variable.

Variables support four types:
- **Number** (`number`): health, gold, turn count
- **String** (`string`): current location name, character status description
- **Boolean** (`boolean`): whether a door is open, whether a quest is complete
- **JSON object** (`json`): inventory item list, complex relationship networks

Each variable can also have a category tag (`stat`, `inventory`, `resource`, `flag`, `relationship`, `custom`) to help organize them in the editor. Number variables can have min and max values — the engine automatically clamps values within range.

Variables are like a game's save data. Without them, every AI response is "amnesiac" — it doesn't know what the player did last turn or how much health the character has left. Variables give the world continuity.

---

## Directive

The AI's way of changing world state.

As long as your world has variables, the engine automatically teaches the AI to use directives to change state — you don't need to write any format instructions yourself. The AI will include updates like `[health: -10]` at the end of its replies, and the engine automatically applies them.

All you need to do is write plain-language behavior rules in each variable explaining "when should this variable change," and the AI figures out when to emit the right directives.

Common directives look like this:

| Syntax | Meaning |
|--------|---------|
| `[health: -10]` | Subtract 10 from health |
| `[health: +20]` | Add 20 to health |
| `[gold: 500]` | Set gold to 500 |
| `[location: Tavern]` | Set current location to "Tavern" |
| `[quest_complete: true]` | Mark quest as complete |

Creators don't write any code. Variables + behavior rules + the engine's auto-injected format instructions — these three working together is all you need.

---

## Rule

Automated behavior in your world.

"When HP drops to 0, trigger the death ending." "Every 3 turns, increase hunger by 1." "When the player enters the forest, play forest background music." These are all rules.

Every rule has three parts, like a micro cause-and-effect chain:

- **WHEN (trigger)**: What sets it off. Could be "when a variable changes," "every N turns," "when a specific keyword appears," "when a session starts," etc. This is the rule's "alarm clock."
- **IF (condition)**: An optional prerequisite. Like "HP ≤ 0" or "gold > 100." Multiple conditions can be combined with AND or OR logic. If no condition is set, the rule fires immediately when triggered.
- **THEN (action)**: The actual work. Can modify variables, inject a temporary prompt for the AI, toggle entries or rules on/off, send a player notification, play a sound effect… A single rule can chain multiple actions.

Rules are the core mechanism that makes a world feel alive. Without rules, all state changes depend on the AI being "mindful" about them. With rules, you have a reliable safety net — even if the AI occasionally forgets to deduct health, the rule will catch it.

---

## Component

The UI panels the player sees.

Components are visual widgets bound to variables, displayed alongside or above the chat interface. Yumina has five built-in component types:

| Type | Use case | Variable type |
|------|----------|---------------|
| **Stat Bar** (`stat-bar`) | Progress bar for HP, MP, stamina | Number |
| **Text Display** (`text-display`) | Formatted text for current location, status | Number / String / Boolean |
| **Image Panel** (`image-panel`) | Show images — scene backgrounds, character sprites | String (URL) |
| **Inventory Grid** (`inventory-grid`) | Item grid for equipment / items | String (JSON) |
| **Web Panel** (`web-panel`) | Custom HTML/CSS/JS content | No binding needed |

Once a component is bound to a variable, it updates automatically when the variable changes. The player gets hit, HP goes down, and the health bar shrinks instantly — you don't write any refresh logic.

Think of components as the gauges on a dashboard. The engine quietly updates the data in the background; components turn that data into something the player can see and understand.

---

## Renderer

How chat messages look.

By default, AI replies are displayed as plain Markdown text — similar to what you'd see in ChatGPT. That works, but it's not very immersive.

The renderer (`messageRenderer`) lets you use TSX code to completely take over how messages are presented. You can turn the AI's text into:

- Speech bubbles with character avatars
- Visual novel-style sprites and dialogue boxes
- Pixel-art battle logs
- Full-screen interactive scenes
- …anything you can imagine

The renderer receives the AI's raw reply text and the current game state, and outputs a custom React interface. This means you can dynamically adjust the display based on variable values — like turning text red when a character is near death, or showing different backgrounds in different scenes.

The renderer is the key step in elevating your world from "chatbot" to "interactive experience."

---

## The Runtime Flow

When a player sends a message, the engine runs through these phases in sequence:

```
Entries --> Build prompt --> AI generates reply --> Parse directives --> Update variables --> Trigger rules --> Render to player
```

Breaking it down:

1. **Entries → Build prompt**: The engine scans all entries, assembles always-on entries and keyword-triggered entries by priority and section (system-presets, examples, chat-history, post-history) into a complete prompt, then sends it to the AI.

2. **Build prompt → AI generates reply**: The prompt and chat history are sent to the language model. The AI generates a reply. The reply is streamed back token by token (SSE), so the player can watch the AI "type" in real time.

3. **AI generates reply → Parse directives**: The engine uses regex to scan the AI's reply for all `[variableName: operation value]` format directives and extracts them.

4. **Parse directives → Update variables**: The engine applies the directives one by one to update variable values in the game state. Numbers are clamped to their min/max range, types are validated.

5. **Update variables → Trigger rules**: After variables change, the engine scans all rules to see which ones' WHEN conditions are met and IF conditions pass, then executes the corresponding THEN actions. Actions may modify further variables, which can trigger more rules — but the engine limits recursion depth to prevent infinite loops.

6. **Trigger rules → Render to player**: The final reply text and updated game state are handed to the frontend. If the world has a custom renderer, it uses that to display the message; otherwise it renders as plain Markdown. The component panel refreshes to reflect the latest variable values.

This entire flow runs every time a player sends a message. From the player's perspective, they just see the AI write back something great, the health bar ticks down a bit, and the background music shifts — the whole pipeline is completely transparent.

---

## Summary

No need to memorize all of this at once.

These seven concepts build on each other in layers: the world is the container, entries and variables are the content, directives are the bridge between AI and engine, rules are the automation, and components and the renderer are the presentation layer. Having this big picture in your head is enough for now.

The following chapters go deep on each concept — the details, best practices, and common pitfalls. Whenever something's unclear, flip back here for the overview.
