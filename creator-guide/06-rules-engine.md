# Rules Engine

> A Behavior is your world's automated assistant — you define the conditions, and it watches and acts, completely invisible to the player.
>
> In the editor, this section is called **Behaviors**.

---

## The short version

### What are rules?

(In the editor, you'll find these under the **Behaviors** section.)

Imagine hiring a butler. You tell him: "If a guest arrives at the door, turn on the lights. If the fridge is empty, go grocery shopping." Then you walk away — the butler will keep watching, and when conditions are met, he handles it automatically.

Yumina's rules engine is that butler. Write the rules, and the engine checks them on every message and every state change. When something should trigger, it triggers. When something should execute, it executes. No code, no manual control — it's all declarative.

### WHEN / ONLY IF / DO — the three-part structure

In the editor, every behavior is built from three blocks — matching the three colored labels you'll see:

- **WHEN (trigger)** — what sets it off. Like "when a variable changes," "every 3 turns," "when the player says a certain keyword."
- **ONLY IF (condition, optional)** — check the current state. Like "is HP ≤ 0?" or "is location equal to dark_forest?" If left empty, it always executes.
- **DO (action)** — what actually happens. Like "notify the player that the game is over," "modify a variable," "switch the background music."

WHEN tells the engine when to look at this behavior. ONLY IF determines whether to act (if skipped, it acts immediately). DO is the part that does the work.

### The simplest example

> When HP changes, if HP drops below 0, notify the player "You died."

```
WHEN:    Variable crosses threshold (health drops below 0)
ONLY IF: (leave blank)
DO:      Notify player "You died" (danger style)
```

That's it. In the editor, click **Add Behavior**, select a trigger event, fill in conditions, add actions — all clicks and dropdowns, no code. The moment a player's HP gets knocked below 0, a red danger notification pops on screen. No need for the AI to remember, no need to write it into every prompt — the engine handles it automatically.

---

## The detailed version

### Behavior — full field reference

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | string | Yes | — | Unique identifier |
| `name` | string | Yes | — | Behavior name (for your own reference) |
| `description` | string | No | — | Description (also for your own reference) |
| `trigger` | TriggerConfig | Yes | — | WHEN: trigger configuration |
| `conditions` | Condition[] | No | `[]` | ONLY IF: condition list |
| `conditionLogic` | `"all"` / `"any"` | No | `"all"` | Logic for combining conditions |
| `actions` | RuleAction[] | No | `[]` | DO: action list |
| `priority` | number | No | `0` | Priority — higher numbers evaluate first |
| `cooldownTurns` | number | No | — | How many turns to wait before this behavior can trigger again |
| `maxFireCount` | number | No | — | Maximum number of times this can ever trigger |
| `enabled` | boolean | No | `true` | Whether this behavior is active |

---

### Triggers (WHEN)

The trigger determines when the engine checks this behavior. Think of it as an alarm clock — when it rings, the butler wakes up to check the conditions.

#### Trigger types

The editor organizes triggers into groups for easy browsing:

**Messages**

| Editor label | Internal type | Description |
|-------------|--------------|-------------|
| Every turn | `every-turn` | Fires after each complete player/AI exchange |
| Player says keyword | `keyword` | Fires when player's message contains a keyword |
| AI says keyword | `ai-keyword` | Fires when AI's reply contains a keyword |
| Session starts | `session-start` | Fires when a new session (conversation) starts |

**Game State**

| Editor label | Internal type | Description |
|-------------|--------------|-------------|
| Variable changes | `state-change` | Fires when any variable changes |
| Variable crosses threshold | `variable-crossed` | Fires when a number variable crosses a threshold. Requires: `variableId`, `threshold`, `direction` (`"rises-above"` or `"drops-below"`) |
| Action button pressed | `action` | Fires when a custom action is executed. Requires `actionId` |

**Timing**

| Editor label | Internal type | Description |
|-------------|--------------|-------------|
| Every N turns | `turn-count` | Fires at a specific turn (`atTurn`) or every N turns (`everyNTurns`) |

**Manual**

| Editor label | Internal type | Description |
|-------------|--------------|-------------|
| Manual trigger | `manual` | Fires only when explicitly triggered by a custom component calling `api.executeAction()`. Good for player-initiated actions like "open shop" or "use skill" |

**Timers**

| Editor label | Internal type | Description |
|-------------|--------------|-------------|
| Timer fires | `timer:fired` | Fires when a countdown created by a "start timer" action completes. Handled via the Reaction system internally |

::: warning Timer system status
Timer triggers (`timer:fired`) and timer actions (`start-timer`, `cancel-timer`) are available in the editor, but the client-side timer runtime is not yet fully integrated. Timers you create in the editor will be saved but won't count down during gameplay in the current version. This feature is under active development.
:::

**`state-change` vs `variable-crossed`:** `state-change` is "tell me any time something moves" — very broad. `variable-crossed` is "only tell me when this specific variable crosses this specific line" — very precise. Analogy: `state-change` is asking the butler to check the front door every time there's any noise. `variable-crossed` is asking him to alert you only when the thermometer drops below zero.

**Advanced keyword trigger config:** `keyword` and `ai-keyword` triggers support quite detailed match control:

- `matchWholeWords` — whole-word matching (prevents "cat" from matching "category")
- `useFuzzyMatch` — fuzzy matching (tolerates typos)
- `secondaryKeywords` + `secondaryKeywordLogic` — secondary keyword filtering, four logic modes:
  - `AND_ANY`: primary matches + at least one secondary matches
  - `AND_ALL`: primary matches + all secondaries match
  - `NOT_ANY`: primary matches + none of the secondaries match
  - `NOT_ALL`: primary matches + not all secondaries match

---

### Conditions (ONLY IF)

Triggers just tell the engine to "look." Conditions are the real gatekeepers. Conditions check the current values of game state variables.

Each condition has three parts:

```
variableId  +  operator  +  value
```

#### 7 operators

| Operator | Meaning | Applicable types | Example |
|----------|---------|-----------------|---------|
| `eq` | Equal | number/string/boolean | `health eq 0` |
| `neq` | Not equal | number/string/boolean | `status neq "dead"` |
| `gt` | Greater than | number | `gold gt 100` |
| `gte` | Greater than or equal | number | `level gte 5` |
| `lt` | Less than | number | `hunger lt 20` |
| `lte` | Less than or equal | number | `hp lte 0` |
| `contains` | Contains substring | string | `inventory contains "sword"` |

#### Condition combining logic

- `conditionLogic: "all"` (default) — all conditions must pass, equivalent to AND
- `conditionLogic: "any"` — any one condition passing is enough, equivalent to OR

For "HP below 20 AND no health potions," use two conditions with `"all"`. For "HP below 20 OR poisoned," use two conditions with `"any"`.

**Note:** If `conditions` is an empty array, the check automatically passes. In other words, if you only wrote a trigger without any conditions, the trigger firing means the rule immediately executes.

---

### Actions (DO)

Once conditions pass, the engine executes the actions defined in the rule. A single rule can have multiple actions, all executed in sequence.

#### Action types

The editor organizes actions into groups:

##### Game

**1. `modify-variable` — modify a variable**

Directly changes a variable in the game state.

| Field | Description |
|-------|-------------|
| `variableId` | ID of the variable to modify |
| `operation` | Operation: `set`, `add`, `subtract`, `multiply`, `toggle`, `append`, `merge`, `push`, `delete` |
| `value` | The value for the operation |

##### AI & Story

**2. `inject-directive` — tell the AI (inject a temporary system prompt)**

Inserts a temporary instruction into the AI's context. One of the most powerful actions — you can change the AI's behavior under specific conditions.

| Field | Description |
|-------|-------------|
| `directiveId` | Unique ID for this directive (used to remove it later) |
| `content` | Instruction text |
| `position` | Where to insert: `top`, `before_char`, `after_char`, `bottom`, `depth`, `auto` (default) |
| `persistent` | Whether to persist across turns (default `true`) |
| `duration` | Optional: auto-expire after N turns |

**3. `remove-directive` — stop telling the AI (remove a directive)**

Removes a directive previously injected via `inject-directive`.

| Field | Description |
|-------|-------------|
| `directiveId` | ID of the directive to remove |

**4. `send-context` — have the AI reply (send a context message)**

Sends an invisible message to the AI and triggers AI generation. The player can't see this message, but the AI reads it and replies accordingly.

| Field | Description |
|-------|-------------|
| `message` | Message content |
| `role` | Message role: `"system"` (default) or `"user"` |

**5. `toggle-entry` — enable/disable an entry**

Controls whether a world entry is active.

| Field | Description |
|-------|-------------|
| `entryId` | Entry ID |
| `enabled` | `true` to enable / `false` to disable |

**6. `toggle-rule` — enable/disable another behavior**

Lets behaviors control each other. This is key to building complex behavior chains.

| Field | Description |
|-------|-------------|
| `ruleId` | Target behavior ID |
| `enabled` | `true` to enable / `false` to disable |

##### Player

**7. `notify-player` — notify the player**

Pops up a notification in the player's interface.

| Field | Description |
|-------|-------------|
| `message` | Notification text |
| `style` | Style: `"info"` (default, blue), `"achievement"` (gold), `"warning"` (yellow), `"danger"` (red) |

##### Audio

**8. `play-audio` — play audio**

Controls background music or sound effects.

| Field | Description |
|-------|-------------|
| `trackId` | Track ID (matching a track in `audioTracks`) |
| `action` | Operation: `"play"`, `"stop"`, `"crossfade"`, `"volume"` |
| `volume` | Volume 0–1 (optional) |
| `fadeDuration` | Fade duration in seconds (optional) |

##### Timers

**9. `start-timer` — start a timer** *(not yet functional)*

Starts a countdown. When it expires, a `timer:fired` event triggers, which you can respond to with another behavior.

| Field | Description |
|-------|-------------|
| `id` | Timer ID (unique) |
| `name` | Display name |
| `duration` | Countdown duration in seconds |
| `repeat` | Whether to repeat (optional, defaults to false) |

::: warning Not yet functional
This action is configurable in the editor but timers do not currently count down during gameplay. The timer runtime is under active development.
:::

**10. `cancel-timer` — cancel a timer** *(not yet functional)*

Cancels a running timer.

| Field | Description |
|-------|-------------|
| `id` | Timer ID to cancel |

::: warning Not yet functional
See note above — timer functionality is not yet available at runtime.
:::

---

### Advanced features

#### Priority

The higher the number, the sooner the rule is evaluated and executed. When multiple rules trigger simultaneously, priority decides who goes first.

Example: you have a rule that announces death when HP hits zero (priority: 100), and another that warns of danger when HP is below 20 (priority: 50). Both may be satisfied simultaneously, but the death notification always runs first.

#### Cooldown (cooldownTurns)

After a rule fires, it must wait this many turns before it can fire again. Good for rules that shouldn't fire every turn — like "remind the player about hunger at most once every 5 turns."

#### Max fire count (maxFireCount)

The rule can fire at most this many times in its lifetime. After reaching the limit, it never fires again. For example, a one-time tutorial hint should fire just once — set `maxFireCount: 1`.

#### Rule cross-control (toggle-rule)

Rule A's actions can enable or disable Rule B. Combined with an initially-disabled rule, you can implement "dormant until activated" behavior chains.

Example: Rule A listens for the player entering a dungeon (keyword trigger). When triggered, Rule A uses `toggle-rule` to enable Rule B (a monster encounter rule with `every-turn` trigger, initially disabled). When the player leaves the dungeon, disable Rule B again. Monster encounters only happen in the dungeon.

---

### Evaluation flow

After each player message or state change, the engine runs this full process:

```
Receive event (player message, AI reply, state change, turn end, timer fire, etc.)
  |
  v
Sort all behaviors by priority (highest first)
  |
  v
Check each in sequence:
  1. Is the behavior enabled? (enabled + not disabled at runtime)
  2. Does the WHEN event type match?
  3. Do the WHEN specifics match? (keyword match, threshold cross, etc.)
  4. Do the ONLY IF conditions pass?
  5. Is it in cooldown?
  6. Has it exceeded max fire count?
  |
  v
All pass → collect all actions for this behavior
  |
  v
All behaviors checked → execute all collected actions in order
  |
  v
Actions may modify variables → triggering new events → re-evaluate (with depth limit to prevent infinite loops)
```

The entire process is transparent to the player — they only see the results.

---

## Practical examples

### Example 1: HP hits zero, game over

Player's HP drops below 0 in combat — pop a red danger notification.

```json
{
  "id": "rule-death",
  "name": "Death check",
  "trigger": {
    "type": "variable-crossed",
    "variableId": "health",
    "threshold": 0,
    "direction": "drops-below"
  },
  "conditions": [],
  "actions": [
    {
      "type": "notify-player",
      "message": "Your character has died. Game over.",
      "style": "danger"
    }
  ],
  "priority": 100,
  "maxFireCount": 1,
  "enabled": true
}
```

**Key point:** Using `variable-crossed` rather than `state-change` + condition, because you only want to trigger at the exact moment HP "crosses" 0, not every time HP changes. `maxFireCount: 1` ensures the death notification only pops once.

---

### Example 2: Hunger increases every 3 turns

Simulate a survival mechanic where hunger automatically increases every 3 turns.

```json
{
  "id": "rule-hunger-tick",
  "name": "Hunger cycle",
  "trigger": {
    "type": "turn-count",
    "everyNTurns": 3
  },
  "conditions": [],
  "actions": [
    {
      "type": "modify-variable",
      "variableId": "hunger",
      "operation": "add",
      "value": 1
    }
  ],
  "priority": 10,
  "enabled": true
}
```

**Key point:** `everyNTurns: 3` means it fires on turns 3, 6, 9, 12… No condition needed — just tick on the turn. Want to stop increasing once hunger maxes out? Add a condition `hunger lt 10`.

---

### Example 3: Enter a danger zone, switch BGM

When the player's location variable becomes "dark_forest," crossfade to horror BGM.

```json
{
  "id": "rule-dark-forest-bgm",
  "name": "Dark Forest BGM",
  "trigger": {
    "type": "state-change"
  },
  "conditions": [
    {
      "variableId": "location",
      "operator": "eq",
      "value": "dark_forest"
    }
  ],
  "actions": [
    {
      "type": "play-audio",
      "trackId": "scary_bgm",
      "action": "crossfade",
      "fadeDuration": 2
    }
  ],
  "priority": 20,
  "cooldownTurns": 5,
  "enabled": true
}
```

**Key point:** `state-change` + condition check is used here because location may come from parsed AI output. `cooldownTurns: 5` prevents constant music switching if the player hovers at the forest's edge.

---

### Example 4: Rule cross-control — dungeon monster encounters

Activate the monster encounter rule when entering the dungeon; deactivate when leaving.

```json
[
  {
    "id": "rule-enter-dungeon",
    "name": "Enter dungeon",
    "trigger": {
      "type": "keyword",
      "keywords": ["enter the dungeon", "walk into the cave", "enter dungeon"]
    },
    "conditions": [],
    "actions": [
      {
        "type": "modify-variable",
        "variableId": "location",
        "operation": "set",
        "value": "dungeon"
      },
      {
        "type": "toggle-rule",
        "ruleId": "rule-monster-encounter",
        "enabled": true
      },
      {
        "type": "inject-directive",
        "directiveId": "dungeon-atmosphere",
        "content": "The player is now in a dark, dangerous dungeon. Describe eerie sounds, damp walls, and lurking shadows. Maintain a tense atmosphere.",
        "position": "after_char",
        "persistent": true
      }
    ],
    "priority": 50,
    "enabled": true
  },
  {
    "id": "rule-monster-encounter",
    "name": "Monster encounter",
    "trigger": {
      "type": "every-turn"
    },
    "conditions": [
      {
        "variableId": "location",
        "operator": "eq",
        "value": "dungeon"
      }
    ],
    "actions": [
      {
        "type": "send-context",
        "message": "A monster appears! Describe a random encounter with a dungeon creature appropriate to the current depth. Make it dramatic.",
        "role": "system"
      }
    ],
    "priority": 30,
    "cooldownTurns": 2,
    "enabled": false
  }
]
```

**Key point:** The monster encounter rule starts `enabled: false`. Only after the "enter dungeon" rule fires and uses `toggle-rule` to activate it does it start working every turn. `cooldownTurns: 2` ensures monsters don't spawn every single turn — at least 2 turns between encounters. Meanwhile, `inject-directive` dynamically injects a dungeon atmosphere instruction into the AI context, switching the tone as the scene changes.

---

### Example 5: Achievement system

Unlock the "Rolling in Gold" achievement when the player's gold exceeds 1000.

```json
{
  "id": "rule-rich-achievement",
  "name": "Rolling in Gold",
  "trigger": {
    "type": "variable-crossed",
    "variableId": "gold",
    "threshold": 1000,
    "direction": "rises-above"
  },
  "conditions": [],
  "actions": [
    {
      "type": "notify-player",
      "message": "Achievement unlocked: Rolling in Gold — your gold exceeded 1,000!",
      "style": "achievement"
    },
    {
      "type": "modify-variable",
      "variableId": "achievement_rich",
      "operation": "set",
      "value": true
    }
  ],
  "priority": 80,
  "maxFireCount": 1,
  "enabled": true
}
```

**Key point:** `variable-crossed` + `rises-above` precisely captures the moment gold "crosses" 1000. `maxFireCount: 1` ensures the achievement is only unlocked once. The action both pops a gold achievement notification and sets a boolean flag, so other behaviors or entries can use that flag for conditional logic.

---

### Example 6: Timer — timed challenge

The player enters a room and a 60-second countdown starts. When it expires, the bomb goes off.

```
Behavior A: Enter the secret room
  WHEN:    Player says keyword "enter the secret room"
  ONLY IF: (none)
  DO:
    - Modify variable location = "secret_room"
    - Start timer (ID: bomb_timer, duration: 60 seconds, no repeat)
    - Notify player "The bomb is armed! You have 60 seconds to escape!" (warning)

Behavior B: Bomb explodes
  WHEN:    Timer fires (bomb_timer)
  ONLY IF: location == "secret_room"
  DO:
    - Modify variable health = 0
    - Notify player "BOOM — you couldn't escape the room in time." (danger)
```

**Key point:** Behavior A uses `start-timer` to start a 60-second countdown. When the timer expires, the engine fires a `timer:fired` event, and Behavior B responds. If the player escapes the room within 60 seconds (location is no longer "secret_room"), the ONLY IF condition fails and the bomb does nothing — that's the power of condition checking (≧▽≦)

::: warning
This timer example is a design preview. Timer countdown is not yet functional at runtime — see the timer warning above.
:::
