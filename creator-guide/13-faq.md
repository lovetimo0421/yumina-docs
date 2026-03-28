<div v-pre>

# FAQ

> Answers to the most common questions you'll run into while creating.

---

## Getting started

### Q: I've never made a character card before. Can I use Yumina?

Absolutely. Yumina's editor is visual — no programming required. The simplest world only needs a character description and an opening line to run. We recommend playing a few worlds that others have built at [yumina.io](https://yumina.io) first, to get a feel for what a finished product looks like, then following the tutorials step by step. See [Welcome](./00-welcome.md) and [Core Concepts](./01-core-concepts.md).

### Q: What's the minimum I need to create a world?

Three steps: 1) click **Create** to make a new world; 2) in **Lorebook**, create a `character` entry with the character's profile and turn on **Always Send**; 3) in **First Message**, write an opening line. Click **Save** and you're ready to chat. Variables, behaviors, and renderers are all optional advanced features — you can add them later.

### Q: Which AI models does Yumina support?

Yumina connects to models through OpenRouter, which means basically anything available on OpenRouter — including Claude, GPT, Gemini, DeepSeek, Llama, and other major models. You'll need to configure your own API Key in settings. Different models vary in how well they follow directive format. We recommend tuning settings like temperature to match the model you choose. See [AI Model & Settings](./10-ai-settings.md).

### Q: Where is my world data stored? Can it get lost?

Your world data is saved in Yumina's server database and won't be lost under normal circumstances. That said, building a backup habit is always wise — you can export a world JSON file from the **Overview** section of the editor and save it locally as an offline backup. If something goes wrong, you can restore from the backup. See [Publishing, Exporting & Bundles](./11-publish-and-share.md).

---

## Entries & Lorebook

### Q: I have too many entries. How do I organize them?

Use folders. The editor supports creating folders to group entries by logic — by character, by scene, by function. Folders are purely an organizational tool and don't affect runtime behavior. Also make good use of the `tags` field for filtering and searching. See the "Folder organization" section in [Entries & Lorebook](./03-entries-and-lorebook.md).

### Q: Keyword triggering isn't working. How do I debug?

Check these common causes: 1) verify the entry's `enabled` is `true`; 2) check that `lorebookScanDepth` is large enough — the default only scans the last 2 messages, so keywords in earlier messages won't be found; 3) if you're using secondary keywords (`secondaryKeywords`), make sure the logic is set correctly; 4) if `matchWholeWords` is on, note that Chinese text generally doesn't need whole-word matching. See the "Keyword matching" section in [Entries & Lorebook](./03-entries-and-lorebook.md).

### Q: What's the difference between alwaysSend entries and keyword-triggered ones?

`alwaysSend: true` entries are included in every prompt no matter what the player says — good for core character profiles and foundational world rules that need to be in effect at all times. Keyword-triggered entries only activate when matching words appear in recent messages — good for specific scenes, locations, NPCs, and other on-demand content. The fundamental difference is "always-on" vs. "on-demand." Using both strategically can save a huge amount of token budget. See [Entries & Lorebook](./03-entries-and-lorebook.md).

### Q: How do I write effective example dialogue?

Use `<START>` to separate different dialogue segments, and `{{user}}:` and `{{char}}:` to mark speakers. Each example should demonstrate the character's unique speech style, tone, and reactions — not just information exchange. Two or three high-quality examples are worth far more than ten mediocre ones. Set the entry's role to `example` and section to `examples`. See the "Example dialogue format" section in [Entries & Lorebook](./03-entries-and-lorebook.md).

---

## Variables & Directives

### Q: The AI isn't writing directives in the right format. What do I do?

The engine already automatically tells the AI the directive format, so the problem usually isn't "the AI doesn't know the format" — it's "the AI isn't sure when to use it." A few fixes: 1) make the trigger conditions in `behaviorRules` more specific — "subtract when the player takes damage; deduct 10–30 per hit" is better than "subtract when hurt"; 2) add a reminder entry in the `post-history` section telling the AI not to forget to output directives; 3) lower `temperature` (e.g., 0.5–0.7) to make the AI follow rules more reliably; 4) different models vary significantly in directive compliance — switching models is also worth trying. See [AI Directives & Macros](./05-directives-and-macros.md) and [AI Model & Settings](./10-ai-settings.md).

### Q: A variable suddenly has a weird value. How do I debug?

First look at what directives the AI wrote in its raw reply — sometimes the AI writes operations you didn't anticipate. Then check if any rules are quietly modifying this variable in the background (via `modify-variable` actions). For number variables, confirm you've set reasonable `min` and `max` values — the engine auto-clamps out-of-range values. If you still can't find it, check every rule and entry in the editor that references this variable.

### Q: How do I use JSON-type variables?

JSON variables can store complex data structures — objects, arrays, nested structures. The most common uses are inventory (JSON array) and character relationship networks (JSON object). Operations include `merge` (merge object), `push` (append to array), `delete` (remove a key or element), and dot-notation for deep nested paths like `[relationships.aria.trust: +10]`. See the "Nested JSON paths" section in [Variables](./04-variables.md).

### Q: How many variables can I have? Is there a limit?

No hard limit at the engine level. But every variable's current value is included in the prompt sent to the AI, so too many variables eat up token budget and shorten the conversation history the AI can "see." In practice, most worlds work fine with 5–20 variables. If you need to store a lot of data, consider packing related data into one JSON variable — more efficient than a pile of individual variables.

---

## Rules engine

### Q: A behavior isn't triggering. How do I debug?

Check these in order: 1) is the behavior enabled — was it disabled by another behavior? 2) is the WHEN trigger type correct — e.g., if you chose "variable crosses threshold" but the variable never crossed that threshold; 3) do all the ONLY IF conditions pass (check whether `conditionLogic` is `"all"` or `"any"`); 4) is it in cooldown (`cooldownTurns`); 5) has it reached max fire count (`maxFireCount`). See the "Evaluation flow" section in [Rules Engine](./06-rules-engine.md).

### Q: When multiple behaviors trigger at once, what order do they execute in?

Sorted by `priority` from highest to lowest. Behaviors with higher numbers are evaluated and executed first. For example, a "death check" behavior at priority 100 runs before a "low health warning" at priority 50. If two behaviors have the same priority, they execute in their definition order. Give important behaviors higher priority values. See the "Priority" section in [Rules Engine](./06-rules-engine.md).

### Q: Can behaviors control each other?

Yes — this is one of the most powerful features of the rules engine. The "enable/disable behavior" action can turn other behaviors on or off. Typical pattern: Behavior A listens for a "enter dungeon" keyword and, when triggered, enables Behavior B (a monster encounter rule that starts disabled). When the player leaves the dungeon, Behavior A disables B again. You can build "dormant until activated" behavior chains. See the "Rule cross-control" section in [Rules Engine](./06-rules-engine.md).

### Q: How do cooldownTurns and maxFireCount work together?

`cooldownTurns` controls the interval — after a behavior fires, it waits this many turns before it can fire again. Good for "shouldn't trigger too often" scenarios, like reminding about hunger no more than once every 5 turns. `maxFireCount` controls the total — a behavior can fire at most this many times ever, then never again. Good for one-time events like tutorial hints. Both can be used simultaneously: a "hidden plot hint" behavior set to `cooldownTurns: 10` + `maxFireCount: 3` means it hints at most 3 times, with at least 10 turns between hints.

---

## Components & Rendering

### Q: I can't code TSX. Can I still use a custom renderer?

You can try. A few starting points: 1) use **Enter Studio** in the editor, and have the AI Assistant generate code for you; 2) describe your desired effect to an external AI (like Claude) and have it generate the TSX code, then paste it into the editor; 3) copy-paste from the template examples in the docs and adjust colors and text. The editor compiles in real time and shows errors at the bottom (**Compile Status**), so you can adjust as you go. See [Custom Frontend Guide](./07-components.md) and [Custom Message Renderer](./08-message-renderer.md).

### Q: Where do components display? Can I customize their position?

Built-in components (stat-bar, text-display, etc.) display in a header bar above the chat window. Currently `placement` only supports `"header"`. If you need a more flexible layout — like a sidebar or full-screen panel — use `customComponents` to write custom TSX, or enable `fullScreenComponent: true` to let custom components take over the full screen. Component order is controlled by the `order` field — lower numbers appear first. See [Components Guide](./07-components.md).

### Q: What's the difference between messageRenderer and customComponents?

`messageRenderer` replaces how each chat message is displayed — it takes over AI reply rendering, letting you turn plain text into speech bubbles, visual novel dialogue boxes, battle logs, etc. `customComponents` adds independent UI panels alongside the chat interface — like character creation screens, game sidebars, and maps. Simply put: messageRenderer changes "what messages look like"; customComponents adds "what else is alongside messages." Both can be used simultaneously, and both share the same underlying `CustomComponent` data structure. See [Custom Message Renderer](./08-message-renderer.md).

---

## Publishing & sharing

### Q: Can I still make changes after publishing?

Yes. After publishing, you can go back to the editor and modify world content at any time — saving takes effect immediately and new players see the latest version. To temporarily take it down, change status to `unpublished` and active players will see a read-only notice. Note: if you modify variable definitions (like deleting a variable), the engine automatically handles backward compatibility for existing players' saves — new variables get filled with default values, deleted ones are filtered out. Nothing breaks for existing players. See [Publishing, Exporting & Bundles](./11-publish-and-share.md).

### Q: How do I get more players to discover my world?

Key points: 1) upload an attractive thumbnail — worlds without covers almost never get clicked in Hub; 2) write a compelling description explaining what the world is and what makes it fun; 3) add 3–5 relevant tags — think about what players would search for; 4) write a great opening message (greeting) — first impressions determine whether players keep playing; 5) play through it yourself before publishing to make sure the experience is smooth. See the "Pre-publish checklist" in [Publishing, Exporting & Bundles](./11-publish-and-share.md).

### Q: What's the difference between a Bundle and a full world export?

A full world export is the complete `WorldDefinition` JSON — every entry, variable, rule, component, and setting, nothing left out. Good for backups or sharing an entire world with someone. A Bundle is a "component pack" — you cherry-pick a subset of content (like a combat rules system + related variables + components) and package it. Others can install this package into their own worlds. Simply: a full export is "the whole car"; a Bundle is "the engine assembly." See the "Bundle system" section in [Publishing, Exporting & Bundles](./11-publish-and-share.md).

</div>
