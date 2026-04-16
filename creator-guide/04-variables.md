# Variables

> Variables are your world's "memory" — they record everything that needs to be tracked, letting the AI and engine know what's happening now and what's happened before.

---

## The short version

Imagine jotting down the state of a tabletop game on paper: who has how much health, what's in the inventory, whether a certain door has been opened. Variables are that piece of paper — except the engine maintains it and the AI does the writing.

### Four types

| Type | Use case | Example |
|------|----------|---------|
| `number` | Numbers you can add and subtract | Health, gold, affection |
| `string` | Text | Current location, character title |
| `boolean` | On/off, only true or false | Whether a key has been found, whether a door is locked |
| `json` | Complex data structures (objects, arrays) | Inventory item list, faction relationship network |

### How to create one

Open the Variables section in the world editor, click "Add Variable," and fill in three things:

1. **Name** — give the variable a name, like `health`
2. **Type** — choose one: number / string / boolean / json
3. **Default Value** — what it starts at when the game begins

That's it. The AI writes `[health: -10]` in a reply, and the engine automatically subtracts 10 from health.

### The simplest HP example

```
Name:          health
Type:          number
Default value: 100
Min:           0
Max:           100
Category:      stat
Description:   Character's current health
```

When the AI writes `[health: -20]`, the engine changes 100 to 80. Then `[health: -90]` — the engine calculates -10, but since you set min to 0, it clamps automatically to 0. No negative health.

---

## The detailed version

### Variable fields — what you see in the editor

When you click **Add Variable** in the editor, you'll see the following fields. Here's what each one does.

| Editor field | Where to find it | What it does |
|---|---|---|
| **ID** | Below the name field (auto-generated, or set manually) | The identifier used in directives like `[health: -10]`. Auto-generated from the name (lowercase, underscores), or you can set it manually |
| **Display Name** | Top of the variable panel | What you see in the editor sidebar and status panel. The AI can also reference the variable by this name — the engine auto-maps name to ID |
| **Type** dropdown | Below the name | Number, String, Boolean, or JSON. Determines what the variable can store and which operations are valid |
| **Default Value** | Main input area | What this variable starts at when a player begins a new session |
| **Min / Max** | Number inputs (only visible for Number type) | The engine automatically clamps values within this range. Set min `0` and max `100` for health, and you'll never get negative HP or values above 100 |
| **Category** dropdown | Below default value | Helps organize variables in the editor and in the prompt: Stat, Inventory, Resource, Flag, Relationship, or Custom |
| **Behavior Rules** | Text area at the bottom | Plain-language instructions telling the AI when and how to update this variable. Included in the system prompt so the AI knows the rules |
| **Description** | Not currently in the editor UI | Notes for yourself. Can be set via JSON export/import |

::: details Technical reference: JSON fields

Maps editor fields to their underlying JSON field names in the variable schema. Useful when exporting/importing world files.

| JSON field | Type | Required | Editor equivalent |
|---|---|---|---|
| `id` | string | Yes | **ID** |
| `name` | string (min 1) | Yes | **Display Name** |
| `type` | `"number"` / `"string"` / `"boolean"` / `"json"` | Yes | **Type** dropdown |
| `defaultValue` | number / string / boolean / object / array | Yes | **Default Value** |
| `description` | string | No | **Description** (JSON-only) |
| `min` | number | No | **Min** (Number type only) |
| `max` | number | No | **Max** (Number type only) |
| `category` | enum (see below) | No | **Category** dropdown |
| `behaviorRules` | string | No | **Behavior Rules** |
| `updateHints` | string | No | **Deprecated** — use `behaviorRules` instead. Retained for import compatibility only |

:::

### Category (category)

The category doesn't affect how the variable actually behaves, but it helps you organize variables and helps the AI better understand each variable's role:

| Category | Meaning | Typical use |
|----------|---------|-------------|
| `stat` | Attribute | HP, MP, strength, agility |
| `inventory` | Inventory | Item lists, equipment |
| `resource` | Resource | Gold, lumber, food |
| `flag` | Flag | Whether something has happened, whether a door is unlocked |
| `relationship` | Relationship | Character affection, faction reputation |
| `custom` | Custom | Anything that doesn't fit the above |

### All operations (EffectOperation) in detail

The AI uses bracket syntax in replies to modify variables. The engine parses these directives and executes the corresponding operation. There are 9 in total.

> **Reference by name OR ID.** Directives can target a variable by its `id` (e.g. `player_hp`) or its display `name` (e.g. `Player HP`) — the engine maintains a name→id map and resolves both. Names are matched case-sensitively.

#### set — direct assignment

Sets the variable to a new value, regardless of what it was before.

```
[location: set "forest"]        -- set location to "forest"
[health: set 50]                -- set health directly to 50
[health: 50]                    -- omitting the operator for a positive number defaults to "set"
```

> **Heads up:** `[health: -10]` is **not** "set to -10." The leading `-` is the shorthand for `subtract`, so this directive subtracts 10 from the current health. To assign a negative value, write `[health: set -10]` explicitly.

#### add — addition

Adds a number to a `number` variable.

```
[gold: add 50]                  -- gold +50
[gold: +50]                     -- shorthand, same effect
```

#### subtract — subtraction

Subtracts a number from a `number` variable.

```
[health: subtract 10]           -- health -10
[health: -10]                   -- shorthand, same effect
```

#### multiply — multiplication

Multiplies a `number` variable by a number. Great for critical hit doubling and similar scenarios.

```
[damage: multiply 2]            -- damage doubled
[damage: *2]                    -- shorthand, same effect
```

#### toggle — flip a boolean

Flips a `boolean` variable from true to false or false to true. No value needed.

```
[hasKey: toggle]                -- picked up the key (false -> true)
```

#### append — string concatenation

Appends text to the end of a `string` variable. Good for simple event logs.

```
[log: append " - defeated goblin"]  -- add a record to the log
```

#### merge — JSON deep merge

Shallow-merges an object into a `json` variable. Existing keys are overwritten, new keys are added.

```
[stats: merge {"level": 2}]    -- update the level field to 2
```

Note: merge only works on object-type `json` variables, not arrays.

#### push — array append

Adds an element to the end of a `json` array variable. The value **must be valid JSON** — an object `{...}` or an array `[...]`. Bare scalars (strings, numbers) are not accepted by the directive parser.

```
[inventory: push {"id": "sword", "name": "Rusty Sword", "qty": 1}]   -- push an object
[waypoints: push [12, 34]]                                            -- push an array
```

> **Tip:** If your inventory needs to hold raw strings like `"torch"`, either wrap each entry as an object (`{"id": "torch"}`) — which is the recommended pattern — or use a rule action's `modify-variable` operation where the value type is free.

#### delete — remove a key or element

Deletes a key from an object or an element at an array index. **Not usable via the `[var: ...]` directive syntax**: the parser's JSON pattern only matches object/array JSON values, so the bare string/number that `delete` needs cannot reach the handler.

Two working paths:

1. **JSON Patch block** — preferred for AI output. Emit `<UpdateVariable target="inventory"><JSONPatch>[{"op":"remove","path":"/0"}]</JSONPatch></UpdateVariable>` to remove the first inventory item, or `{"op":"remove","path":"/visited"}` to drop an object key.
2. **Rule action** — inside a rule's `modify-variable` action, set `operation: "delete"` and `value: "visited"` (string for object keys) or `value: 0` (number for array indices).

See the [Directives & Macros](./05-directives-and-macros.md) guide for the full `<UpdateVariable>` syntax.

### min/max auto-clamping

This is the guardrail for `number` variables. Suppose you set `min: 0, max: 100`:

- If an operation would push the value above 100, the engine automatically clamps it to 100
- If an operation would push the value below 0, the engine automatically clamps it to 0

You don't need to repeatedly tell the AI "don't let health go negative" in your prompts — the engine handles it at a structural level.

### Nested JSON paths (dot-path)

This is one of the most powerful features of the variable system. For `json` type variables, the AI can use dot-notation paths to directly operate on nested structures, without needing to merge an entire object.

Say you have a `json` variable called `gameState` with this structure:

```json
{
  "factions": {
    "emberCourt": { "affinity": 30 },
    "frostHold": { "affinity": 50 }
  },
  "player": {
    "level": 5
  }
}
```

The AI can write:

```
[gameState.factions.emberCourt.affinity: +5]
```

The engine navigates automatically to `gameState` → `factions` → `emberCourt` → `affinity` and adds 5. Goes from 30 to 35. Everything else remains untouched.

If an intermediate path doesn't exist, the engine automatically creates empty objects to fill it in — no errors.

Supported operations on nested paths: `set`, `add`, `subtract`, `merge`, and `push`.

> **⚠️ Dot-paths only work on `json` variables.** If the root variable's type is `number`, `string`, or `boolean`, a dot-path directive like `[player.hp: +5]` is silently ignored by the engine. Always declare compound state as a `json` variable. `multiply` and `toggle` are also not wired up on nested paths in the current implementation — they silently degrade to `set`. For `delete` on a nested key, use JSON Patch (see the `delete` section above).

### behaviorRules — guidance for the AI

This field is pure text written for the AI to read. It doesn't affect engine behavior, but it's included in the system prompt sent to the AI, helping it understand how it should interpret and update this variable.

For example, behavior rules for an HP variable might say:

```
Normal attacks deal 5–15 damage; critical hits double it.
Healing potions restore 30 HP.
When HP drops to 0, the character dies and the death storyline must trigger.
Don't modify HP frequently — only in combat and injury scenarios.
```

It's like telling the AI: "Hey, here's how you should use this variable." It's more precise than writing a long block of rules in the system prompt, because behaviorRules travel with the variable.

### Variable lifecycle

A variable goes through these stages from creation to use:

1. **Definition** — you create it in the editor, setting the type, default value, and constraints
2. **Initialization** — when a player starts a new session, all variables are set to their default values, forming the initial GameState
3. **AI modification** — the AI writes bracket directives in replies; the engine parses and executes operations (add, subtract, multiply, etc.)
4. **Rule modification** — the rules engine checks conditions and automatically executes additional variable changes when triggered (e.g., "trigger death when HP hits zero")
5. **Persistence** — at the end of each turn, the entire GameState (including all current variable values) is saved to the database to continue next time

If the world definition adds a new variable that doesn't exist in a player's save, the engine automatically fills it in with the default value on load. If the world deletes a variable, the corresponding value is filtered out from saves during normalization. So you can safely iterate on variable design without worrying about breaking existing players' saves.

---

## Practical examples

### 1. Simple HP variable

The classic use case. A health value with upper and lower bound protection.

```json
{
  "id": "health",
  "name": "health",
  "type": "number",
  "defaultValue": 100,
  "min": 0,
  "max": 100,
  "category": "stat",
  "description": "Character's current health",
  "behaviorRules": "Normal attacks deal 5–15 damage. Healing potions restore 30 HP. Character dies when HP reaches zero."
}
```

Example AI output:

```
The hero's arm is slashed by the goblin's claw. [health: -8]

You drink a healing potion. Warm light flows through you. [health: +30]
```

Because max is 100, even if current HP is 90 and you add 30, the result is 100, not 120.

### 2. Inventory variable (json array of objects)

Store items as objects so `push` can accept them directly. Use `<UpdateVariable>` JSON Patch when you need to remove an item by index.

```json
{
  "id": "inventory",
  "name": "inventory",
  "type": "json",
  "defaultValue": [
    {"id": "torch", "name": "Torch", "qty": 1},
    {"id": "bread", "name": "Bread", "qty": 2}
  ],
  "category": "inventory",
  "description": "Player's inventory (array of item objects)",
  "behaviorRules": "Use push with a full item object to add items. To remove a consumed or discarded item, emit an <UpdateVariable target=\"inventory\"><JSONPatch>[{\"op\":\"remove\",\"path\":\"/<index>\"}]</JSONPatch></UpdateVariable> block. Inventory limit: 10 items."
}
```

Example AI output:

```
You find a rusty iron sword in the chest.
[inventory: push {"id": "iron_sword", "name": "Iron Sword", "qty": 1}]

You light the torch to illuminate the cave depths. It slowly dies out in the damp air.
<UpdateVariable target="inventory"><JSONPatch>[{"op":"remove","path":"/0"}]</JSONPatch></UpdateVariable>
```

The JSON Patch block removes index 0 ("torch") from the array. See [Directives & Macros](./05-directives-and-macros.md) for more patch examples.

### 3. Character relationship variable (json object + nested paths)

Use a single json object to store relationship data for multiple characters, with dot-path for precise modification.

```json
{
  "id": "relationships",
  "name": "relationships",
  "type": "json",
  "defaultValue": {
    "aria": { "trust": 50, "romance": 0, "met": true },
    "kael": { "trust": 30, "romance": 0, "met": false }
  },
  "category": "relationship",
  "description": "Relationship values for each character",
  "behaviorRules": "trust range 0–100, romance range 0–100. Major decisions affect 10–20 points, casual dialogue 1–5 points. Set met to true on first meeting."
}
```

Example AI output:

```
Aria is surprised by your honesty. The corner of her mouth lifts slightly.
[relationships.aria.trust: +10]

You meet Kael for the first time at the tavern. He watches you warily.
[relationships.kael.met: set true]
[relationships.kael.trust: +5]
```

The engine navigates to the nested path automatically, modifying only the relevant fields. Changing `aria.trust` has no effect on `aria.romance` or any of Kael's data.

This structure is far more flexible than creating separate variables for each character — you can add new characters anytime via merge, and the AI can reach any depth with dot-path.
