<div v-pre>

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
  const api = useYumina();
  const hasChosen = api.variables.current_route !== "none";

  return (
    <div>
      {/* Message text */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* Route buttons — only on first message, before choosing */}
      {messageIndex === 0 && !hasChosen && (
        <div style={{
          display: "flex",
          gap: "12px",
          marginTop: "16px",
        }}>
          <button
            onClick={() => {
              api.setVariable("current_route", "dark");
              api.executeAction("choose-dark");
              api.switchGreeting?.(1);
            }}
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
            onClick={() => {
              api.setVariable("current_route", "light");
              api.executeAction("choose-light");
              api.switchGreeting?.(2);
            }}
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

Entries support **macro syntax**: `{{variableId}}` is a placeholder. Every time the engine builds the prompt (i.e., every time the player sends a message), it replaces the placeholder with the variable's current value.

Key timing: **the replacement happens when the prompt is built** — not the instant the variable changes. The AI sees the new content on the **next message**, not immediately.

Full flow:

```
1. Entry content says: "Special rule: {{custom_rule}}"
2. Variable custom_rule = "All magic is allowed"
3. Player sends message → engine builds prompt → replaces macro
   → AI receives "Special rule: All magic is allowed"

4. Player types "Magic is forbidden" in the UI input box
5. setVariable("custom_rule", "Magic is forbidden") → variable updated
6. AI doesn't know yet. The entry still says {{custom_rule}}, only the variable changed.

7. Player sends another message → engine rebuilds prompt → replaces macro
   → AI receives "Special rule: Magic is forbidden"
8. From this message on, AI follows the new rule.
```

In short: **changing the variable is instant, but the AI sees the change on the next message**.

### Step by step

#### Step 1: Create a string variable

Editor → **Variables** → **Add Variable**

| Field | Value |
|-------|-------|
| Name | Custom Rule |
| ID | `custom_rule` |
| Type | String |
| Default Value | *(leave empty, or set a default like `All magic is allowed`)* |
| Behavior Rules | `Do not modify this variable. It is set by the player.` |

#### Step 2: Use `{{custom_rule}}` as a placeholder in an entry

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

Every time the engine builds the prompt, it replaces `{{custom_rule}}` with the variable's current value. If the variable is empty, that line is blank. If the variable is "Magic is forbidden", the AI sees "The following rule is in effect... Magic is forbidden".

#### Step 3: Add an input UI in the messageRenderer

Since `customComponent` panels only display in fullscreen mode, the input box needs to go inside the **messageRenderer**. To avoid repeating it on every message, only show it on the **last message**.

Add this to your messageRenderer TSX (after the message text rendering):

```tsx
// Inside your Renderer function, get what you need from useYumina()
const api = useYumina();
const msgs = api.messages || [];
const isLastMsg = messageIndex === msgs.length - 1;
const [ruleInput, setRuleInput] = React.useState("");
const currentRule = String(api.variables.custom_rule || "");

// In the returned JSX, below the message text:
{isLastMsg && (
  <div style={{
    marginTop: "12px",
    padding: "12px",
    background: "rgba(30,41,59,0.5)",
    borderRadius: "8px",
    border: "1px solid #334155",
  }}>
    <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
      World Rule: {currentRule || "(not set)"}
    </div>
    <div style={{ display: "flex", gap: "8px" }}>
      <input
        type="text"
        value={ruleInput}
        onChange={(e) => setRuleInput(e.target.value)}
        placeholder="Type a new rule..."
        style={{
          flex: 1,
          padding: "6px 10px",
          background: "#1e293b",
          border: "1px solid #475569",
          borderRadius: "6px",
          color: "#e2e8f0",
          fontSize: "13px",
          outline: "none",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && ruleInput.trim()) {
            api.setVariable("custom_rule", ruleInput.trim());
            setRuleInput("");
          }
        }}
      />
      <button
        onClick={() => {
          if (ruleInput.trim()) {
            api.setVariable("custom_rule", ruleInput.trim());
            setRuleInput("");
            }
          }}
          style={{
            padding: "6px 14px",
            background: "#4338ca",
            borderRadius: "6px",
            color: "#e0e7ff",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            border: "none",
          }}
        >
          Apply
        </button>
      </div>
    </div>
  </div>
)}
```

::: info Why messageRenderer, not customComponent?
In the current version of Yumina, `customComponent` panels only render in fullscreen mode (`fullScreenComponent: true`). In normal chat mode they don't show. So if you want interactive elements (buttons, inputs) in the chat interface, put them in the `messageRenderer`.
:::

#### Step 4: Test it

1. Start a session — if no default value was set, the rule shows "(not set)"
2. Type "Magic is forbidden" in the input box and click Apply (or press Enter)
3. The variable updates instantly — the "World Rule" label shows your input
4. **Send a message** — now the engine rebuilds the prompt, replacing `{{custom_rule}}` with "Magic is forbidden"
5. The AI's response follows the new rule
6. Change it again → send another message → the AI adapts

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
- A messageRenderer with route selection buttons + rule editor
- A lore entry using `{{custom_rule}}` macro

---

::: tip This is Recipe #1
More recipes coming soon — combat systems, shop interfaces, quest tracking, and more. Each recipe combines variables, entries, behaviors, and UI to build something greater than the sum of its parts.
:::

</div>
