# Studio Agent System — Complete Guide

How the AI studio assistant works, where it gets its knowledge, and how to make it smarter.

---

## Architecture Overview

When a user sends a message in the studio, the server builds a system prompt from multiple sources and sends it to the LLM alongside 24 tool definitions. The agent reads this prompt, decides what to do, and calls tools to make changes.

```
User message arrives
    ↓
Server builds system prompt:
    1. TOOL_CORE_PROMPT          ← Identity + behavior rules (hardcoded)
    2. 1-3 SKILL.md files        ← Domain knowledge (selected by keyword/panel)
    3. Template catalog summary  ← Available templates list
    4. World summary             ← Current world state (from client)
    5. Studio context            ← Active panel + selected entity
    ↓
Sent to LLM with 24 tool definitions (JSON Schema)
    ↓
LLM responds with text + tool calls
    ↓
Client executes tools against the editor store
```

## Where Everything Lives

| What | Location | When the agent sees it |
|------|----------|----------------------|
| Core identity + rules | `packages/server/src/lib/studio-tools/system-prompt.ts` | Every request |
| Domain knowledge | `packages/server/skills/<name>/SKILL.md` | When keyword/panel matches |
| Code/config templates | `packages/server/skills/<name>/templates/<id>/` | When agent calls list_templates or install_template |
| Template catalog index | `packages/server/skills/_catalog.json` | Every request (summary) |
| Tool definitions | `packages/server/src/lib/studio-tools/definitions.ts` | Every request (as function schemas) |
| World summary | `packages/app/src/features/studio/lib/world-summary.ts` | Every request (built from current editor state) |
| YUI component library | `packages/app/src/lib/yui/` | Available at runtime in compiled TSX (not in prompt) |
| Skill selection logic | `packages/server/src/lib/studio-skills/index.ts` | N/A (server-side routing) |

## How Skill Selection Works

Each request loads 1-3 skills based on two signals:

1. **Active panel** — Which studio panel is open (lorebook, variables, rules, canvas, code-view, audio)
2. **User message keywords** — Regex patterns match against the message text

| Skill | Loaded when panel is... | Or when message contains... |
|-------|------------------------|-----------------------------|
| entries | lorebook | character, entry, greeting, prompt, persona, npc |
| variables | variables | variable, stat, health, mana, gold, inventory, hp |
| rules | rules | rule, trigger, event, when, condition, directive |
| lore | lorebook | lore, worldbuild, canon, faction, kingdom, history |
| audio | audio | audio, music, bgm, sfx, sound, ambient |
| components | canvas, components | component, stat-bar, widget, image-panel, header |
| tsx | code-view | tsx, custom, renderer, react, interactive, visual |
| front-ui | canvas, code-view | hud, dashboard, layout, theme, blueprint, panel |

Maximum 3 skills per request. Default (nothing matched): entries.

The selection logic is in `packages/server/src/lib/studio-skills/index.ts` → `selectSkills()`. To add a new keyword trigger, add a regex pattern and update the routing logic.

## How to Make the Agent Smarter

### 1. Improve domain knowledge → Edit SKILL.md

Each `SKILL.md` is injected directly into the system prompt when its skill is selected. This is the agent's primary knowledge source.

**File:** `packages/server/skills/<name>/SKILL.md`

**Guidelines:**
- Keep under ~150 lines (the prompt has limited space — 3 skills may load at once)
- Use tables for quick lookup (role mapping, prop reference, etc.)
- Focus on decision-making: "when to use X vs Y", "what good X looks like"
- Include short inline examples where helpful
- Don't repeat what the tool definitions already say (parameter names, types)
- Test changes by chatting with the agent and checking if it follows the new guidance

**Example — adding character writing guidance to entries/SKILL.md:**
```markdown
### character
Include: personality traits (3-5), speech patterns, appearance summary,
backstory hooks, key relationships. Write in third person: "{{char}} is a..."
Avoid: walls of text. Each paragraph should cover one aspect.
Good: "Aria speaks in clipped military cadence, softening only around children."
Bad: "Aria is nice and talks normally."
```

### 2. Add detailed guides → templates/ folder with .md files

For content too long for SKILL.md (writing guides, best practices, design patterns), put them in the skill's templates/ folder as markdown files.

**Location:** `packages/server/skills/<name>/templates/<guide-id>/`

**Structure:**
```
skills/entries/templates/character-writing-guide/
├── meta.json      ← { "name": "Character Writing Guide", "surface": "pattern", "tags": ["writing", "character"] }
└── guide.md       ← Full guide content (can be longer — only loaded on demand)
```

These are NOT auto-injected into the prompt. The agent discovers them via `list_templates` and reads them when relevant. Register in `_catalog.json` so the agent knows they exist.

### 3. Add code/config templates → templates/ folder with .tsx/.json

Pre-built UI patterns the agent can reference or install directly.

**Location:** `packages/server/skills/<name>/templates/<template-id>/`

**Structure:**
```
skills/tsx/templates/game-hud-renderer/
├── meta.json       ← Metadata (name, description, tags, surface, requires)
└── renderer.tsx    ← TSX code (message renderer)
```

**Surface types and filenames:**
| Surface | Filename | What it installs as |
|---------|----------|-------------------|
| message-renderer | `renderer.tsx` | World's message renderer |
| custom-component | `component.tsx` | Full-screen custom component |
| ui-blueprint | `blueprint.json` | World's uiBlueprint |
| world | `template.json` | Merges entries/variables/rules/components |
| pattern | `renderer.tsx` or `guide.md` | Reusable pattern (greeting flow, etc.) |

**After creating the template:**
1. Add an entry to `packages/server/skills/_catalog.json`
2. The agent automatically sees it in the template catalog summary
3. The agent can install it via the `install_template` tool

See `packages/server/skills/GUIDELINES.md` for the full meta.json format spec.

### 4. Add YUI components → packages/app/src/lib/yui/

Pre-built React components available as `YUI.*` in all custom components and message renderers. These are app-level code (not skill files) — they ship with the build.

**To add a new component:**
1. Create `packages/app/src/lib/yui/<component-name>.tsx` with a named export
2. Add it to `packages/app/src/lib/yui/index.ts` in the YUI object
3. Document it in `packages/server/skills/tsx/SKILL.md` (the YUI Component Library section)

No other changes needed — it's automatically injected into the compiled TSX scope via the `new Function("React", "useYumina", "Icons", "YUI", ...)` call in `tsx-compiler.ts`.

See `packages/app/src/lib/yui/GUIDELINES.md` for component design rules.

### 5. Add new tools → definitions.ts + tool-executor.ts

If the agent needs a genuinely new capability (not just better knowledge), add a tool.

**Server side:** `packages/server/src/lib/studio-tools/definitions.ts`
- Add to `READ_TOOLS` (auto-execute) or `WRITE_TOOLS` (requires approval)
- Define name, description, and JSON Schema parameters

**Client side:** `packages/app/src/features/studio/lib/tool-executor.ts`
- Add handler in `executeReadTool()` or `executeWriteTool()`

**Client types:** `packages/app/src/features/studio/lib/types.ts`
- Add read tool names to `READ_TOOL_NAMES` set

### 6. Change core behavior → system-prompt.ts

The `TOOL_CORE_PROMPT` in `packages/server/src/lib/studio-tools/system-prompt.ts` defines the agent's identity, workflow (UNDERSTAND → PLAN → EXECUTE), and tool usage rules. Edit this to change fundamental behavior — not domain knowledge.

## Quick Reference: "I want to..."

| I want to... | Do this |
|--------------|---------|
| Teach the agent about a concept | Edit the relevant `SKILL.md` |
| Add a writing/design guide | Add a `.md` template in `skills/<name>/templates/` |
| Add a code template | Add a `.tsx`/`.json` template in `skills/<name>/templates/` |
| Add a reusable UI component | Add to `packages/app/src/lib/yui/` |
| Add a new agent tool | Add to `definitions.ts` + `tool-executor.ts` |
| Change how skills are selected | Edit `selectSkills()` in `studio-skills/index.ts` |
| Change the agent's core behavior | Edit `TOOL_CORE_PROMPT` in `system-prompt.ts` |
| Add a new skill category | Create `skills/<name>/SKILL.md`, add regex to `selectSkills()` |

## Size Guidelines

| Content type | Max size | Why |
|-------------|----------|-----|
| SKILL.md | ~150 lines | Injected into prompt, up to 3 at once. Keep concise. |
| TOOL_CORE_PROMPT | ~30 lines | Loaded on every single request. Must be tight. |
| Template .tsx/.json | No hard limit | Only loaded when agent reads/installs. Can be large. |
| Template guide .md | No hard limit | Only loaded on demand. Can be detailed. |
| _catalog.json entries | ~1 line each | Summary injected every request. Keep descriptions short. |

## Conversation Persistence

Studio conversations are saved per world in the `studio_conversations` database table. The UI has a conversation switcher (MessageSquare icon in the chat header):

- **Auto-load**: Most recent conversation loads when studio opens
- **Auto-save**: Saves 2 seconds after messages change
- **Auto-create**: First message creates a new conversation
- **Switch**: Click any conversation to load its history
- **Delete**: Hover to reveal delete button

The agent sees the full conversation history (messages, tool calls, results, proposals). This IS the agent's memory — no separate memory system needed.

## File Attachments

Users can attach files in the studio chat:

| File type | How it's handled |
|-----------|-----------------|
| Images (.png, .jpg, .webp, .gif) | Uploaded to S3, sent as multimodal content to LLM |
| Code files (.tsx, .jsx, .ts, .js, .json, .md, .txt, .html, .css) | Read client-side, injected as fenced code blocks in message text |

The agent is instructed to adapt attached code to Yumina format (strip imports, convert to Yumina TSX rules, wire up useYumina()).
