<div v-pre>

# Glossary

A quick-reference guide to Yumina creator terminology, sorted alphabetically.

---

**Action** — the DO part of a behavior; what the engine actually executes when conditions are met. Includes modifying variables, injecting directives, notifying the player, playing audio, starting timers, and more.

**Audio Directive** — a special directive the AI embeds in replies using `[audio: trackId action]` syntax to control audio playback. Supports play, stop, crossfade, volume, and chain operations.

**Behavior** — a WHEN/ONLY IF/DO automation rule: when to check, what conditions to require, and what to do. The core mechanism that makes a world feel alive. Configured in the Behaviors section of the editor.

**Bundle** — a package of selected world content (entries, variables, rules, components, etc.) exported as a shareable JSON file. Others can install it into their own worlds with one click.

**Conditional BGM** — a mechanism for automatically switching background music based on variable state, keywords, or turn count. E.g., auto-switching to battle music when entering a combat zone.

**Cooldown** — the number of turns a behavior must wait after firing before it can fire again. Prevents the same behavior from triggering too frequently.

**Custom Component** — a TSX-coded independent UI panel that adds alongside the chat interface (rather than replacing message rendering). Good for character creation screens, game sidebars, and similar.

**Depth Injection** — a technique for inserting entry content at a specific position within chat history. The `depth` value indicates how many messages from the end to insert at, making the AI more naturally "aware" of context information.

**Directive** — the AI's way of changing game state, using `[variableName: operation value]` syntax in replies. Automatically parsed and executed by the engine; players only see clean narrative text.

**Entry** — a content fragment in a world. Character profiles, scene descriptions, writing style instructions, example dialogue, world lore — all are entries. Each has a `role` tag telling the engine what kind of content it is.

**Full-Screen Component** — a setting that makes custom components take over the entire screen when enabled, hiding the chat window completely. Good for character creation screens, maps, or fully custom experiences.

**Fuzzy Match** — typo-tolerant matching based on Levenshtein edit distance. Allows a small number of spelling errors in keywords to still trigger a match. Only effective for Latin alphabet characters — not supported for CJK.

**Image Panel** — a component type for displaying character sprites or scene backgrounds. Can bind to a variable so the AI can dynamically switch images via directives, or use a fixed URL.

**Inventory Grid** — a component type that displays an item list in grid form after binding to a JSON array variable. Updates automatically when items are added or removed.

**Language Variant** — a different language translation of the same world. Multiple language versions can be linked together in Overview so players see a language tab when starting the game.

**Lorebook** — a collection of keyword-triggered entries. When matching keywords appear in chat, the corresponding entries automatically inject into the AI context — feeding information on demand to conserve token budget.

**Macro** — a `{{name}}` placeholder in entry text, automatically replaced with real content (like a variable value or system info) before being sent to the AI. E.g. `{{char}}`, `{{user}}`, `{{turnCount}}`.

**Message Renderer** — a custom component written in TSX that replaces the default Markdown chat bubbles to give AI messages a personalized look: speech bubbles, visual novel dialogue boxes, battle logs, and more.

**Playlist** — a BGM playlist configuration that chains multiple background music tracks and controls whether to loop, shuffle, or play sequentially, plus autoplay behavior and gap between tracks.

**Post-History** — one of the four prompt sections, placed after all chat messages and before the AI starts generating. Good for "last emphasis" instructions since the AI pays closest attention to what it just read.

**Priority** — a numeric weight on behaviors or conditional BGM. Higher numbers get evaluated and executed first when multiple rules trigger simultaneously.

**Recursive Triggering** — after entry A is triggered, its content is scanned again as "new text" to check if it can trigger entry B — a chain activation. Depth controlled by `lorebookRecursionDepth` (0–10).

**Renderer** — the mechanism of using TSX code to fully take over how messages or interfaces are displayed. The key step from "chatbot" to "interactive experience."

**Rule** — synonymous with Behavior (the formal term used in the underlying schema). See Behavior.

**Secondary Keywords** — a keyword list for additional filtering after a primary keyword matches. Supports four combination logics: AND_ANY, AND_ALL, NOT_ANY, NOT_ALL.

**Session** — an instance of a game conversation. Each session independently maintains its own chat history and game state.

**SFX** — a short one-shot sound effect like a door opening, explosion, or item pickup chime. Can be triggered by AI audio directives or rules.

**Stat Bar** — a component type that displays a number variable as a progress bar. Great for HP, MP, experience — any value that benefits from a visual ratio representation.

**Structured Output** — an AI setting that when enabled, forces the AI to reply in JSON format via `response_format: { type: "json_object" }`. For mechanic-heavy worlds that need strict output parsing.

**System Preset** — one of the four prompt sections, located at the very top. The AI sees this first. Best for core character descriptions, world lore, and writing style — content that needs to be in effect at all times.

**Temperature** — the core parameter controlling AI reply randomness. Range 0–2: lower values make output more stable and predictable; higher values make it more creative but potentially off-topic.

**Text Display** — a component type for displaying formatted text information (like current location or weather). Supports template strings and icons.

**Trigger** — the WHEN part of a behavior; determines when the engine checks whether to act. Examples: "on every variable change," "every N turns," "when a keyword appears," "when a timer fires."

**Turn** — one complete exchange: the player sends a message and the AI generates a reply.

**Variable** — a named container storing game state data. Supports number, string, boolean, and JSON types. The core object that directives and rules read from and write to.

**Web Panel** — a component type that runs custom HTML/CSS/JS in an iframe sandbox. The most flexible wildcard component — can implement mini-maps, skill trees, or any custom UI.

**World** — a complete, self-contained interactive experience in Yumina. The top-level container that packages characters, story, rules, components, audio, and everything else together.

</div>
