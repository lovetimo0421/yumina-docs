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

### Variable — full field reference

Each variable is an object with these fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier. The AI uses this to reference the variable. Can be set manually in the editor (auto-converted to lowercase with underscores) |
| `name` | string | Yes | Display name, at least 1 character. The AI can also reference the variable by name (the engine auto-maps name → id) |
| `type` | `"number"` / `"string"` / `"boolean"` / `"json"` | Yes | Determines what the variable can store and what operations are valid |
| `defaultValue` | number / string / boolean / object / array | Yes | The initial value when a new session starts or when the variable is reset. Called **Default Value** in the editor |
| `description` | string | No | Notes for yourself. Not currently exposed in the editor UI, but can be set by editing the exported JSON |
| `min` | number | No | Number type only — lower bound; values below this are auto-clamped |
| `max` | number | No | Number type only — upper bound; values above this are auto-clamped |
| `category` | see below | No | Category tag for organizing variables and grouping them in the prompt |
| `behaviorRules` | string | No | Plain-language guidance for the AI — tells it how to understand and update this variable |

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

The AI uses bracket syntax in replies to modify variables. The engine parses these directives and executes the corresponding operation. There are 9 in total:

#### set — direct assignment

Sets the variable to a new value, regardless of what it was before.

```
[location: set "forest"]        -- set location to "forest"
[health: set 50]                -- set health directly to 50
[health: 50]                    -- omitting "set" works too, treated as implicit assignment
```

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

Adds an element to the end of a `json` array variable. Use this to put things in the inventory.

```
[inventory: push "sword"]      -- a sword is added to the inventory
[inventory: push {"name": "potion", "qty": 3}]  -- can also push objects
```

#### delete — delete a key or element

For objects: deletes a specified key. For arrays: removes an element at the specified index.

```
[inventory: delete 0]           -- remove first item in inventory (index 0)
[playerFlags: delete "visited"] -- remove the "visited" key from the object
```

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

Supported operations on nested paths include `set`, `add`, `subtract`, `delete`, `merge`, and `push` — most common ones work.

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

### 2. Inventory variable (json array + push/delete)

Use a json array to manage item lists with push and delete operations.

```json
{
  "id": "inventory",
  "name": "inventory",
  "type": "json",
  "defaultValue": ["torch", "bread"],
  "category": "inventory",
  "description": "Player's inventory item list",
  "behaviorRules": "Use push to add items, use delete with an index to remove used or discarded items. Inventory limit: 10 items."
}
```

Example AI output:

```
You find a rusty iron sword in the chest. [inventory: push "iron_sword"]

You light the torch to illuminate the cave depths. It slowly dies out in the damp air. [inventory: delete 0]
```

`delete 0` removes the first element (index 0), which is "torch."

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
