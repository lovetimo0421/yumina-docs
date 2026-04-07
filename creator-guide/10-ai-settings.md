<div v-pre>

# AI Model & Settings

> WorldSettings are your "job description" for the AI — they determine how long it replies, how creative it gets, and how much it remembers.

---

## The short version

These settings control how the AI responds. Think of it as a mixing board for the AI — each knob shapes the flavor of its output. Honestly though, **in most cases the defaults work great and you don't need to change anything.**

If you must tinker, start with two knobs:

**temperature (creativity)** — the AI's "adventurous spirit":

- `0` = stiff and precise; give it the same input twice and you get the same reply. Great for calculators, not for storytelling.
- `1.0` = default value, normal performance — creative but not incoherent.
- `2.0` = wildly imaginative, might produce brilliant metaphors or total gibberish.

**Recommended range: 0.7–1.0**. Bump it up for literary worlds, dial it down for strict mechanic-heavy games.

**maxTokens (reply length limit)** — maximum tokens the AI can use in a single reply. 1 token is roughly 1 Chinese character or half an English word. Default `12000` — equivalent to 6,000–8,000 English words, enough for a short story. If the AI is too wordy, cut it to 4,000–6,000. If your world needs very long narratives (like multi-character ensemble scenes), keep the default.

**playerName (player name)** — defaults to "User." Change it and all `{{user}}` macros in the prompt are replaced with whatever you set. E.g. set it to "Traveler" and the AI will call the player "Traveler."

Just those three cover 90% of situations. Run a few test sessions, find a specific issue (like "the AI is too long-winded" or "it keeps repeating itself"), then come back and read the detailed version.

---

## The detailed version

Everything in `WorldSettings`, organized by function. Marked "optional" means you don't have to set it — the engine will use default values or just not pass it to the AI.

### Core generation parameters

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `maxTokens` | integer | `12000` | positive integer | Max tokens for a single AI reply. Like telling the AI "write at most this much" |
| `maxContext` | integer | `200000` | positive integer | Context window size. When chat history exceeds this length, the engine trims oldest messages. 200K tokens is more than enough for most models — don't change unless you're using a small-window model (like 8K) |

### Sampling parameters

These together determine how the AI "picks its next word." Imagine the AI generating text by drawing colored balls from a bag — these parameters control how many balls go in and how they're drawn.

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `temperature` | float | `1.0` | `0.0 - 2.0` | Creativity knob. Higher = more random/creative, lower = more stable/predictable |
| `topP` | float | optional | `0.0 - 1.0` | Nucleus sampling. Only sample from the top P% of candidate tokens by probability. E.g. `0.9` = only look at the 90% most likely candidates, cutting the long tail. Complements temperature — one controls "how random," the other controls "how big the candidate pool is." **Changing just one is usually enough; aggressively adjusting both can cause problems** |
| `topK` | integer | optional | >=0 | Directly limits the number of candidate tokens. E.g. `topK=50` = "only pick from the 50 most likely words." Not all models support this parameter |
| `minP` | float | optional | `0.0 - 1.0` | Minimum probability threshold. Candidate tokens below this are discarded. E.g. `minP=0.05` = "don't consider anything with less than 5% probability." Smarter than topK — scales with the AI's confidence level: smaller candidate pool when AI is confident, larger when uncertain |
| `frequencyPenalty` | float | optional | `-2.0 - 2.0` | Frequency penalty. Positive values reduce word repetition — words already used get downweighted, more so the more they've been used. If the AI is stuck in a rut repeating itself, try `0.3–0.5` |
| `presencePenalty` | float | optional | `-2.0 - 2.0` | Presence penalty. Positive values encourage introducing new topics — any word that has appeared at all gets uniformly downweighted. Difference from frequency: frequency looks at "how many times," presence just looks at "whether it appeared" |

### Player & lorebook

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `playerName` | string | `"User"` | any | Player name. `{{user}}` macros in the prompt are replaced with this |
| `lorebookScanDepth` | integer | `2` | positive integer | How many recent messages to scan for lorebook keyword matching. Default 2 = only the last 2 messages. Increase for deeper context triggering, but too high adds matching overhead. Modifiable in the editor under **Lorebook → Entry Settings** |
| `lorebookRecursionDepth` | integer | `0` | `0 - 10` | Lorebook recursive trigger depth. `0` = no recursion, single-pass keyword matching. Set to `2` and triggered entries' content gets scanned for keywords again, up to 2 layers deep. Good for complex interconnected lore, but watch out: deep recursion can eat through your token budget. Modifiable in **Lorebook → Entry Settings** |
| ~~`lorebookBudgetPercent`~~ | float | `100` | `0 - 100` | **Deprecated.** Percentage of context that lorebook can use. Still functional on the server but not exposed in the editor UI and may be removed in a future version |
| ~~`lorebookBudgetCap`~~ | integer | `0` | >=0 | **Deprecated.** Hard token cap for lorebook. Still functional on the server but not exposed in the editor UI and may be removed in a future version |

::: warning Deprecated settings
`lorebookBudgetPercent` and `lorebookBudgetCap` are deprecated and not exposed in the editor UI. The server still respects them if set in the world JSON, but they may be removed in a future version. For new worlds, leave these at their defaults (unlimited).
:::

### UI & output control

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `structuredOutput` | boolean | `false` | When `true`, forces the AI to reply in JSON format via `response_format: { type: "json_object" }`. For mechanic-heavy worlds that need to strictly parse AI output. Note: with this on, AI replies are JSON objects, not natural language |

### Player-level settings

These settings are configured by each player in their own profile, not by the world creator. They apply globally across all worlds.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `reasoningEffort` | string | `"low"` | Controls thinking depth for reasoning-capable models (e.g. Claude). Options: `"none"`, `"low"`, `"medium"`, `"high"`. Higher values make the AI think more carefully but cost more tokens. Players can change this in **Settings → AI Config** |

::: warning Advanced setting
`structuredOutput` is not currently exposed in the editor UI. To enable JSON mode, you need to export the world JSON, manually add `"structuredOutput": true` to the `settings` object, and re-import. This is an advanced creator feature — most worlds don't need it.
:::

---

## Practical examples

### Example 1: Recommended default config (works for most worlds)

Change nothing, just use defaults:

```json
{
  "maxTokens": 12000,
  "maxContext": 200000,
  "temperature": 1.0,
  "playerName": "User",
  "lorebookScanDepth": 2,
  "lorebookRecursionDepth": 0
}
```

This is the "ready to go" config. Temperature 1.0 is neither stiff nor crazy. maxTokens 12000 supports long replies. Lorebook scans the last 2 messages. For daily RP, story interaction, and character roleplay, this is perfectly fine. You don't even need to write this JSON — not setting anything gives you exactly these defaults.

### Example 2: Serious strategy game (low randomness, high precision)

You're building a wargame/strategy world and need the AI to strictly follow rules without going off-script:

```json
{
  "temperature": 0.5,
  "topP": 0.9,
  "frequencyPenalty": 0.2,
  "maxTokens": 6000,
  "playerName": "Commander"
}
```

Temperature down to 0.5 makes the AI "obedient" — no surprise lyrical tangents. topP 0.9 further narrows word selection. maxTokens cut to 6000 because strategy game replies don't need to be long — concise situation reports beat lengthy literary descriptions. Mild frequencyPenalty prevents the AI from repeating the same tactical analysis.

### Example 3: Creative writing / literary style (high creativity, encourage novelty)

You're building a poetic exploration world, wanting vivid, imaginative AI prose:

```json
{
  "temperature": 1.2,
  "presencePenalty": 0.3,
  "frequencyPenalty": 0.4,
  "maxTokens": 12000,
  "playerName": "Traveler"
}
```

Temperature up to 1.2 gives the AI more "inspiration" (don't go over 1.5 or it starts rambling). presencePenalty 0.3 encourages the AI to introduce new topics and imagery rather than circling the same thing. frequencyPenalty 0.4 reduces word repetition for richer vocabulary. With this config, the AI will write more literary replies — but it might occasionally "try too hard." That's the price of creativity.

---

**One last word of advice:** if you're not sure what to change, don't change anything. The defaults are well-balanced and suit the vast majority of worlds. Once you've run a few test sessions and identified a specific problem, make one or two targeted adjustments rather than changing everything at once.

</div>
