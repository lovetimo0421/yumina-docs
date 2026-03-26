# Yumina Creator Guide

Welcome to Yumina. This guide will walk you through everything you need to know to create interactive stories and characters — from your first character to advanced game mechanics.

No programming or AI knowledge required.

---

## Table of Contents

1. [How Yumina Works (The Big Picture)](#how-yumina-works)
2. [The Editor](#the-editor)
3. [First Message](#first-message)
4. [Lorebook (Entries)](#lorebook-entries)
   - [Sections Explained](#sections-explained)
   - [Creating a Character](#creating-a-character)
   - [Adding Lore and World Info](#adding-lore-and-world-info)
   - [Keywords and Triggers](#keywords-and-triggers)
   - [Folders and Organization](#folders-and-organization)
   - [Tags](#tags)
   - [Send As (API Role)](#send-as-api-role)
   - [Official Presets](#official-presets)
5. [Variables](#variables)
   - [What Are Variables?](#what-are-variables)
   - [Variable Types](#variable-types)
   - [How the AI Updates Variables](#how-the-ai-updates-variables)
   - [Behavior Rules (Teaching the AI)](#behavior-rules)
   - [Variable Categories](#variable-categories)
   - [JSON Variables (Advanced)](#json-variables)
6. [Rules](#rules)
   - [What Are Rules?](#what-are-rules)
   - [WHEN (Triggers)](#when-triggers)
   - [IF (Conditions)](#if-conditions)
   - [THEN (Actions)](#then-actions)
   - [Rule Examples](#rule-examples)
7. [How It All Fits Together](#how-it-all-fits-together)
8. [Tips and Best Practices](#tips-and-best-practices)

---

## How Yumina Works

When a player sends a message, here's what happens behind the scenes:

```
Player types a message
        ↓
Yumina assembles a "prompt" — a big block of text that tells
the AI everything it needs to know: who the characters are,
what's happened so far, what the current state of the world is
        ↓
The AI reads all of that and writes a response
        ↓
Yumina scans the response for any variable changes
(like [health: -10]) and updates the game state
        ↓
Rules are checked — if any conditions are met,
their actions fire automatically
        ↓
The player sees the story response
```

As a creator, your job is to fill in the content that gets assembled into that prompt. You're not programming the AI — you're giving it context, personality, and instructions that shape how it responds.

Think of it like directing a movie: the AI is your actor, and you're providing the script, setting, costume notes, and stage directions.

---

## The Editor

The editor has 7 sections, accessible from the sidebar:

| Section | What it does |
|---------|-------------|
| **First Message** | The opening message players see when they start a session |
| **Lorebook** | All content injected into the AI's context — characters, lore, instructions |
| **Variables** | Trackable game state — health, gold, relationships, flags |
| **Rules** | Automatic behaviors — "when X happens, do Y" |
| **Components** | Custom message rendering (advanced) |
| **Audio** | Background music and sound effects |
| **Overview** | World name, description, cover image, and publishing settings |

For most creators, **First Message**, **Lorebook**, and **Variables** are the three sections you'll use the most.

<!-- SCREENSHOT: Editor sidebar showing all 7 sections -->

---

## First Message

The first message is what the player sees when they start a new chat. It's sent as the AI's opening response before the player has said anything.

This sets the scene. It should:
- Establish the setting (where are we?)
- Introduce the main character (who is talking?)
- Give the player something to respond to (what's happening?)

**Example:**
```
The rain hammers against the windows of the old bookshop. Behind the counter,
a woman with silver-streaked hair looks up from her reading, adjusting her
glasses as the door chime announces your arrival.

"Ah — a customer. On a night like this, no less." She closes her book and
sets it aside. "Looking for anything in particular, or just escaping the storm?"
```

You can use `{{user}}` in your first message and it will be replaced with the player's name.

<!-- SCREENSHOT: First Message editor with example text -->

---

## Lorebook (Entries)

The Lorebook is where all your world's content lives. Every piece of text that gets sent to the AI — character descriptions, world lore, system instructions, scenarios — is a **lorebook entry**.

<!-- SCREENSHOT: Lorebook panel showing sections with entries -->

### Sections Explained

Entries are organized into four sections. Each section controls **where** and **how** the entry appears in the AI's context:

#### System Presets
Instructions that are **always sent** to the AI, placed near the top of context. This is where you put:
- Character descriptions and personalities
- Scenario and setting descriptions
- Writing style instructions
- System-level behavior rules

These entries are always active — the AI sees them every single turn.

#### World Info
Lore entries that are **only sent when relevant**. These activate based on keywords — when a keyword appears in the conversation, the matching entry gets included.

Use this for:
- Location descriptions (activated when someone mentions the location)
- Side character bios (activated when they're mentioned by name)
- Item descriptions, historical events, factions, etc.

This keeps your prompt lean — the AI only gets information that's relevant to what's currently being discussed.

#### Chat History
Entries injected **inside the message history** at a specific depth. "Depth" means how many messages from the most recent message to count back before injecting.

For example, an entry at depth 4 gets placed 4 messages from the end of the conversation. This is useful for reminders that should feel like they're part of the recent conversation flow.

#### Post History
Instructions placed **at the very end** of the prompt, after all chat messages. This is the last thing the AI reads before generating a response, so it has the strongest influence.

Use this for:
- Final writing instructions ("stay in character", "end mid-scene")
- Output format reminders
- Behavioral overrides

<!-- SCREENSHOT: Section headers in the lorebook showing all four sections -->

---

### Creating a Character

To create a character, add an entry in the **System Presets** section. Here's a simple example:

**Entry name:** `Elena`

**Content:**
```
Elena is a 28-year-old herbalist who runs a small apothecary in the village
of Thornfield. She has warm brown eyes, freckled skin, and keeps her auburn
hair in a messy braid. She wears a stained leather apron over simple linen
clothes.

Personality: Curious, warm but guarded, has a dry sense of humor. She lost
her mother to the plague three years ago and hasn't fully recovered. She's
skeptical of magic but secretly fascinated by it.

Speech: She speaks in a casual, slightly teasing tone. She drops formality
quickly. She uses plant metaphors without realizing it.
```

That's it. The AI will now know who Elena is, what she looks like, how she talks, and what motivates her.

**Tips for good character entries:**
- Include both physical description AND personality
- Give them a specific speech pattern or verbal tics
- Include at least one internal conflict or secret — this gives the AI something to work with
- Mention how they relate to the player or setting

<!-- SCREENSHOT: An entry being edited with character description content -->

---

### Adding Lore and World Info

For information that should only appear when relevant, use the **World Info** section with keywords.

**Example — A location entry:**

**Entry name:** `The Withered Oak Tavern`
**Section:** World Info
**Keywords:** `tavern, withered oak, inn, bar, pub`

**Content:**
```
The Withered Oak is Thornfield's only tavern. It's a two-story timber building
with a carved oak sign so old the lettering has worn smooth. Inside: low beams,
a stone hearth that's always burning, and the smell of pipe smoke and stew.

The owner is Barret, a heavyset man with a booming laugh and a missing left
ear (he claims a different story every time someone asks). He knows everyone's
business and trades gossip as freely as ale.
```

Now whenever the player mentions "the tavern" or "Withered Oak," this entry automatically gets included in the AI's context. When they're talking about something else, it stays hidden and doesn't use up space.

---

### Keywords and Triggers

Keywords determine when a **World Info** entry activates. The system scans recent messages for these keywords, and if any match, the entry gets sent to the AI.

**How keyword matching works:**

- Keywords are comma-separated: `tavern, withered oak, inn`
- Matching is case-insensitive: "Tavern" matches "tavern"
- Any single keyword matching is enough to activate the entry

**Advanced options:**

| Option | What it does |
|--------|-------------|
| **Whole Word** | "inn" won't match "inn**er**" or "beg**inn**ing" |
| **Fuzzy Match** | Allows approximate matches (handles typos) |
| **Secondary Keywords** | Additional keyword conditions (AND/NOT logic) |

**Secondary keyword logic:**

- **AND ANY** — Primary keyword must match AND at least one secondary keyword
- **AND ALL** — Primary keyword must match AND all secondary keywords
- **NOT ANY** — Primary keyword must match AND none of the secondary keywords
- **NOT ALL** — Primary keyword must match AND not all secondary keywords match

**Example:** You want a lore entry about "dark magic" but only when "Elena" is also mentioned:
- Primary keywords: `dark magic, forbidden spell, necromancy`
- Secondary keywords: `Elena`
- Logic: AND ANY

---

### Folders and Organization

You can create folders within any section to organize your entries. Folders are purely for your convenience — they don't affect how entries are sent to the AI.

- Click the **+** button on a section header and choose **New Folder**
- Drag entries into folders to organize them
- Drag folders between sections to move them (all entries inside will move too)
- Double-click a folder name to rename it

**Common folder structures:**
```
System Presets/
  ├── Characters/
  │   ├── Elena
  │   ├── Barret
  │   └── The Merchant
  ├── Setting/
  │   ├── World Overview
  │   └── Magic System
  └── Style Instructions

World Info/
  ├── Locations/
  │   ├── Thornfield Village
  │   ├── The Withered Oak
  │   └── The Dark Forest
  └── Items/
      ├── Moonpetal Herb
      └── Ancient Amulet
```

---

### Tags

Tags let you categorize entries across sections. They're for your organization only — they're never sent to the AI.

Default tags include: **Character**, **Lore**, **Scenario**, **Style**, **System**, **Preset**. You can also create custom tags.

Use the tag filter bar at the top of the Lorebook to quickly find entries by category.

---

### Send As (API Role)

Each entry has a "Send As" setting that controls how the AI interprets it:

| Role | What the AI sees |
|------|-----------------|
| **System** (default) | An instruction from the system — the AI treats this as authoritative context |
| **User** | As if the player said it — the AI responds to it conversationally |
| **Assistant** | As if the AI itself said it — the AI treats it as its own prior output |

For most entries, **System** is what you want. The other roles are advanced tools for specific effects — for example, sending an entry as **Assistant** can prime the AI to continue in a certain style.

---

### Official Presets

Every new world comes with 5 official preset entries that configure the AI's core behavior:

| Preset | Section | What it does |
|--------|---------|-------------|
| **Fiction Mode** | System Presets | Tells the AI it's running a fiction simulation |
| **Task** | System Presets | Defines the AI's role as narrator and world simulator |
| **Style** | System Presets | Sets the creative writing style |
| **Instructions** | Post History | Final writing instructions (show don't tell, end mid-scene) |
| **CoT Bypass** | Post History | Prevents the AI from overthinking before responding |

You can edit these freely to match your world's tone. If you delete one accidentally, use the **Add Official Presets** button to restore missing ones.

---

## Variables

### What Are Variables?

Variables are pieces of game state that the AI can read and modify. They're numbers, text, or flags that track things like health, gold, relationship scores, or whether a door is locked.

**Without variables**, the AI just writes a story. **With variables**, the AI writes a story AND updates game state — "the merchant charges you 50 gold" actually deducts 50 from your gold count.

<!-- SCREENSHOT: Variables section showing a few defined variables -->

### Variable Types

| Type | What it stores | Example |
|------|---------------|---------|
| **Number** | A numeric value (can have min/max) | Health: 100, Gold: 500 |
| **String** | Text | Location: "Thornfield", Mood: "anxious" |
| **Boolean** | True or false | hasKey: false, isWanted: true |
| **JSON** | Objects or arrays (advanced) | Inventory: {"sword": 1, "potion": 3} |

For most cases, you'll use **Number** and **Boolean**. String and JSON are for more complex tracking.

### How the AI Updates Variables

When you define variables, Yumina tells the AI about them at the end of the prompt. The AI sees something like:

```
Current game state:
- health: 85 (Character's physical condition)
- gold: 200 (Currency)
- torch_lit: false (Whether the player has a light source)

When you want to change game variables, use this format:
[variableId: operation value]
Examples: [health: -10], [gold: +50], [location: set "forest"], [hasKey: toggle]
```

The AI then includes these brackets naturally in its response:

```
The goblin's club connects with your shoulder, sending you stumbling
backward into the cave wall. Pain shoots down your arm.

[health: -15]

"Is that all you've got?" you growl, raising your sword.
```

The player never sees `[health: -15]` — Yumina strips it out and applies the change behind the scenes. The player just sees the story text and their health bar updating.

**Available operations:**

| Operation | Syntax | What it does |
|-----------|--------|-------------|
| **Add** | `[gold: +50]` or `[gold: add 50]` | Adds to a number |
| **Subtract** | `[health: -10]` or `[health: subtract 10]` | Subtracts from a number |
| **Set** | `[location: set "forest"]` | Replaces the value entirely |
| **Toggle** | `[hasKey: toggle]` | Flips a boolean (true↔false) |
| **Multiply** | `[damage: multiply 2]` | Multiplies a number |
| **Append** | `[notes: append " — and a scar"]` | Adds text to a string |

The AI can only modify variables you've defined. If it tries to change a variable that doesn't exist, it's silently ignored — nothing breaks.

### Behavior Rules

Behavior rules are **instructions to the AI** about how a variable should work. This is where you teach the AI what a variable means and when to change it.

**Example for a `health` variable:**
```
0 = death. 1-20 = critical (describe bleeding, difficulty breathing).
20-50 = wounded (pain affects actions). 50-80 = bruised (minor discomfort).
80-100 = healthy. Decrease on physical damage. Increase slowly when resting
or receiving healing. Never change by more than 30 in a single turn.
```

**Example for a `trust` variable:**
```
Range is 0-100. Starts at 30 (stranger). Increases slowly through honest
actions, keeping promises, and showing vulnerability. Decreases sharply
from lies, betrayal, or breaking boundaries. At 80+ the character opens
up about their past. Below 15 they refuse to speak to the player.
```

Behavior rules are powerful because they let you define the *feel* of your game's systems in natural language. The AI reads these and adjusts its behavior accordingly.

<!-- SCREENSHOT: A variable being edited with behavior rules filled in -->

### Variable Categories

Categories group variables visually in the editor and in the prompt the AI sees:

| Category | Use for |
|----------|---------|
| **Stat** | Core character stats (health, strength, charisma) |
| **Resource** | Consumable quantities (gold, mana, ammo) |
| **Inventory** | Items and possessions |
| **Relationship** | Social bonds and faction standing |
| **Flag** | Binary states (quest complete, door unlocked) |
| **Custom** | Anything else |

When variables have categories, the AI sees them grouped:

```
Stats:
- health: 85 (Physical condition)
- strength: 12 (Raw physical power)

Resources:
- gold: 200 (Currency)
- mana: 45 (Magic energy)

Flags:
- has_key: true
- met_elena: true
```

### JSON Variables

JSON variables let you store structured data — objects and arrays. This is for advanced use cases where a simple number or string isn't enough.

**Example — An inventory as a JSON object:**
```json
{
  "sword": 1,
  "health_potion": 3,
  "torch": 2,
  "mysterious_letter": 1
}
```

**Example — A quest log as a JSON array:**
```json
["Find the missing herbalist", "Deliver the sealed letter"]
```

The AI can modify JSON variables using special operations:

| Operation | Syntax | What it does |
|-----------|--------|-------------|
| **Merge** | `[inventory: merge {"rope": 1}]` | Adds/updates keys in an object |
| **Push** | `[quests: push "Defeat the troll"]` | Adds an item to an array |
| **Delete** | `[inventory: delete "torch"]` | Removes a key from an object |
| **Set** | `[inventory: set {"sword": 1}]` | Replaces the entire value |

Because JSON operations are more complex, **you need to teach the AI how to use them** via behavior rules. The default format instructions only show simple examples. For JSON variables, write explicit behavior rules like:

```
This is the player's inventory stored as a JSON object. Keys are item names,
values are quantities. When the player picks up an item, use merge to add it:
[inventory: merge {"item_name": 1}]. When they use or drop an item, use
delete: [inventory: delete "item_name"]. To increase quantity of an existing
item, merge with the new total: [inventory: merge {"health_potion": 4}].
```

**Nested access with dot-paths:**

The AI can also reach into nested objects using dots:
```
[factions.ember_court.affinity: +10]
[party.members.0.name: set "Aldric"]
```

This lets you build deep data structures without the AI needing to rewrite the entire object.

---

## Rules

### What Are Rules?

Rules are automatic behaviors that fire when certain conditions are met — **without the AI being involved**. The engine evaluates them server-side after every AI response.

Think of rules as "if this, then that" automations:
- *When health drops below 10, notify the player "You're about to die!"*
- *When the player says "attack," add a combat instruction to the AI's context*
- *Every 5 turns, increase the danger level*

Rules handle things that would be unreliable to leave to the AI, like consistent game mechanics, timed events, and UI notifications.

<!-- SCREENSHOT: Rules section showing a rule being edited -->

### WHEN (Triggers)

The trigger determines **what event** causes the rule to be evaluated:

| Trigger | When it fires |
|---------|--------------|
| **State Change** | A variable was modified this turn |
| **Variable Crossed** | A specific variable crossed above/below a threshold |
| **Turn Count** | At a specific turn number, or every N turns |
| **Session Start** | When a new chat session begins |
| **Keyword** | The player's message contains specific words |
| **AI Keyword** | The AI's response contains specific words |
| **Every Turn** | After every single AI response |
| **Manual** | Only fires when triggered by another rule |

### IF (Conditions)

Conditions are optional checks that must pass **in addition to** the trigger. They compare variable values:

| Operator | Meaning |
|----------|---------|
| `=` | Equals |
| `!=` | Not equals |
| `>` | Greater than |
| `>=` | Greater than or equal |
| `<` | Less than |
| `<=` | Less than or equal |
| `contains` | String contains text |

You can combine multiple conditions with **ALL** (every condition must pass) or **ANY** (at least one must pass).

### THEN (Actions)

When a rule fires, its actions execute in order:

| Action | What it does |
|--------|-------------|
| **Modify Variable** | Change a variable value (add, subtract, set, etc.) |
| **Inject Directive** | Add an instruction into the AI's prompt (temporary or persistent) |
| **Remove Directive** | Remove a previously injected directive |
| **Send Context** | Send a system message to the AI in the next turn |
| **Toggle Entry** | Enable or disable a lorebook entry |
| **Toggle Rule** | Enable or disable another rule |
| **Notify Player** | Show a notification to the player (info, warning, achievement, danger) |
| **Play Audio** | Play, stop, or crossfade an audio track |

### Rule Examples

**Death check — notify when health is critical:**
```
WHEN:  Variable Crossed — health drops below 10
IF:    (none)
THEN:  Notify Player — "You are critically wounded!" (style: danger)
       Inject Directive — "The player character is on the verge of death.
       Describe their labored breathing, blurred vision, and struggle to
       stay conscious." (position: after_char)
```

**Timed escalation — increase tension every 5 turns:**
```
WHEN:  Turn Count — every 5 turns
IF:    danger_level < 10
THEN:  Modify Variable — danger_level: add 1
       Send Context — "The situation is growing more dangerous. Escalate
       the tension in the environment."
```

**Keyword-triggered combat:**
```
WHEN:  Keyword — "attack, fight, strike, swing"
IF:    in_combat = false
THEN:  Modify Variable — in_combat: set true
       Inject Directive — "Combat has begun. Describe actions with
       tactical detail. Track positioning and weapon usage." (persistent)
       Play Audio — battle_theme (play)
```

**Rule options:**
- **Cooldown** — Minimum turns between firings (prevents spam)
- **Max Fire Count** — Total times the rule can ever fire (for one-time events)
- **Priority** — Higher priority rules execute first

---

## How It All Fits Together

Here's what the AI actually receives on each turn, in order:

```
┌─────────────────────────────────────────────┐
│ 1. SYSTEM PRESETS (always sent)             │
│    Fiction Mode, Task, Style...             │
│    Your character descriptions              │
│    Your scenario/setting                    │
│    Any injected directives from rules       │
├─────────────────────────────────────────────┤
│ 2. SESSION SUMMARY                          │
│    (compressed older messages, if any)      │
├─────────────────────────────────────────────┤
│ 3. EXAMPLE DIALOGUE                         │
│    (if you've defined example conversations)│
├─────────────────────────────────────────────┤
│ 4. CHAT HISTORY                             │
│    All recent messages between player & AI  │
│    + World Info entries triggered by         │
│      keywords in the conversation           │
│    + Chat History entries at their depth     │
├─────────────────────────────────────────────┤
│ 5. VARIABLE SUMMARY                         │
│    Current values of all variables          │
│    Behavior rules for the AI                │
│    Format instructions for brackets         │
├─────────────────────────────────────────────┤
│ 6. POST HISTORY (strongest influence)       │
│    Final instructions, overrides            │
│    "Stay in character", "end mid-scene"     │
└─────────────────────────────────────────────┘
                    ↓
            AI generates response
                    ↓
     Yumina extracts [variable: changes]
                    ↓
        Rules engine checks conditions
                    ↓
         Player sees clean story text
```

The AI reads top-to-bottom. Items near the bottom (Post History) get the most attention. That's why final instructions go there.

---

## Tips and Best Practices

**Characters:**
- One entry per character. Don't split a character across multiple entries.
- Include contradictions — "she's brave but terrified of commitment" gives the AI more to work with than "she's brave."
- Describe how they speak, not just what they're like. "Uses short sentences. Never says please." is more useful than "she's blunt."

**World Info:**
- Use World Info for anything that isn't needed every turn. If a location only matters when visited, make it keyword-triggered instead of always-send.
- Be generous with keywords — add common misspellings, abbreviations, and related terms.
- Keep entries focused. One entry per location/character/concept, not one giant entry for everything.

**Variables:**
- Start simple. 3-5 variables is plenty for most worlds. You can always add more later.
- Write detailed behavior rules. The more specific you are about when and how much a variable should change, the more consistent the AI will be.
- Use min/max on number variables to prevent impossible values (health shouldn't go to -500).

**Rules:**
- Use rules for things the AI would forget or be inconsistent about — death triggers, timed events, status effects.
- Don't over-automate. If the AI handles something well naturally, you don't need a rule for it.
- Test rules by playing through the scenario yourself. Rules that fire too often or not at all need their conditions adjusted.

**General:**
- Playtest early, playtest often. The best way to find issues is to play your own world.
- When something goes wrong, check the chat's game state panel — it shows you exactly what variables are set to and what changed each turn.
- Less is more. A few well-written entries will produce better results than dozens of mediocre ones. The AI only has so much attention to spread across your content.
