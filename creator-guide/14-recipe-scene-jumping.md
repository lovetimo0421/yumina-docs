# Scene Jumping & Entry Switching via UI

> Click a button in the chat → jump to a different scene → the world's lore automatically reconfigures. This recipe shows you how to wire it all up.

---

## What you'll build

A world where the player sees clickable route buttons in the chat. When they click one:

1. The game state updates (which route they chose)
2. The relevant lore entries get enabled, the rest get disabled
3. The AI generates a new opening scene for that route

This is the foundation for: route selection screens, chapter jumping, scene transitions, and more.

---

## How it works — 30-second overview

```
Player clicks "Enter the Dark Cave"
  → executeAction("choose-dark")
  → Behavior fires:
      1. Sets current_route = "dark"
      2. Enables "Dark Cave Lore" entry, disables "Meadow Lore" entry
      3. Sends hidden message to AI: "Generate the dark cave opening."
  → AI writes the dark cave opening, informed by the now-active lore
```

Four features working together:

| Feature | Role |
|---------|------|
| **Variable** | Stores which route is active |
| **Entries** | Multiple sets of lore/characters, initially disabled |
| **Action-triggered behavior** | Orchestrates the transition: toggle entries + send context |
| **Custom UI (TSX)** | Provides the clickable buttons |

---

## Step by step

### Step 1: Create the route variable

Editor → **Variables** section → **Add Variable**

| Field | Value |
|-------|-------|
| Name | Current Route |
| ID | `current_route` |
| Type | String |
| Default Value | `none` |
| Category | Flag |
| Behavior Rules | `Do not modify this variable. It is controlled by the player's UI choices.` |

::: tip Why set behavior rules?
The "Behavior Rules" field tells the AI **not** to touch this variable on its own. You want it controlled exclusively by the player clicking buttons — not by the AI deciding to change the route mid-sentence.
:::

---

### Step 2: Create your entries

You'll need three kinds of entries:

1. A **default greeting** — the first thing the player sees (with route choices described in the narrative)
2. **Route-specific lore entries** — disabled by default, turned on by behaviors when the player picks a route
3. (Optional) **Route-specific character entries** — same idea, characters behave differently per route

#### 2a. Default greeting

Editor → **Entries** section → **Add Entry**

| Field | Value |
|-------|-------|
| Name | Route Selection Opening |
| Tag | Greeting |
| Section | System Presets |
| Enabled | Yes |

**Content** — write the opening scene that presents the choices:

```
*You wake up in the heart of a mysterious forest. Morning mist swirls between ancient trees, and the air is thick with the smell of damp earth.*

Two paths diverge before you:

**To the left** — a narrow trail disappearing into darkness. The air grows cold, and you hear distant echoes from what might be a cave.

**To the right** — a sun-dappled path where wildflowers sway gently. You catch the scent of honey and hear birdsong.

Which way will you go?
```

This greeting has no special setup — it just shows up when a new session starts, as every greeting does.

#### 2b. Dark route lore entry

**Add Entry:**

| Field | Value |
|-------|-------|
| Name | Dark Cave Lore |
| Tag | Lore |
| Section | System Presets |
| Always Send | Yes |
| Enabled | **No** (disabled by default — the behavior will enable it) |

**Content:**

```
[World: Shadowmaw Cave]
The player is now in the Shadowmaw Cave system. Key details:
- Ancient dwarven ruins, abandoned centuries ago
- Bioluminescent fungi provide dim blue-green light
- Strange creatures lurk in deeper tunnels
- Temperature drops the further you go
- Occasional tremors shake loose rocks from the ceiling

Maintain a tense, horror-survival atmosphere. Describe echoing sounds, flickering shadows, dripping water, and the oppressive weight of stone overhead.
```

#### 2c. Light route lore entry

**Add Entry:**

| Field | Value |
|-------|-------|
| Name | Sunlit Meadow Lore |
| Tag | Lore |
| Section | System Presets |
| Always Send | Yes |
| Enabled | **No** (disabled by default) |

**Content:**

```
[World: Everbloom Meadow]
The player is now in the Everbloom Meadow. Key details:
- Vast flower fields stretching to the horizon
- A cozy village visible in the distance
- Friendly forest spirits occasionally appear as floating lights
- A gentle stream runs through the meadow
- The weather is perpetually warm and pleasant

Maintain a warm, inviting atmosphere. Describe vivid colors, floral scents, gentle breezes, and the feeling of peace and wonder.
```

::: info Why "Always Send = Yes" but "Enabled = No"?
These two settings work together. **Always Send** means "include this entry in every prompt *when it's enabled*." **Enabled** controls whether it's active at all. By starting disabled, the entry stays dormant until a behavior explicitly turns it on with `toggle-entry`. This gives you precise control over which lore is active at any point.
:::

#### 2d. (Optional) Route-specific character entries

You can make the same character behave differently per route. Create two entries, both **disabled by default**:

**Entry: "Alicia — Friendly Mode"**

| Field | Value |
|-------|-------|
| Always Send | Yes |
| Enabled | No |

Content: `Alicia is warm and welcoming. She speaks with a gentle smile and offers to guide the player through the meadow...`

**Entry: "Alicia — Hostile Mode"**

| Field | Value |
|-------|-------|
| Always Send | Yes |
| Enabled | No |

Content: `Alicia is suspicious and cold. She lurks in the shadows, eyes the player with distrust, and speaks in clipped sentences...`

Same character, completely different personality — toggled by the behavior when the player picks a route.

---

### Step 3: Create action behaviors

This is where everything comes together. Each behavior: receives the button click → toggles the right entries on/off → tells the AI to write the new opening.

Editor → **Behaviors** section → **Add Behavior**

#### Behavior A: "Choose Dark Route"

| Field | Value |
|-------|-------|
| Name | Choose Dark Route |
| WHEN | **Action button pressed** → Action ID: `choose-dark` |
| ONLY IF | *(leave empty)* |

**DO — add these actions in order:**

**Action 1: Modify variable**

| Field | Value |
|-------|-------|
| Variable | `current_route` |
| Operation | Set |
| Value | `dark` |

**Action 2: Toggle entry — enable dark lore**

| Field | Value |
|-------|-------|
| Entry | Dark Cave Lore |
| Enabled | Yes |

**Action 3: Toggle entry — disable light lore**

| Field | Value |
|-------|-------|
| Entry | Sunlit Meadow Lore |
| Enabled | No |

**Action 4: Send context (triggers AI reply)**

| Field | Value |
|-------|-------|
| Role | System |
| Message | `The player chose to enter the dark cave. Write a vivid, atmospheric opening scene for the Shadowmaw Cave. Describe the player stepping into the darkness, the temperature dropping, the last rays of sunlight fading behind them. End with something that draws the player deeper in. Do not mention route selection or give the player a choice — they have already chosen.` |

::: tip If you have character entries too
Add more toggle-entry actions: enable "Alicia — Hostile Mode", disable "Alicia — Friendly Mode". You can chain as many toggle-entry actions as you need in a single behavior.
:::

#### Behavior B: "Choose Light Route"

Same structure, but flipped:

| Field | Value |
|-------|-------|
| Name | Choose Light Route |
| WHEN | **Action button pressed** → Action ID: `choose-light` |

**DO:**

1. Modify variable: `current_route` → Set → `light`
2. Toggle entry: **Sunlit Meadow Lore** → Enabled: **Yes**
3. Toggle entry: **Dark Cave Lore** → Enabled: **No**
4. Send context: `The player chose to walk toward the sunlit meadow. Write a warm, beautiful opening scene for the Everbloom Meadow. Describe golden sunlight, wildflowers, a gentle breeze, and the feeling of stepping into a peaceful world. Do not mention route selection or give the player a choice — they have already chosen.`

---

### Step 4: Build the UI with buttons

Two options — pick whichever you're more comfortable with.

#### Option A: Let Studio AI write it for you

Editor → click **Enter Studio** → **AI Assistant** panel → paste this prompt:

```
Build a messageRenderer that shows route selection buttons.

Rules:
1. Always render the message text normally (use renderMarkdown).
2. ONLY when the variable current_route equals "none", show two large
   styled buttons below the message text:
   - "Enter the Dark Cave" — dark purple/indigo theme
   - "Walk to the Sunlit Meadow" — warm green/gold theme
3. Dark cave button: onClick → executeAction("choose-dark")
4. Meadow button: onClick → executeAction("choose-light")
5. When current_route is anything other than "none", just show the
   message text with no buttons.

My variables:
- current_route (string): "none" = hasn't chosen yet, "dark" or "light" = route chosen

Tech info:
- TSX, export default function Renderer({ content, renderMarkdown })
- useYumina() gives { variables, executeAction }
- Tailwind CSS works
```

Review the result in the Canvas preview. If you like it, click **Approve**. Done.

#### Option B: Write the code yourself

Editor → **Message Renderer** section → select **Custom TSX** → paste:

```tsx
export default function Renderer({ content, renderMarkdown }) {
  const { variables, executeAction } = useYumina();
  const route = variables.current_route;

  return (
    <div>
      {/* Message text */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* Route buttons — only before a route is chosen */}
      {route === "none" && (
        <div style={{
          display: "flex",
          gap: "12px",
          marginTop: "16px",
        }}>
          <button
            onClick={() => executeAction("choose-dark")}
            style={{
              flex: 1,
              padding: "16px",
              background: "linear-gradient(135deg, #1e1b4b, #312e81)",
              border: "1px solid #4338ca",
              borderRadius: "12px",
              color: "#c7d2fe",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "transform 0.15s",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Enter the Dark Cave
          </button>

          <button
            onClick={() => executeAction("choose-light")}
            style={{
              flex: 1,
              padding: "16px",
              background: "linear-gradient(135deg, #365314, #4d7c0f)",
              border: "1px solid #65a30d",
              borderRadius: "12px",
              color: "#ecfccb",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "transform 0.15s",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            Walk to the Sunlit Meadow
          </button>
        </div>
      )}
    </div>
  );
}
```

Check the bottom of the code box — if it shows **Compile Status: OK**, you're good.

---

### Step 5: Test it

1. **Save** the world
2. Start a **new session** (or click Preview)
3. You should see the greeting text with two route buttons below it
4. Click one — the AI should generate a brand new opening scene for that route
5. Send a few more messages — the AI's responses should be informed by the route-specific lore
6. Start another session, pick the other route — different lore, different vibe

**Troubleshooting:**

- **Buttons don't disappear after clicking?** Check that `current_route` is being set — look at the variable panel on the right side of the chat page.
- **AI doesn't use the right lore?** Check that the behavior's `toggle-entry` actions point to the correct entry names, and that the entries have `Always Send: Yes`.
- **AI doesn't generate a reply after clicking?** Make sure the behavior has a `send-context` action — that's what triggers the AI to respond.

---

## Why this works — the full trace

When the player clicks "Enter the Dark Cave," here's exactly what happens under the hood:

1. **Button click** → `executeAction("choose-dark")` fires on the client
2. **Client-side engine** scans all behaviors for trigger type `action` with ID `"choose-dark"`
3. **Behavior "Choose Dark Route"** matches → executes its DO actions in order:
   - `modify-variable`: sets `current_route` from `"none"` to `"dark"` in game state
   - `toggle-entry`: enables "Dark Cave Lore", disables "Sunlit Meadow Lore"
   - `send-context`: queues a hidden system message for the AI
4. **Context message triggers AI generation** → the full prompt is rebuilt with all currently enabled entries
5. **"Dark Cave Lore"** is now enabled + has `alwaysSend: true` → it's included in the prompt. **"Sunlit Meadow Lore"** is disabled → excluded.
6. **AI generates response** → it sees the dark cave lore and the context instruction → writes an atmospheric cave opening
7. **Player sees**: a new message with the cave scene. The route buttons are gone (because `current_route` is no longer `"none"`). The dark cave adventure begins.

Every subsequent message follows the same pattern: only the enabled entries are included in the prompt, so the AI stays on-theme automatically.

---

## Variations

### Mid-game scene jumping (not just the opening)

Same pattern, but the buttons live in a **sidebar panel** instead of disappearing after one use:

- Use a **customComponent** (Studio → Code View → Add Component) instead of a messageRenderer
- Keep the buttons always visible — the player can jump between scenes anytime
- Each behavior toggles the relevant entries and sends a context like: `"The player moved to [location]. Describe the transition and the new environment."`
- Adjust the button styling to highlight the currently active scene

### More than two routes

Scale it up:

- One `current_route` variable with more values: `"dark"`, `"light"`, `"neutral"`, `"secret"`
- One behavior per route, each with toggle-entry actions for every entry set (enable its own, disable all others)
- More buttons in the UI — or use `YUI.ChoiceButtons` for a clean layout:

```tsx
const routes = [
  { label: "Dark Cave", action: "choose-dark" },
  { label: "Sunlit Meadow", action: "choose-light" },
  { label: "Mountain Pass", action: "choose-neutral" },
];

// In your renderer:
{route === "none" && (
  <YUI.ChoiceButtons
    choices={routes.map(r => r.label)}
    onSelect={(choice) => {
      const r = routes.find(x => x.label === choice);
      if (r) executeAction(r.action);
    }}
    layout="vertical"
  />
)}
```

### Switching character behavior, not just lore

Create multiple versions of a character entry — one per route, all disabled by default. In each route's behavior, toggle-enable the matching character entry and toggle-disable the others. The AI sees a completely different character profile depending on which route is active.

### Adding sound effects & notifications

Extend your behaviors with more DO actions:

- **Play audio**: crossfade to a dark ambient track when entering the cave, or cheerful BGM for the meadow
- **Notify player**: pop a toast like "Chapter 1: Into the Darkness" with `achievement` style

These are just extra actions in the same behavior — add as many as you need.

---

## Quick reference

| What you want | How to do it |
|---------------|-------------|
| Button triggers a scene change | `executeAction("action-id")` in TSX → Behavior with `action` trigger |
| AI writes a new opening | Behavior DO: `send-context` with a scene description instruction |
| Enable/disable lore per scene | Behavior DO: `toggle-entry` → entry name → enabled/disabled |
| Character personality changes | Same — toggle different character entries per scene |
| Buttons disappear after choice | TSX: `{variable === "none" && <buttons/>}` |
| Buttons stay visible (sidebar) | Use a `customComponent` instead of `messageRenderer` |
| Sound on scene change | Behavior DO: `play-audio` → track ID → crossfade |
| Toast notification | Behavior DO: `notify-player` → message + style |

---

::: tip This is Recipe #1
More recipes coming soon — combat systems, shop interfaces, quest tracking, and more. Each recipe follows the same pattern: combine variables, entries, behaviors, and UI to build something greater than the sum of its parts.
:::
