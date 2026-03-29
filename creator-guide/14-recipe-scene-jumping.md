# Scene Jumping & Entry Switching via UI

> Click a button → jump to a different pre-written opening. Type in a text box → change what an entry says to the AI. This recipe shows you both.

---

## Part 1: Switch between openings with a button

### What you'll build

A world with multiple pre-written opening scenes. The player sees the "main" opening first, with clickable buttons. When they click one, the chat instantly shows a different pre-written opening — no AI generation needed.

### How it works

Yumina already stores all your greeting entries as **swipes** on the first message. The new `switchGreeting(index)` API lets custom components jump to any of them:

```
Player clicks "Enter the Dark Cave"
  → api.switchGreeting(1)
  → First message switches to greeting #2 (index 1)
  → Game state restores to that greeting's snapshot
  → Player sees the pre-written dark cave opening instantly
```

### Step by step

#### Step 1: Create multiple greeting entries

Each greeting entry becomes one swipe on the first message. The first enabled greeting (by position order) is shown by default.

Editor → **Entries** section:

**Greeting 1 (Main — route selection):**

| Field | Value |
|-------|-------|
| Name | Main Opening |
| Tag | Greeting |
| Section | System Presets |
| Position | 0 |

Content:

```
*You wake up in a mysterious forest. Morning mist swirls between ancient trees.*

Two paths diverge before you:

**To the left** — a narrow trail into darkness. Cold air and distant echoes.

**To the right** — a sun-dappled path with wildflowers and birdsong.

Which way will you go?
```

**Greeting 2 (Dark cave opening):**

| Field | Value |
|-------|-------|
| Name | Dark Cave Opening |
| Tag | Greeting |
| Section | System Presets |
| Position | 1 |

Content:

```
*You step onto the left path. The canopy thickens overhead, swallowing the light. Within minutes, the trail narrows to a crack in a rock face — the entrance to a cave.*

*Cold air rushes out, carrying the smell of damp stone and something metallic. Faint blue-green light flickers deep inside — bioluminescent fungi clinging to the walls.*

*You take a breath and step in. Behind you, the last sliver of daylight shrinks to a pale line, then vanishes.*

You are alone in the dark.
```

**Greeting 3 (Sunlit meadow opening):**

| Field | Value |
|-------|-------|
| Name | Meadow Opening |
| Tag | Greeting |
| Section | System Presets |
| Position | 2 |

Content:

```
*You choose the right path. The trees thin out, and warm sunlight floods through the canopy. Within minutes, the forest opens into a vast meadow stretching to the horizon.*

*Wildflowers in every color sway gently in the breeze. A stream glitters in the distance. Somewhere nearby, a bird sings a melody you've never heard before.*

*You feel the tension in your shoulders melt away. Whatever this place is, it feels safe.*

Welcome to the Everbloom Meadow.
```

::: info Greeting order matters
Greetings are ordered by their **Position** field. Position 0 = shown first (index 0), Position 1 = second greeting (index 1), and so on. The index you pass to `switchGreeting()` matches this order.
:::

#### Step 2: Build the UI with buttons

Editor → **Message Renderer** section → select **Custom TSX** → paste:

```tsx
export default function Renderer({ content, renderMarkdown, messageIndex }) {
  const { switchGreeting } = useYumina();

  return (
    <div>
      {/* Message text */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* Route buttons — only on the first message */}
      {messageIndex === 0 && (
        <div style={{
          display: "flex",
          gap: "12px",
          marginTop: "16px",
        }}>
          <button
            onClick={() => switchGreeting(1)}
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
            onClick={() => switchGreeting(2)}
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

::: tip Using Studio AI instead
Paste this prompt in the Studio AI Assistant:

```
Build a messageRenderer. On the first message only (messageIndex === 0),
show two buttons below the text:
- "Enter the Dark Cave" (dark purple) → switchGreeting(1)
- "Walk to the Sunlit Meadow" (warm green) → switchGreeting(2)
Always render message text normally with renderMarkdown.
Tech: useYumina() has switchGreeting, supports Tailwind.
```
:::

#### Step 3: Test it

1. **Save** the world
2. Start a **new session**
3. You see the main opening with two buttons
4. Click one — the first message **instantly** changes to the pre-written cave or meadow opening
5. The buttons are still visible (because it's still `messageIndex === 0`). You can click the other one to switch again, or start chatting.

::: tip Want buttons to disappear after choosing?
Track the choice in a variable. Add a `current_route` string variable (default `"none"`), and in a behavior triggered by `state-change`, check when it's no longer `"none"`. Or simply check in TSX:

```tsx
// In the renderer, use a variable to hide buttons after first switch
const { variables, switchGreeting, setVariable } = useYumina();
const hasChosen = variables.current_route !== "none";

// Button onClick:
onClick={() => {
  setVariable("current_route", "dark");
  switchGreeting(1);
}}

// Conditional rendering:
{messageIndex === 0 && !hasChosen && ( <buttons.../> )}
```
:::

---

## Part 2: Player input modifies entry content

### What you'll build

A text input in the UI where the player types something (e.g., a character name, a custom setting, a story instruction), and that text gets injected into an entry — changing what the AI reads.

### How it works

Entries support **macro syntax**: `{{variableId}}` gets replaced with the variable's current value before being sent to the AI. So:

1. Create a string variable (e.g., `custom_setting`)
2. Write `{{custom_setting}}` in an entry's content
3. Player types in a text box → `setVariable("custom_setting", "their input")`
4. From the next message on, the entry includes the player's text

```
Entry content: "The world has a special rule: {{custom_rule}}"
Player types: "Magic is forbidden"
AI receives: "The world has a special rule: Magic is forbidden"
```

### Step by step

#### Step 1: Create a string variable

Editor → **Variables** → **Add Variable**

| Field | Value |
|-------|-------|
| Name | Custom Rule |
| ID | `custom_rule` |
| Type | String |
| Default Value | `No special rules.` |
| Behavior Rules | `Do not modify this variable. It is set by the player.` |

#### Step 2: Reference it in an entry

Editor → **Entries** → edit or create a lore entry:

| Field | Value |
|-------|-------|
| Name | World Rules |
| Tag | Lore |
| Section | System Presets |
| Always Send | Yes |

Content:

```
[World Rules]
The following rule is in effect for this world and must be respected at all times:
{{custom_rule}}
```

When `custom_rule` is `"No special rules."`, the AI sees the default. When the player changes it, the AI sees their input.

#### Step 3: Add an input UI

In a **messageRenderer** or **customComponent**, add a text input:

```tsx
export default function Component() {
  const { variables, setVariable } = useYumina();
  const [inputValue, setInputValue] = React.useState("");
  const currentRule = variables.custom_rule || "No special rules.";

  return (
    <YUI.Panel title="World Rules">
      <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "8px" }}>
        Current rule: {String(currentRule)}
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a new rule..."
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e2e8f0",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <YUI.ActionButton
          onClick={() => {
            if (inputValue.trim()) {
              setVariable("custom_rule", inputValue.trim());
              setInputValue("");
            }
          }}
        >
          Apply
        </YUI.ActionButton>
      </div>
    </YUI.Panel>
  );
}
```

#### Step 4: Test it

1. Start a session — the AI follows "No special rules."
2. Type "Magic is forbidden" in the input box and click Apply
3. Send a message — the AI now respects the rule "Magic is forbidden"
4. Change it again — the AI adapts immediately

---

## Combining both patterns

You can combine greeting switching with entry modification. For example:

- **Main greeting** shows a character creation form (name, class, backstory input boxes)
- Player fills it in → variables get set → entries with `{{player_name}}`, `{{player_class}}`, `{{player_backstory}}` macros pick up the values
- Player clicks "Start Adventure" → `switchGreeting(1)` jumps to the actual story opening
- The AI now knows the player's custom character details

---

## Quick reference

| What you want | How to do it |
|---------------|-------------|
| Jump to a pre-written opening | `switchGreeting(index)` — index matches greeting position order (0-based) |
| Let player modify entry content | Variable + `{{variableId}}` macro in entry content + `setVariable()` from UI |
| Show buttons only on first message | `{messageIndex === 0 && <buttons/>}` |
| Hide buttons after choice | Track choice in a variable, check it in TSX |
| Combine with lore switching | Add behaviors with `toggle-entry` actions alongside greeting switching |
| Add sound/notification on switch | Add behaviors triggered by variable change with `play-audio` / `notify-player` |

---

## Try it yourself — importable demo world

Download this JSON and import it as a new world to see everything in action:

<a href="/recipe-1-demo.json" download>recipe-1-demo.json</a>

**How to import:**
1. Go to Yumina → **My Worlds** → **Create New World**
2. In the editor, click **Import** (or the upload icon)
3. Select the downloaded `.json` file
4. A new world is created with all entries, variables, behaviors, renderer, and component pre-configured
5. Start a new session and try it out

**What's included:**
- 3 greeting entries (main opening + dark cave + meadow)
- 2 variables (`current_route` for route tracking, `custom_rule` for player-editable rules)
- 2 action behaviors (toggle lore entries when route is chosen)
- A messageRenderer with route selection buttons
- A customComponent sidebar panel for editing the world rule
- A lore entry using `{{custom_rule}}` macro

---

::: tip This is Recipe #1
More recipes coming soon — combat systems, shop interfaces, quest tracking, and more. Each recipe combines variables, entries, behaviors, and UI to build something greater than the sum of its parts.
:::
