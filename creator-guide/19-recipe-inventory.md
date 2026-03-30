<div v-pre>

# Inventory & Equipment

> Build an inventory grid — show every item the player has collected, with icons and quantities. Consumables can be used (disappear when depleted), equipment can be worn. This recipe shows you how to use push/delete/merge operations on json variables to build a full inventory system.

---

## What you'll build

An inventory panel embedded in the chat interface. The player sees all their items, each displaying an icon, name, and quantity. Below each item is an action button:

- **Consumables** (e.g. potions) — click "Use" → HP restores by 20 → potion count decreases by 1 → removed from inventory when count hits 0 → popup says "Used a potion! HP +20"
- **Equipment** (e.g. iron sword) — click "Equip" → weapon slot shows "Iron Sword" → AI knows the player is wielding an iron sword → popup says "Equipped Iron Sword!"

```
Player clicks the "Use" button on a potion
  → triggers "use-potion" behavior
  → behavior checks: does inventory contain a potion?
    → yes: hp +20, potion deleted from inventory, success notification
    → no: popup warns "No potions left!"

Player clicks the "Equip" button on Iron Sword
  → triggers "equip-sword" behavior
  → equipped_weapon set to "Iron Sword"
  → injected instruction tells the AI: player is now wielding an iron sword
  → popup says "Equipped Iron Sword!"
```

---

## How it works

The core of this inventory system is a **json variable**. Regular variables (number, string) hold a single value, but a json variable can store an entire array or object — perfect for representing a list of items.

Yumina's behavior system provides three dedicated operations for json variables:

| Operation | What it does | Example |
|-----------|-------------|---------|
| `push` | Append an element to the end of the array | Player picks up a new item → push an item object |
| `delete` | Remove the first matching element from the array | Potion used up → delete the potion object |
| `merge` | Update fields on a matching element in the array | Potion count -1 → merge to update the count field |

Our inventory variable is a JSON array where each element is an item object:

```json
[
  { "name": "Potion", "icon": "🧪", "count": 2 },
  { "name": "Iron Sword", "icon": "⚔️", "count": 1 }
]
```

The full flow:

```
Message renderer (inventory UI)
  → player clicks the "Use" button on a potion
  → calls api.executeAction("use-potion")
  → engine finds the behavior with action ID "use-potion"
  → checks condition: does inventory contain a potion?
    → pass → execute effects: hp +20, inventory merge potion count -1 (or delete), show notification
    → fail → popup "No potions" warning
```

---

## Step by step

### Step 1: Create the variables

We need 3 variables — inventory (json array), hit points (number), and currently equipped weapon (string).

Editor → left sidebar → **Variables** tab → click "Add Variable" for each

#### Variable 1: Inventory

| Field | Value | Why |
|-------|-------|-----|
| Display Name | Inventory | Human-readable label for you |
| ID | `inventory` | The ID used in code and behaviors to read/write this variable |
| Type | JSON | The inventory is an array — needs the json type to store it |
| Default Value | `[{"name":"Potion","icon":"🧪","count":2},{"name":"Iron Sword","icon":"⚔️","count":1}]` | New sessions start with 2 potions and 1 iron sword |
| Category | Inventory | Groups it under the Inventory category |
| Behavior Rules | `Inventory buttons handle use and equip actions automatically. You may also add items during the story (player finds loot, receives a reward) or remove items (broken, lost, stolen).` | Tells the AI the inventory can change during the narrative too |

> **The default value of a json variable must be valid JSON.** Use double quotes around field names and string values. Each item object has three fields: `name` (for matching and display), `icon` (for the UI), `count` (to track quantity for consumables).

#### Variable 2: Hit Points

| Field | Value | Why |
|-------|-------|-----|
| Display Name | Hit Points | Human-readable label |
| ID | `hp` | Used when potions restore HP |
| Type | Number | HP is numeric — needs add/subtract |
| Default Value | `80` | Starting below max gives the player a reason to use a potion |
| Min Value | `0` | Prevents HP from going negative |
| Max Value | `100` | HP cap of 100, prevents infinite stacking |
| Category | Stats | Character stat variable |
| Behavior Rules | `Current value represents the player's remaining hit points (0-100). Decrease in combat or dangerous situations, increase when using potions or resting.` | Tells the AI when to change HP |

#### Variable 3: Equipped Weapon

| Field | Value | Why |
|-------|-------|-----|
| Display Name | Equipped Weapon | Human-readable label |
| ID | `equipped_weapon` | Records the name of the player's equipped weapon |
| Type | String | Stores the weapon name as text |
| Default Value | *(leave empty)* | Empty string = no weapon equipped |
| Category | Custom | Equipment state variable |
| Behavior Rules | `Current value is the name of the player's equipped weapon. Empty string means nothing equipped. The equip button sets this automatically, but you may also change it during the story — e.g. weapon breaks, gets stolen, or player finds a new one.` | Tells the AI that equipment state can change narratively too |

> **Why use a string for equipped_weapon instead of json?** Because the player can only wield one weapon at a time. A simple string is enough — empty means unequipped, `"Iron Sword"` means equipped. If you want a multi-slot equipment system (weapon + armor + accessory), you could use a json object instead.

---

### Step 2: Create the behaviors

We need 4 behaviors — use potion (success / no potions) and equip iron sword (success / already equipped).

Editor → **Behaviors** tab → click "Add Behavior"

#### Behavior 1: Use Potion (success)

**WHEN (trigger):**

| Field | Value | Why |
|-------|-------|-----|
| Trigger Type | Action button pressed | Fires when the message renderer calls `executeAction("use-potion")` |
| Action ID | `use-potion` | Matches the `executeAction("use-potion")` call in the renderer |

**ONLY IF (conditions):**

| Variable | Operator | Value | Why |
|----------|----------|-------|-----|
| `inventory` | contains | `Potion` | Check that the inventory actually has a potion |

**DO (effects):**

Add these effects in order:

| Effect Type | Settings | What it does |
|-------------|----------|-------------|
| Modify Variable | Variable `hp`, operation `add`, value `20` | Restore 20 HP |
| Modify Variable | Variable `inventory`, operation `delete`, value `{"name":"Potion"}` | Remove the potion from inventory |
| Show Notification | Message `Used a potion! HP +20`, style `achievement` | Gold success popup |

> **How does delete match?** When you delete `{"name":"Potion"}`, the engine finds the first object in the array whose `name` field equals `"Potion"` and removes the entire object. You don't need to write the full object (no need to include icon and count) — just provide enough fields for the engine to find the target.

::: tip Want to decrease quantity instead of deleting outright?
If you want potions to lose 1 count (rather than being removed entirely), use `merge` instead of `delete`. Merge `{"name":"Potion","count":-1}` finds the object named "Potion" and decreases its count by 1. But you'll need an additional behavior: when count drops to 0, delete the entry. The "Advanced" section below covers this pattern.
:::

#### Behavior 2: Use Potion (no potions left)

This behavior listens on the same action ID, but the condition is "inventory does **not** contain a potion."

**WHEN:**

| Field | Value |
|-------|-------|
| Trigger Type | Action button pressed |
| Action ID | `use-potion` |

**ONLY IF:**

| Variable | Operator | Value | Why |
|----------|----------|-------|-----|
| `inventory` | not_contains | `Potion` | Inventory has no potions |

**DO:**

| Effect Type | Settings | What it does |
|-------------|----------|-------------|
| Show Notification | Message `No potions left!`, style `warning` | Yellow warning popup |

#### Behavior 3: Equip Iron Sword (success)

**WHEN:**

| Field | Value |
|-------|-------|
| Trigger Type | Action button pressed |
| Action ID | `equip-sword` |

**ONLY IF:**

| Variable | Operator | Value | Why |
|----------|----------|-------|-----|
| `inventory` | contains | `Iron Sword` | Can only equip it if it's in the inventory |
| `equipped_weapon` | neq | `Iron Sword` | Not already equipped — prevents overlap with Behavior 4 |

**DO:**

| Effect Type | Settings | What it does |
|-------------|----------|-------------|
| Modify Variable | Variable `equipped_weapon`, operation `set`, value `Iron Sword` | Set current weapon to Iron Sword |
| Tell AI | Content: `The player equipped an Iron Sword. From now on, the player is wielding an iron longsword. Reflect the weapon's presence in combat descriptions and interactions.` | Injects an instruction so the AI knows about the weapon |
| Show Notification | Message `Equipped Iron Sword!`, style `achievement` | Gold success popup |

> **What does "Tell AI" do?** It injects a temporary instruction into the AI's context. This way, when the AI writes its next response, it knows the player just equipped a sword and can reflect it in the narrative (e.g., "You tighten your grip on the iron sword. Its cold edge glints in the firelight.").

#### Behavior 4: Equip Iron Sword (already equipped)

**WHEN:**

| Field | Value |
|-------|-------|
| Trigger Type | Action button pressed |
| Action ID | `equip-sword` |

**ONLY IF:**

| Variable | Operator | Value | Why |
|----------|----------|-------|-----|
| `equipped_weapon` | eq | `Iron Sword` | Already equipped — no need to equip again |

**DO:**

| Effect Type | Settings | What it does |
|-------------|----------|-------------|
| Show Notification | Message `Iron Sword is already equipped!`, style `info` | Blue info popup |

> **Why split this into two behaviors?** Same pattern as the shop recipe — a single behavior can only have one set of conditions. If the conditions pass, it executes; if they don't, nothing happens. So we use two behaviors to cover both cases. They listen on the same action ID, but their conditions are mutually exclusive — only one ever fires.

---

### Step 3: Build the inventory message renderer

This is the step that makes the inventory UI appear in the chat. We'll display three sections below the latest message: an HP bar, an equipment slot, and an inventory grid (each item with an action button).

Editor → **Message Renderer** tab → select "Custom TSX" → paste:

```tsx
export default function Renderer({ content, renderMarkdown, messageIndex }) {
  const api = useYumina();
  const msgs = api.messages || [];
  const isLastMsg = messageIndex === msgs.length - 1;

  // Read variables
  const hp = Number(api.variables.hp ?? 80);
  const equippedWeapon = String(api.variables.equipped_weapon || "");
  const inventory = Array.isArray(api.variables.inventory)
    ? api.variables.inventory
    : [];

  // Item type map: decides what action each item gets
  const itemActions = {
    "Potion": { type: "consumable", actionId: "use-potion", label: "Use" },
    "Iron Sword": { type: "equipment", actionId: "equip-sword", label: "Equip" },
  };

  return (
    <div>
      {/* Render message text normally */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* Show inventory panel only below the last message */}
      {isLastMsg && (
        <div style={{
          marginTop: "16px",
          padding: "16px",
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "12px",
          border: "1px solid #334155",
        }}>

          {/* ====== HP Bar ====== */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px",
          }}>
            <span style={{ fontSize: "16px" }}>❤️</span>
            <div style={{ flex: 1 }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>HP</span>
                <span style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: "bold" }}>
                  {hp} / 100
                </span>
              </div>
              <div style={{
                height: "8px",
                background: "#1e293b",
                borderRadius: "4px",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(hp, 100)}%`,
                  background: hp > 50
                    ? "linear-gradient(90deg, #22c55e, #4ade80)"
                    : hp > 20
                      ? "linear-gradient(90deg, #eab308, #facc15)"
                      : "linear-gradient(90deg, #ef4444, #f87171)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          </div>

          {/* ====== Equipment Slot ====== */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "14px",
            padding: "10px 14px",
            background: "rgba(30, 41, 59, 0.8)",
            borderRadius: "8px",
            border: "1px solid #475569",
          }}>
            <span style={{ fontSize: "16px" }}>⚔️</span>
            <span style={{ color: "#94a3b8", fontSize: "13px" }}>Weapon:</span>
            <span style={{
              color: equippedWeapon ? "#e2e8f0" : "#475569",
              fontSize: "13px",
              fontWeight: equippedWeapon ? "600" : "normal",
              fontStyle: equippedWeapon ? "normal" : "italic",
            }}>
              {equippedWeapon || "None"}
            </span>
          </div>

          {/* ====== Inventory Header ====== */}
          <div style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "#94a3b8",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}>
            Inventory
          </div>

          {/* ====== Inventory Grid ====== */}
          {inventory.length === 0 ? (
            <div style={{
              padding: "24px",
              textAlign: "center",
              color: "#475569",
              fontSize: "13px",
              background: "rgba(30, 41, 59, 0.4)",
              borderRadius: "8px",
              border: "1px dashed #334155",
            }}>
              Inventory is empty
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "8px",
            }}>
              {inventory.map((item, idx) => {
                const name = String(item?.name || item);
                const icon = String(item?.icon || "📦");
                const count = Number(item?.count ?? 1);
                const action = itemActions[name];

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "12px 8px 8px",
                      background: "rgba(30, 41, 59, 0.8)",
                      borderRadius: "8px",
                      border: equippedWeapon === name
                        ? "1px solid #22d3ee"
                        : "1px solid #475569",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{icon}</span>
                    <span style={{
                      color: "#e2e8f0",
                      fontSize: "12px",
                      fontWeight: "600",
                      textAlign: "center",
                    }}>
                      {name}
                    </span>
                    <span style={{
                      color: "#64748b",
                      fontSize: "11px",
                    }}>
                      x{count}
                    </span>

                    {/* Action button */}
                    {action && (
                      <button
                        onClick={() => api.executeAction(action.actionId)}
                        style={{
                          marginTop: "4px",
                          padding: "4px 14px",
                          background: action.type === "consumable"
                            ? "linear-gradient(135deg, #065f46, #047857)"
                            : equippedWeapon === name
                              ? "linear-gradient(135deg, #374151, #4b5563)"
                              : "linear-gradient(135deg, #1e3a5f, #1e40af)",
                          border: action.type === "consumable"
                            ? "1px solid #10b981"
                            : equippedWeapon === name
                              ? "1px solid #6b7280"
                              : "1px solid #3b82f6",
                          borderRadius: "6px",
                          color: action.type === "consumable"
                            ? "#a7f3d0"
                            : equippedWeapon === name
                              ? "#9ca3af"
                              : "#bfdbfe",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        {equippedWeapon === name ? "Equipped" : action.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### Code walkthrough

Don't be intimidated by the length — what it does is very straightforward. Let's go section by section:

#### Basic setup

```tsx
const api = useYumina();
const msgs = api.messages || [];
const isLastMsg = messageIndex === msgs.length - 1;
```

- `useYumina()` — grabs the Yumina API so you can read variables and trigger actions
- `isLastMsg` — checks whether this is the last message. The inventory panel only renders below the last message, so it doesn't repeat on every single one

#### Reading variables

```tsx
const hp = Number(api.variables.hp ?? 80);
const equippedWeapon = String(api.variables.equipped_weapon || "");
const inventory = Array.isArray(api.variables.inventory)
  ? api.variables.inventory
  : [];
```

- `api.variables.hp` — reads the hit points. `?? 80` is a fallback in case the variable hasn't loaded yet
- `api.variables.equipped_weapon` — reads the current weapon. Empty string means nothing equipped
- `api.variables.inventory` — reads the inventory. `Array.isArray()` guards against unexpected types

#### Item type map

```tsx
const itemActions = {
  "Potion": { type: "consumable", actionId: "use-potion", label: "Use" },
  "Iron Sword": { type: "equipment", actionId: "equip-sword", label: "Equip" },
};
```

A lookup table. Given an item's name, it tells you the button label and the action ID to trigger. The `type` field controls button color — consumables get green, equipment gets blue. Want to add a new item? Add a line here, then create a matching behavior in the editor.

#### HP bar

```tsx
<div style={{
  height: "100%",
  width: `${Math.min(hp, 100)}%`,
  background: hp > 50 ? "...green..." : hp > 20 ? "...yellow..." : "...red...",
}} />
```

A simple progress bar. The width tracks HP, and the color shifts — above 50 is green (safe), 20-50 is yellow (warning), below 20 is red (danger). `transition: "width 0.3s ease"` gives the bar a smooth animation when the value changes.

#### Equipment slot

```tsx
<span style={{
  color: equippedWeapon ? "#e2e8f0" : "#475569",
  fontStyle: equippedWeapon ? "normal" : "italic",
}}>
  {equippedWeapon || "None"}
</span>
```

Displays the name of the currently equipped weapon. When nothing is equipped, it shows a gray italic "None". When something is equipped, the name appears in white regular text.

#### Inventory grid

```tsx
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "8px",
}}>
```

Uses CSS Grid to lay out items in a responsive grid. `auto-fill` + `minmax(140px, 1fr)` makes cells adapt to the available width — the 140px minimum is a bit wider than a display-only grid because each cell includes a button.

#### Action button

```tsx
<button onClick={() => api.executeAction(action.actionId)}>
  {equippedWeapon === name ? "Equipped" : action.label}
</button>
```

This is the key line. Clicking the button calls `api.executeAction("use-potion")` or `api.executeAction("equip-sword")`, and the engine finds the matching behavior and runs it. If the item is equipment and already equipped, the button text changes to "Equipped".

::: tip Don't want to write code yourself? Use Studio AI
Editor top bar → click "Enter Studio" → AI Assistant panel → describe what you want in plain language, e.g. "Build an inventory grid with an HP bar, equipment slot, and items that can be used or equipped" — the AI will generate the code for you.
:::

---

### Step 4: Save and test

1. Click **Save** at the top of the editor
2. Click **Start Game** or go back to the home page and start a new session
3. You'll see the inventory panel below the AI's response: HP 80/100, weapon slot empty, 2 potions and 1 iron sword
4. Click "Use" on a potion — HP goes from 80 to 100, the potion disappears, gold popup says "Used a potion! HP +20"
5. Click "Equip" on Iron Sword — weapon slot shows "Iron Sword", button turns gray and says "Equipped", popup says "Equipped Iron Sword!"
6. Click the "Equipped" button on Iron Sword again — blue popup says "Iron Sword is already equipped!"
7. Keep chatting with the AI — if you added the "Tell AI" effect, the AI's response will reflect the player wielding an iron sword

**If something isn't working:**

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Inventory panel doesn't appear | Message renderer code wasn't saved or has a syntax error | Check the compile status at the bottom of the message renderer — it should show a green "OK" |
| Inventory shows no items | JSON variable default value has bad formatting | Make sure the default is a valid JSON array with double-quoted field names |
| Button does nothing when clicked | Behavior action ID doesn't match the code | Confirm the behavior's action ID is exactly `use-potion` / `equip-sword`, matching the `executeAction()` argument in the code |
| Potion was used but didn't disappear | Delete operation match value is wrong | Confirm the delete value is `{"name":"Potion"}` — watch the double quotes |
| HP didn't change | Add operation in the behavior is misconfigured | Check the Modify Variable effect: variable = `hp`, operation = `add`, value = `20` |
| Equipped but AI doesn't know | Missing "Tell AI" effect | Add a "Tell AI" effect inside the equip behavior's DO section |

---

## Advanced: The three json variable operations in detail

Now that you have the basics, let's dig deeper into the three json variable operations. This is the core knowledge behind the inventory system.

### push — add an item

`push` appends an element to the end of the array.

| Scenario | Operation | Result |
|----------|-----------|--------|
| Player picks up a potion | push `{"name":"Potion","icon":"🧪","count":1}` | `[...]` → `[..., {"name":"Potion","icon":"🧪","count":1}]` |
| Player receives a new weapon | push `{"name":"Magic Staff","icon":"🪄","count":1}` | `[...]` → `[..., {"name":"Magic Staff","icon":"🪄","count":1}]` |

> **Note:** push does not check for duplicates. If the inventory already has a "Potion" entry, pushing another "Potion" creates a second record. If you want same-name items to stack, use merge to update the count instead of pushing a new entry.

### delete — remove an item

`delete` removes the **first** matching element from the array.

| Scenario | Operation | Result |
|----------|-----------|--------|
| Potion used up | delete `{"name":"Potion"}` | `[{"name":"Potion",...}, {"name":"Iron Sword",...}]` → `[{"name":"Iron Sword",...}]` |
| Discard Iron Sword | delete `{"name":"Iron Sword"}` | `[{"name":"Iron Sword",...}]` → `[]` |

> **Partial matching is enough.** You don't need to write the full object — just provide enough fields to uniquely match the target. `{"name":"Potion"}` will match `{"name":"Potion","icon":"🧪","count":2}`.

### merge — update item fields

`merge` finds a matching element, then **merges/updates** the specified fields.

| Scenario | Operation | Result |
|----------|-----------|--------|
| Potion count -1 | merge `{"name":"Potion","count":-1}` | `{"name":"Potion","count":2}` → `{"name":"Potion","count":1}` |
| Potion count +3 | merge `{"name":"Potion","count":3}` | `{"name":"Potion","count":1}` → `{"name":"Potion","count":4}` |

> **Is merge's count an increment or an absolute value?** It depends on the engine implementation. In Yumina, numeric fields in merge are **incremental** — `count: -1` means subtract 1 from the current value, not set count to -1. If you want to set an exact value, use the `set` operation instead of merge.

### Advanced patterns using combinations

**Quantity management pattern** — decrease count on use, remove the entry when count hits 0:

```
Behavior A: Use Potion
  Condition: inventory contains "Potion"
  Effects:
    1. Modify Variable hp, operation add, value 20
    2. Modify Variable inventory, operation merge, value {"name":"Potion","count":-1}
    3. Show Notification "Used a potion! HP +20"

Behavior B: Remove empty Potion entry
  Condition: inventory contains "Potion" AND Potion's count = 0
  Effects:
    1. Modify Variable inventory, operation delete, value {"name":"Potion"}
```

**Item acquisition pattern** — if the inventory already has a same-name item, stack the count; otherwise add a new entry:

```
Behavior A: Gain Potion (already owned)
  Condition: inventory contains "Potion"
  Effects:
    1. Modify Variable inventory, operation merge, value {"name":"Potion","count":1}

Behavior B: Gain Potion (new item)
  Condition: inventory not_contains "Potion"
  Effects:
    1. Modify Variable inventory, operation push, value {"name":"Potion","icon":"🧪","count":1}
```

---

## Quick reference

| What you want | How to do it |
|---------------|-------------|
| Store a list of items | Create a json variable with a default value of `[{...}, ...]` |
| Add a new item | Behavior effect: Modify Variable, operation `push`, value = item object |
| Remove an item | Behavior effect: Modify Variable, operation `delete`, value = matching object |
| Update item quantity | Behavior effect: Modify Variable, operation `merge`, value includes count increment |
| Check if player owns an item | Behavior condition: `inventory contains "ItemName"` |
| Use a consumable | Behavior: check ownership → hp add → delete (or merge count -1) |
| Equip an item | Behavior: set the equipment variable + Tell AI |
| Track current equipment | Create a string variable — empty string = nothing equipped |
| Show an inventory grid | In the message renderer, use CSS Grid + `inventory.map()` |
| Button triggers use/equip | In the message renderer, call `api.executeAction("actionId")` |
| Let the AI know about equipment changes | Add a "Tell AI" effect in the behavior |

---

## Try it yourself — importable demo world

Download this JSON and import it as a new world to see everything in action:

<a href="/recipe-7-demo.json" download>recipe-7-demo.json</a>

**How to import:**
1. Go to Yumina → **My Worlds** → **Create New World**
2. In the editor, click **More Actions** → **Import Package**
3. Select the downloaded `.json` file
4. The world is created with all variables, behaviors, and renderer pre-configured
5. Start a new session and try it out

**What's included:**
- 3 variables (`inventory` + `hp` hit points + `equipped_weapon` current weapon)
- 4 behaviors (use potion success/fail + equip iron sword success/already equipped)
- A message renderer (HP bar + equipment slot + inventory grid + action buttons)

---

::: tip This is Recipe #7
Earlier recipes covered scene jumping, combat systems, shop interfaces, and character creation. This recipe teaches you how to use push/delete/merge operations on json variables to manage structured data and build an inventory with use and equip functionality. The same pattern works for quest logs, skill trees, crafting recipes — anything that needs "manage a list, perform operations on its elements."
:::

</div>
