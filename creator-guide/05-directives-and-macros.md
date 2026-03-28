<div v-pre>

# AI Directives & Macros

> Directives are how the AI changes the game world. Macros make your entry text come alive — these are two of the core mechanisms of Yumina world creation.

---

## The short version

### What are directives?

Think of directives as "commands" the AI issues to the game engine. After writing a story passage, the AI quietly tacks a few bracket-wrapped directives onto the end of its reply, telling the engine: "Hey, this variable needs to change."

The format looks like this: `[variableName: operation value]`

The three most common scenarios:

- **Deducting health**: `[health: -10]` — the player takes a hit, health drops by 10
- **Adding gold**: `[gold: +50]` — defeated a monster, picked up 50 gold
- **Changing scene**: `[location: set "forest"]` — the character walks into the forest

You don't need to write any code. As long as you define variables in the world editor (like `health`, `gold`, `location`), the AI will automatically use directives to update them at the right moments. The engine strips the directives out of the AI's reply before showing it to the player — all they see is clean story text, while the numbers in the status panel have already quietly shifted.

### What are macros?

Macros are placeholders you write in entries, which the engine automatically replaces with real content before sending to the AI. The two most common:

- `{{char}}` — automatically replaced with the current character's name
- `{{user}}` — automatically replaced with the player's name

For example, if you write "{{char}} notices {{user}} walking in," and the character is named Luna and the player is named Kai, the AI actually receives "Luna notices Kai walking in."

This turns your entries into "templates" — swap in a different character name and the whole entry adapts automatically, no manual editing required.

---

## The detailed version

### Directives — the complete reference

#### Basic syntax

```
[variableId: operation value]
```

Three things inside the brackets: the variable ID, the operation, and the value. The variable ID is the identifier you defined in the editor.

#### All operations at a glance

| Operation | Full form | Shorthand | Example | Description |
|-----------|-----------|-----------|---------|-------------|
| Assign | `[var: set value]` | `[var: value]` | `[location: set "castle"]` or `[location: "castle"]` | Sets the variable to a value directly. Omitting `set` works too — treated as implicit assignment |
| Add | `[var: add N]` | `[var: +N]` | `[gold: add 50]` or `[gold: +50]` | Add N to a number variable |
| Subtract | `[var: subtract N]` | `[var: -N]` | `[health: subtract 10]` or `[health: -10]` | Subtract N from a number variable |
| Multiply | `[var: multiply N]` | `[var: *N]` | `[damage: multiply 2]` or `[damage: *2]` | Multiply a number variable by N |
| Toggle | `[var: toggle]` | none | `[hasKey: toggle]` | Flip a boolean — true becomes false, false becomes true. No value needed |
| Append | `[var: append "text"]` | none | `[log: append "found key"]` | Append text to a string variable |
| Merge | `[var: merge {json}]` | none | `[stats: merge {"level": 2}]` | Merge a JSON object into a variable (for complex state) |
| Push | `[var: push value]` | none | `[inventory: push "magic_sword"]` | Push an element onto an array variable |
| Delete | `[var: delete key]` | none | `[stats: delete "buff"]` | Delete a key from an object variable |

#### Value syntax

- **Numbers**: write as-is, e.g. `10`, `3.5`
- **Strings**: wrap in double quotes, e.g. `"forest"`, `"magic_sword"`
- **Booleans**: `true` or `false`
- **JSON**: write the object or array directly, e.g. `{"level": 2}` or `["a", "b"]`

#### Nested paths

Variable IDs support dot-notation for nested paths, just like accessing JavaScript object properties:

```
[gameState.factions.fire.affinity: +5]
```

This means: in the `gameState` variable, navigate to `factions` → `fire` → `affinity`, and add 5. Great for managing complex game state trees.

#### Audio directives

Besides state variables, there's also a dedicated syntax for controlling audio:

```
[audio: trackId action]
```

| Action | Example | Description |
|--------|---------|-------------|
| play | `[audio: battle_bgm play]` | Play a track |
| stop | `[audio: tavern_ambient stop]` | Stop a track |
| crossfade | `[audio: forest_bgm crossfade 2.0]` | Crossfade to this track over N seconds |
| volume | `[audio: rain volume 0.5]` | Set volume (0–1) without stopping |

Also supports chain syntax for sequencing tracks:

```
[audio: intro_bgm play chain:loop_bgm]
```

Meaning: play `intro_bgm`, and when it finishes, automatically continue with `loop_bgm`.

#### JSON Patch compatibility format

If your card was migrated from SillyTavern, it might use the XML-wrapped JSON Patch format. Yumina recognizes this too:

```xml
<UpdateVariable>
<JSONPatch>
[
  {"op": "replace", "path": "/health/current", "value": 80},
  {"op": "delta", "path": "/gold", "value": 50},
  {"op": "insert", "path": "/inventory/newItem", "value": "holy sword"},
  {"op": "remove", "path": "/debuffs/poison"}
]
</JSONPatch>
</UpdateVariable>
```

Four JSON Patch operations supported: `replace` (assign), `delta` (add/subtract — positive adds, negative subtracts), `insert` (add a key-value pair), `remove` (delete a key). Slashes in paths are automatically converted to dots.

#### Parsing pipeline

From the AI's reply to what the player sees, several steps happen:

1. **Strip thinking tags** — some models (like Gemini) output internal reasoning in `<thinking>...</thinking>` tags; the engine removes these first
2. **Extract JSON Patch** — scan for `<UpdateVariable>` blocks and convert to standard directives
3. **Extract audio directives** — scan for `[audio: ...]` format
4. **Extract JSON directives** — scan for `[var: merge/push/set/delete {...}]` format
5. **Extract standard directives** — scan for `[var: op value]` format
6. **Clean text** — remove all directives from the reply, tidy up extra blank lines, return clean text + list of effects

The player sees clean text. The engine gets the effects list to update game state. Each does its own job.

---

### Macros — the complete reference

#### Full macro list

| Macro | Description | Example output |
|-------|-------------|----------------|
| `{{char}}` | Current character's name | Luna |
| `{{user}}` | Player's name | Kai |
| `{{turnCount}}` | Current turn count | 42 |
| `{{random::a::b::c}}` | Pick one randomly (may differ each time the macro expands) | b |
| `{{pick::a::b::c}}` | Stable hash selection (same turn, same position = same result) | a |
| `{{roll::NdS+M}}` | Roll dice: N dice with S sides plus modifier M | `{{roll::2d6+1}}` might output 8 |
| `{{time}}` | Current time (HH:MM format) | 14:30 |
| `{{date}}` | Current date (local format) | 2026/3/23 |
| `{{weekday}}` | Current day of the week (English) | Sunday |
| `{{isodate}}` | ISO date format | 2026-03-23 |
| `{{isotime}}` | ISO time format | 14:30:00 |
| `{{idle}}` | How long since the player last sent a message | 5 minutes |
| `{{lastMessage}}` | Content of the last message | (full text of the last message) |
| `{{lastUserMessage}}` | The player's last message | (last thing the player said) |
| `{{lastCharMessage}}` | The character's last message | (last thing the character said) |
| `{{model}}` | Name of the current AI model | claude-opus-4-6 |
| `{{// comment text}}` | Comment — expands to nothing (not sent to AI) | (empty string) |
| `{{trim}}` | Eats surrounding whitespace (for precise formatting control) | (collapses adjacent whitespace) |

#### The difference between `random` and `pick`

These two are easy to mix up. An analogy:

- `{{random::cat::dog::rabbit}}` is like drawing a new lot each time — the same entry expanded twice might give "cat" once and "dog" once
- `{{pick::cat::dog::rabbit}}` is like a lot with your name engraved on it — within the same turn, no matter how many times it expands, the result is identical. But it might change on the next turn

`pick` uses a stable hash algorithm. The input is the macro's positional index in the template and the current turn number. So the first `pick` and second `pick` in the same entry usually give different results (different positions), but the same `pick` is constant within a turn.

#### Variable fallback

If a macro name doesn't match any built-in macro but happens to match a game variable's ID, the engine uses that variable's current value. For example, if you define a variable called `mood` with a current value of "happy," `{{mood}}` gets replaced with "happy."

If it's neither a built-in macro nor a variable name, the engine leaves `{{xxx}}` as-is — no errors, no crashes.

---

## Practical examples

### Example 1: Combat scene

Say you have three variables: `health` (player HP, starting at 100), `enemy_hp` (enemy HP, starting at 80), `location` (current location).

The AI might reply:

> You swing your sword at the goblin, the blade cutting across its shoulder. Green blood spurts out. The goblin shrieks and swings its club back, hitting your arm hard — a sharp pain shoots through you.
>
> [health: -15]
> [enemy_hp: -30]

The player sees pure story text. But on the status panel, health changed from 100 to 85 and the goblin's HP dropped from 80 to 50. The engine handled it all quietly in the background.

### Example 2: Item pickup and trading

Variables: `inventory` (array type), `gold` (number type, current value 500).

> The blacksmith hands you a sword glowing with blue light: "This is my masterpiece — the Frost Blade, enchanted, one hundred gold." You pull out your coin purse and pay, and the moment you grip the sword you feel a chill spreading through your palm.
>
> [inventory: push "frost_blade"]
> [gold: -100]

The player's inventory gains a Frost Blade and the coin purse loses 100 gold.

### Example 3: Macros in entries

Write this in a character profile entry:

```
{{char}} is a cold-natured swordsman, but feels something inexplicable toward {{user}}.
When the turn count exceeds 20 (current turn: {{turnCount}}), {{char}} will gradually open up.
```

If the character is "Ye Shuang," the player is "Traveler," and it's currently turn 25, the AI actually receives:

```
Ye Shuang is a cold-natured swordsman, but feels something inexplicable toward Traveler.
When the turn count exceeds 20 (current turn: 25), Ye Shuang will gradually open up.
```

### Example 4: Using `random` for variety

Add some random elements to a world lore entry:

```
Today's weather is {{random::clear::overcast::light rain::heavy fog}}, and the streets are {{random::sparse::bustling::occasionally passing}}.
```

Every time this entry is expanded, the weather and street scene might be different, adding a sense of variety to the story.

### Example 5: Using `roll` for skill checks

```
{{char}} attempts to pick the lock. Roll result: {{roll::1d20+2}} (12 or above succeeds).
```

The AI receives something like "Roll result: 17 (12 or above succeeds)" and can then describe whether the lock-picking succeeds or fails. Shifting the judgment from "AI's discretion" to dice rolls is fairer.

</div>
