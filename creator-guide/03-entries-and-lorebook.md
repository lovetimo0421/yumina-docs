<div v-pre>

# Entries & Lorebook

> Entries are the "memory fragments" you feed to the AI — break your character profiles, world lore, plot threads, and writing style into individual pieces, and the engine will automatically pick and assemble them into the final prompt that gets sent to the AI.

---

## The short version

### What exactly is an entry?

Think of entries like pages in an encyclopedia. The AI's memory is limited (context window), so you can't just dump your entire world-building bible into the prompt. The entry system's approach: break information into chunks, feed them on demand.

Say your world has a "Shadow Forest." The player might go a hundred messages without ever mentioning it. So that description doesn't need to eat up precious tokens every single turn. Make it an entry with keywords — only when the player mentions "forest," "shadow," or "the woods" does the engine inject that description into the prompt.

### How to use it in the editor

In the editor, entries have two key settings:

- **Send as**: how the AI should interpret this content
  - **Instruction** — the AI treats it as a system rule to follow (most common)
  - **User** — the AI thinks a player said this
  - **AI** — the AI thinks it said this itself
- **Tags**: organizational categories — Characters, Plot, Style, Example, Preset, etc.

Which group an entry is in determines its behavior:
- **PRESETS** — always sent
- **EXAMPLES** — example dialogue
- **CHAT HISTORY** — keyword-triggered
- **POST** — fallback instructions after all chat

::: tip The engine's internal Role field
Internally, every entry also has a `role` field (`character`, `lore`, `plot`, `style`, `example`, `greeting`, `system`, `custom`, etc.) used for internal classification. In the editor, this field is automatically mapped from Tags — for example, adding a `Characters` tag corresponds to `role: character`. You don't need to manage role manually; just know it exists.
:::

### Keyword triggering

Add keywords to an entry, and the engine scans the player's recent messages. If a keyword appears, the entry activates and its content is injected into the prompt.

For example, an entry with keywords `["forest", "the woods", "shadow"]` — when the player says "I walk into the woods," this entry triggers.

### alwaysSend: always in effect

If you want an entry to be sent to the AI regardless of what the player says — like a character's core profile or the world's fundamental rules — set `alwaysSend` to `true`. These entries bypass keyword requirements and are included in every prompt.

### The simplest character entry

```json
{
  "name": "Alicia",
  "content": "Alicia is a young elven mage with silver hair and emerald eyes. She speaks gently but with occasional sarcasm, and loves using plant metaphors.",
  "role": "character",
  "section": "system-presets",
  "alwaysSend": true,
  "keywords": [],
  "enabled": true
}
```

That's all it takes. This entry is sent with every conversation because `alwaysSend` is `true`.

---

## The detailed version

### Entry fields — what you see in the editor

When you click **+ Add Entry** in the editor, you'll see the following fields. Here's what each one does and where to find it.

#### Basic fields

| Editor field | Where to find it | What it does |
|---|---|---|
| **Name** | Top of the entry panel | The entry's title, shown in the sidebar list. Also used to parse character names in example dialogue |
| **Content** | Main text area | The text the AI reads when this entry is active. Supports macros like `{{char}}` and `{{user}}` |
| **Tags** | Below the name | Organizational categories (Characters, Plot, Style, Example, Preset, etc.). Tags automatically map to the internal `role` field — e.g. a `Characters` tag sets `role: character` |
| **Enabled** toggle | Top-right corner | When OFF, this entry is completely excluded from matching and injection |

#### Send control

| Editor field | Where to find it | What it does |
|---|---|---|
| **Group** | Dropdown in the entry panel | Which section of the prompt this entry goes into: PRESETS, EXAMPLES, CHAT HISTORY, or POST. See "The Four Sections" below |
| **Position** | Number input next to Group | Sort priority within a group. Lower numbers go first. Supports decimals — use `2.5` to slot between `2` and `3` |
| **Always Send** toggle | Entry panel | When ON, this entry is included in every prompt regardless of keywords |
| **Depth** | Number input (only visible when Group is CHAT HISTORY) | How many messages from the end of chat history to insert at. E.g. depth `4` inserts before the 4th-to-last message |
| **Send as** | Dropdown in the entry panel | How the AI interprets this content: **Instruction** (system rule), **User** (AI thinks a player said it), or **AI** (AI thinks it said this itself — useful for "pre-filling" the start of a reply) |

#### Keyword matching

| Editor field | Where to find it | What it does |
|---|---|---|
| **Keywords** | Keyword input area | Primary keyword list. Any single match triggers the entry (OR logic) |
| **Match Whole Words** | Checkbox near keywords | When checked, `"for"` won't match `"forest"` |
| **Fuzzy Match** | Checkbox near keywords | Allows typo-tolerant matching. Keywords up to 5 chars allow 1 typo; longer ones allow 2. Latin alphabet only — does not work for CJK characters |
| **Secondary Keywords** | Below primary keywords | Extra keywords for further filtering after the primary keywords match |
| **Secondary Logic** | Dropdown next to secondary keywords | How secondary keywords combine: AND_ANY, AND_ALL, NOT_ANY, NOT_ALL (see "Secondary keyword logic" below) |

#### Conditions and recursion

| Editor field | Where to find it | What it does |
|---|---|---|
| **Conditions** | Conditions section of the entry | Variable-based trigger conditions. Each condition has a variable, an operator (equals, greater than, etc.), and a target value |
| **Condition Logic** | Dropdown in conditions section | How multiple conditions combine: **All** (every condition must pass) or **Any** (one passing is enough) |
| **Prevent Recursion** | Checkbox in advanced settings | This entry can be triggered, but its content won't be used to scan for and trigger other entries |
| **Exclude Recursion** | Checkbox in advanced settings | This entry is completely excluded from recursive scans — only direct matching against player messages can trigger it |

#### Organization

| Editor field | Where to find it | What it does |
|---|---|---|
| **Tags** | Below the entry name | Custom tags for organizing and filtering entries in the sidebar |
| **Folder** | Sidebar drag-and-drop or folder picker | Which folder this entry belongs to — purely organizational, no effect on runtime |

---

### The Four Sections

Where an entry lands in the prompt is determined by the `section` field. Think of the full prompt sent to the AI as a sandwich:

```
[system-presets]   <-- Top: core settings, AI sees these first
[examples]         <-- Example dialogue: teaches the AI how to talk
[chat-history]     <-- Middle: player and AI conversation history
  (depth points)   <-- depth entries slip in here
[post-history]     <-- Bottom: fallback instructions, AI sees these last
```

#### system-presets — System Presets

This is the "opening" of the prompt. Content here is always seen by the AI, and seen first. Best for:

- Core character descriptions (`character`)
- World-building overview (`lore`)
- Writing style requirements (`style`)
- Scene setup (`scenario`)

Entries in this section are typically set to `alwaysSend: true` because they're the foundation of the world's operation.

#### examples — Example Dialogue

A dedicated section for example dialogue. Entries with `role: example` are parsed specially — the engine converts them into user/assistant message pairs so the AI "sees" a few rounds of sample conversation.

Format for example dialogue:

```
<START>
{{user}}: Hello, Alicia.
{{char}}: *tilts her head slightly, silver hair sliding over her shoulder* Oh? A visitor. You look even more lost than the last cactus that withered here.
<START>
{{user}}: What is this place?
{{char}}: *a soft smile* You call it "what place," I call it home. The Jade Forest, land of the elves — at least until the humans cut down the last tree.
```

Key points:
- Use `<START>` to separate different conversation examples
- `{{user}}` represents the player, `{{char}}` represents the character
- You can also use a character name directly (e.g. `Alicia:`) instead of `{{char}}`
- The engine automatically inserts a `[Example Chat]` marker before each segment

#### chat-history — Depth Injection

Entries in this section don't go at the beginning or end of the prompt — they're "inserted" into a specific position within the chat history. The `depth` field controls where.

This is especially useful for content that needs to "remind" the AI of current state — like a character's current mood or the environment's atmosphere. Placed in the middle of chat history, the AI tends to "notice" it more readily (due to how attention distributes across context positions).

#### post-history — Post-history / Fallback Instructions

The "last word" placed after all chat messages but before the AI starts generating. Since the AI pays the most attention to what it just read, this is ideal for:

- "Remember, you are XX — stay in character"
- "Reply in English"
- "Keep replies under 500 words"
- Any instruction you want the AI to see "one more time" before responding

---

### Depth injection (depth)

`depth` is a field exclusive to the `chat-history` section. It means "insert N messages before the end of the chat history."

For example, if chat history is:

```
[1] User: Hello
[2] AI:   Hi there
[3] User: Where's the forest?
[4] AI:   Head north
[5] User: Alright, let's go
```

An entry with `depth: 2` gets inserted before the 2nd-to-last message (before `[4]`):

```
[1] User: Hello
[2] AI:   Hi there
[3] User: Where's the forest?
--- [Entry content inserted here] ---
[4] AI:   Head north
[5] User: Alright, let's go
```

`depth: 0` means at the very end (similar to post-history). The higher the number, the further back the insertion point.

---

### Fuzzy matching (useFuzzyMatch)

When enabled, the engine uses Levenshtein edit distance for typo-tolerant matching:

- Keywords ≤5 characters: allows 1 character difference (`"magic"` matches `"magik"`)
- Keywords >5 characters: allows 2 character differences (`"forest"` matches `"forset"`)

Limitation: fuzzy matching does not work for CJK characters. CJK only uses exact or substring matching.

Keywords also support regular expressions. If your keyword is in `/pattern/flags` format (e.g. `/dark\s*forest/i`), the engine treats it as a regex.

---

### Secondary keyword logic (secondaryKeywords)

Primary keywords are the "threshold" — any single match counts. But sometimes you need finer control, and that's where secondary keywords come in.

**Workflow:** first check primary keywords (at least one match required), then use secondary keywords for additional filtering.

Four logic modes:

| Logic | Meaning | Example |
|-------|---------|---------|
| `AND_ANY` | Primary matches AND at least one secondary matches | Primary `["forest"]`, secondary `["elf", "treant"]`: "the elf in the forest" → triggers; "the beautiful forest" → doesn't |
| `AND_ALL` | Primary matches AND all secondary keywords match | Primary `["forest"]`, secondary `["night", "danger"]`: only "the forest is dangerous at night" triggers |
| `NOT_ANY` | Primary matches AND none of the secondary keywords match | Primary `["forest"]`, secondary `["safe", "beautiful"]`: triggers as long as neither "safe" nor "beautiful" is mentioned — an exclusion logic |
| `NOT_ALL` | Primary matches AND secondary keywords don't all match | Primary `["forest"]`, secondary `["A", "B"]`: triggers as long as A and B don't both appear |

---

### Recursive triggering (recursion)

Recursion is a powerful feature that needs to be used carefully. It means: when entry A is triggered, A's content itself is scanned again as "new text" to see if it can trigger entry B.

**Example:** Entry A has keyword "forest," and its content mentions "elves." Entry B has keyword "elves." If recursion is enabled (world setting `lorebookRecursionDepth > 0`), a player mentioning "forest" will chain-trigger both A and B.

Recursion depth is controlled by the world setting `lorebookRecursionDepth`, ranging 0–10, default 0 (off).

Two safety valves:
- `preventRecursion: true` — this entry is triggered, but its content is never used to scan for other entries. "I can be woken up, but I won't wake anyone else."
- `excludeRecursion: true` — this entry is completely excluded from recursive rounds. Only direct matching from the player's own message can trigger it. "Only words the player actually says can wake me."

---

### Conditional triggering (conditions)

Besides keywords, entries can also activate based on the current state of game variables.

Each condition has three components:
- `variableId` — which variable to check
- `operator` — comparison: `eq` (equal), `neq` (not equal), `gt` (greater), `gte` (greater or equal), `lt` (less), `lte` (less or equal), `contains` (string contains)
- `value` — the target value to compare against

`conditionLogic` controls how multiple conditions relate:
- `"all"` — all conditions must pass (AND)
- `"any"` — any one condition passing counts (OR)

Conditions and keywords are a "double threshold" — both must pass to trigger. If an entry has both keywords and conditions, the flow is: first check if keywords match, then check if conditions are met — both must pass for the entry to inject.

---

### Folder organization

When your world has dozens or hundreds of entries, lists get unwieldy. Folders (`entryFolders`) let you organize entries by logical grouping.

Each folder has its own `section` (corresponding to one of the four sections) and `order`, and can be collapsed (`collapsed`). Entries link to folders via `folderId`.

This is purely an editor organization tool — it has no effect on runtime behavior.

---

### apiRole override

By default, all entries are sent as `system`. But some scenarios call for different roles:

- `apiRole: "user"` — sends as user. Some models weigh "things a user says" more heavily than "system instructions."
- `apiRole: "assistant"` — sends as AI assistant. This is "pre-filling" — telling the AI "you said this earlier," which can be used to guide reply style.

Usage: set `apiRole` on entries in the system-presets or post-history sections.

---

### Position ordering

`position` is a float that controls the order of entries within a section. Lower numbers appear first.

Supports decimals, so you can use `2.5` to insert an entry between position `2` and `3` without renumbering everything.

When two entries have the same position, the one with a higher keyword match score takes priority.

---

### Example dialogue format

Entries with `role: example` must follow a specific format for the engine to correctly parse them into user/assistant message pairs:

```
<START>
{{user}}: Can you heal this wound?
{{char}}: *examines the wound, frowning* This isn't a normal knife wound. There's a curse residue. I need moonflower pollen — but it's daytime.
{{user}}: So what do we do?
{{char}}: *shrugs* Either wait for nightfall, or you endure it. I recommend the latter — pain is the best teacher.
```

- `<START>` separates different dialogue examples
- The engine parses each segment into actual user/assistant messages, not a single block of text

---

### Keyword scan range

The engine doesn't scan all history — that would be too slow and wasteful. The world setting `lorebookScanDepth` (default 2) controls how many recent messages to scan for keyword matching. Set it to 4 to scan the last 4 messages. In the editor, expand **Entry Settings** in the **Lorebook** section to modify.

There's also token budget control: `lorebookBudgetPercent` (default 100%) and `lorebookBudgetCap` (default 0 = unlimited) limit how many tokens triggered entries can use in total. When over budget, entries with higher match scores take priority.

---

::: details Technical reference: JSON fields

The following maps editor fields to their underlying JSON field names in `worldEntrySchema` (source: `packages/engine/src/world/schema.ts`). Useful when exporting/importing world files or working with the API directly.

**Basic fields**

| JSON field | Type | Required | Editor equivalent |
|---|---|---|---|
| `id` | string | Yes | Auto-generated unique identifier |
| `name` | string (min 1) | Yes | **Name** |
| `content` | string | Yes | **Content** |
| `role` | enum (`system`, `character`, `personality`, `scenario`, `lore`, `plot`, `style`, `example`, `greeting`, `custom`) | Yes | Auto-mapped from **Tags** |
| `enabled` | boolean | No (default `true`) | **Enabled** toggle |

**Send control**

| JSON field | Type | Default | Editor equivalent |
|---|---|---|---|
| `section` | enum (`system-presets`, `examples`, `chat-history`, `post-history`) | -- (required) | **Group** dropdown |
| `position` | number | 0 | **Position** |
| `alwaysSend` | boolean | false | **Always Send** toggle |
| `depth` | number (int) | -- | **Depth** (CHAT HISTORY group only) |
| `apiRole` | enum (`system`, `user`, `assistant`) | -- | **Send as** dropdown |

**Keyword matching**

| JSON field | Type | Default | Editor equivalent |
|---|---|---|---|
| `keywords` | string[] | [] | **Keywords** |
| `matchWholeWords` | boolean | false | **Match Whole Words** |
| `useFuzzyMatch` | boolean | false | **Fuzzy Match** |
| `secondaryKeywords` | string[] | [] | **Secondary Keywords** |
| `secondaryKeywordLogic` | enum (`AND_ANY`, `AND_ALL`, `NOT_ANY`, `NOT_ALL`) | `AND_ANY` | **Secondary Logic** |

**Conditions and recursion**

| JSON field | Type | Default | Editor equivalent |
|---|---|---|---|
| `conditions` | Condition[] (each has `variableId`, `operator`, `value`) | [] | **Conditions** |
| `conditionLogic` | `"all"` \| `"any"` | `"all"` | **Condition Logic** |
| `preventRecursion` | boolean | false | **Prevent Recursion** |
| `excludeRecursion` | boolean | false | **Exclude Recursion** |

**Organization**

| JSON field | Type | Editor equivalent |
|---|---|---|
| `tags` | string[] | **Tags** |
| `folderId` | string | **Folder** |
| `presetId` | string | Associated preset ID (internal use) |

:::

---

## Practical examples

### Example 1: A complete character (three entries working together)

**Character description entry:**

```json
{
  "id": "alice-desc",
  "name": "Alicia",
  "content": "{{char}} is a forest elven mage, approximately 300 years old (young for an elf). Silver waist-length hair, emerald eyes, small acorn-shaped earring on her left ear. 165cm, slender but not fragile. Always wears a moss-green robe with illegible elvish text embroidered along the hem.",
  "role": "character",
  "section": "system-presets",
  "position": 0,
  "alwaysSend": true,
  "keywords": [],
  "conditions": [],
  "conditionLogic": "all",
  "enabled": true
}
```

**Personality entry:**

```json
{
  "id": "alice-personality",
  "name": "Alicia's Personality",
  "content": "{{char}}'s personality traits:\n- Speaks gently but hides sarcasm beneath; loves using plants and nature as metaphors when being cutting\n- Secretly fascinated by humans but won't admit it\n- Fiercely loyal — once she calls you a friend, she'll protect you no matter what\n- Terrified of insects, especially centipedes — her biggest secret\n- Enjoys slipping elvish words into conversation (shown in italics)",
  "role": "personality",
  "section": "system-presets",
  "position": 1,
  "alwaysSend": true,
  "keywords": [],
  "conditions": [],
  "conditionLogic": "all",
  "enabled": true
}
```

**Opening message entry:**

```json
{
  "id": "alice-greeting",
  "name": "Alicia's Greeting",
  "content": "*A flicker of silver light dances among the trees. As you approach, an elf steps out from behind an ancient oak, her emerald eyes studying you from head to toe.*\n\nAnother lost human. *She lets out a soft sigh, silver hair drifting in the breeze.* Which road did you wander in from? No — don't tell me, let me guess.\n\n*She leans close and sniffs* …The northern swamp path. You smell like rotting grass. *Ithiliel*, humans really have no respect for their noses.\n\nWell, since you're here, don't just stand there. I'm Alicia. Follow me — wandering this forest alone is far more dangerous than talking to me.",
  "role": "greeting",
  "section": "system-presets",
  "position": 0,
  "alwaysSend": false,
  "keywords": [],
  "conditions": [],
  "conditionLogic": "all",
  "enabled": true
}
```

Clear division of labor: character description and personality are always sent (`alwaysSend: true`); the greeting is used only once at session start.

---

### Example 2: A keyword-triggered scene entry

This entry only injects when the player mentions forest-related terms:

```json
{
  "id": "dark-forest-lore",
  "name": "Secrets of the Shadow Forest",
  "content": "[Shadow Forest]\nDeep in the forest lies a place where moonlight never reaches — the elves call it the Silent Land. Legend says an ancient dragon is sealed there, its breath turning all nearby plants jet black. Anyone who lingers in the Silent Land for more than an hour begins hearing the dragon's whispers — most who have heard them went mad. Alicia knows this secret but never brings it up.",
  "role": "lore",
  "section": "chat-history",
  "depth": 4,
  "position": 10,
  "alwaysSend": false,
  "keywords": ["forest", "the woods", "shadow", "Silent Land", "ancient dragon"],
  "matchWholeWords": false,
  "useFuzzyMatch": false,
  "secondaryKeywords": [],
  "conditions": [],
  "conditionLogic": "all",
  "enabled": true
}
```

Design choices worth noting:
- `section` is `chat-history`, `depth` is `4` — the content inserts at the 4th-to-last message in chat history, not at the very top of the system prompt. This makes the AI feel like the forest info "surfaced naturally during conversation" rather than something it knew from the start.
- Multiple keywords use OR logic — the player mentioning any one of them triggers it.
- `alwaysSend` is `false` — no mention of forest, no token usage.

---

### Example 3: A conditional entry (variable-driven)

This entry only activates when the character's HP is below 20, to make the AI describe a near-death state:

```json
{
  "id": "near-death-state",
  "name": "Near-Death State Description Directive",
  "content": "[Current State: Near Death]\n{{char}} is gravely wounded and near death. All descriptions must reflect:\n- Slow, labored movements — every step is a struggle\n- Broken speech, occasional coughing of blood\n- Blurred vision, may misidentify people\n- But iron willpower — refusing to fall\nAbsolutely do not write {{char}} fighting or moving normally.",
  "role": "custom",
  "section": "post-history",
  "position": 5,
  "alwaysSend": true,
  "keywords": [],
  "conditions": [
    {
      "variableId": "hp",
      "operator": "lt",
      "value": 20
    }
  ],
  "conditionLogic": "all",
  "enabled": true
}
```

The clever design here:
- `section` is `post-history` — placed after all chat messages, as the "final word" before the AI starts generating. Content here leaves the deepest impression.
- `alwaysSend` is `true` but with `conditions` — meaning "check this condition every turn, send if it passes." No keyword needed; it's driven purely by variable state.
- Condition: `hp < 20`. When the HP variable drops below 20, this description directive automatically injects. When HP recovers above 20, it disappears automatically.

This is more reliable than keyword triggering — you're not hoping the player will say "injured." The system reads the actual game state and decides for itself.

</div>
