# Audio

> Give your world something to listen to — background music, sound effects, ambient audio. Let players not just read the story, but feel like they're inside it.

---

## The short version

Audio amplifies immersion. Imagine the player walking into an ancient castle: no matter how good the writing is, without the sound of wind and a distant bell, something always feels missing. Yumina's audio system is here to fill that gap.

**Three audio types:**

- **BGM (background music)** — continuously playing music, like an exploration melody or intense battle soundtrack
- **SFX (sound effects)** — short one-shot audio, like a door opening, an explosion, or an item pickup chime
- **Ambient** — looping atmosphere audio, like rain, birdsong in a forest, or bustling tavern noise

**Getting started fast:** upload a BGM audio file, set `loop` to `true`, turn `autoPlay` on in the playlist — done. Players enter your world and music starts automatically.

**Want to go further?** You can:
- Set up "conditional BGM" — automatically switch tracks when a variable meets a condition (e.g., switch to battle music when entering a combat zone)
- Let the AI trigger sound effects in narration — when the AI writes "the door slammed open," it can tack on an audio directive and the player hears the bang

The audio system's design philosophy: simple things in one step, complex things unlocked layer by layer. You don't need to understand every field from the start — learn what you need when you need it.

---

## The detailed version

### AudioTrack (audio track)

Every audio resource in the system is an AudioTrack — think of it as a registration card for "one song" or "one sound effect."

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier — AI directives and rules reference this. E.g. `battle_bgm`, `door_slam` |
| `name` | string | Yes | Display name for your own reference. E.g. "Battle Theme" |
| `type` | `"bgm"` / `"sfx"` / `"ambient"` | Yes | Audio type. Determines playback behavior |
| `url` | string | Yes | URL of the audio file |
| `loop` | boolean | No | Whether to loop. Usually `true` for BGM and Ambient, usually not needed for SFX |
| `volume` | number (0-1) | No | Volume level. `1` is maximum, `0.5` is half, `0` is silent. Defaults to full volume |
| `fadeIn` | number (seconds) | No | Fade-in duration. E.g. `2` means slowly rising over 2 seconds |
| `fadeOut` | number (seconds) | No | Fade-out duration. When stopped, it gradually fades rather than cutting abruptly |
| `maxDuration` | number (seconds) | No | Maximum playback duration. Stops automatically after this time (with fade-out). Good for "just need a short clip" scenarios |

A world can register multiple AudioTracks, all stored in the `audioTracks` array in the world definition.

---

### BGMPlaylist (BGM playlist)

If you have several BGM tracks and don't want to just loop one forever, use a playlist to chain them together. Think of it as a "music box" — you put a few records in and tell it how to play.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tracks` | string[] | `[]` | Array of track IDs referencing `audioTracks`. Plays in array order |
| `playMode` | `"loop"` / `"shuffle"` / `"sequential"` | `"loop"` | **loop**: restart from beginning when list ends; **shuffle**: play in random order; **sequential**: play all tracks in order, then repeat from the beginning |
| `autoPlay` | boolean | `true` | Whether to start playing automatically when entering the world |
| `waitForFirstMessage` | boolean | `false` | When `true`, doesn't start playing immediately — waits until the player sends their first message. Good for worlds with an opening cutscene or character creation flow |
| `gapSeconds` | number (0-30) | `0` | Silence between tracks in seconds. A value of `2` creates a brief pause between songs, giving a "changing records" feel |

Each world has only one `bgmPlaylist` (optional). If you have one BGM with `loop: true`, you don't actually need a playlist — you can control it with conditional BGM or AI directives instead.

---

### ConditionalBGM (conditional BGM)

This is the most interesting part of the audio system — making music follow the story. Imagine playing an RPG: walking into a tavern plays cheerful accordion, entering a dungeon shifts to eerie low strings, meeting the Boss suddenly switches to soaring orchestral music. Conditional BGM is how you achieve this.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | — | Unique identifier |
| `name` | string | — | Display name for easy management |
| `triggerType` | see below | `"variable"` | What triggers this |
| `conditions` | Condition[] | `[]` | Variable condition array (used when triggerType is `variable`) |
| `conditionLogic` | `"all"` / `"any"` | `"all"` | Logic for conditions. `all` = all must pass, `any` = any one suffices |
| `keywords` | string[] | — | Keyword list (used when triggerType is `keyword` or `ai-keyword`) |
| `matchWholeWords` | boolean | — | Whole-word matching |
| `atTurn` | number | — | Which turn to trigger at (used when triggerType is `turn-count`) |
| `everyNTurns` | number | — | Trigger every N turns |
| `targetTrackId` | string | — | Which track to play when triggered |
| `priority` | number | `0` | Higher numbers take precedence when multiple conditions are met simultaneously |
| `fadeInDuration` | number (seconds) | `1` | Fade-in duration for new track |
| `fadeOutDuration` | number (seconds) | `1` | Fade-out duration for old track |
| `stopPreviousBGM` | boolean | `true` | Whether to stop the currently playing BGM. Usually keep `true`, unless you want to layer multiple music tracks |
| `fallback` | string | `"default"` | What to do when condition is no longer met: `"default"` returns to the playlist default, `"previous"` returns to the previous track, or specify a trackId |

**Five trigger types (`triggerType`):**

| Value | When it triggers | Typical use |
|-------|-----------------|-------------|
| `variable` | When game variables meet specified conditions | Switch to battle music when `location == "battle_arena"` |
| `ai-keyword` | When AI reply contains specified keywords | Switch music when AI mentions "battle begins" |
| `keyword` | When player message contains specified keywords | Trigger music when player says "play" |
| `turn-count` | When reaching a specified turn count | Switch to tense countdown music at turn 10 |
| `session-start` | When a session starts | Play a fixed opening track every time |

---

### AI audio directives

The AI doesn't just write text — it can also embed audio directives in its replies. These are invisible to the player (the engine strips them automatically), but they trigger corresponding audio effects. Like stage directions in a screenplay — the audience doesn't see them, but the crew follows them.

The directive format is `[audio: trackId action]`, consistent with variable directives like `[health: -10]`.

**Supported directives:**

| Directive | Description |
|-----------|-------------|
| `[audio: trackId play]` | Play the specified track |
| `[audio: trackId stop]` | Stop playback |
| `[audio: trackId crossfade 0.8]` | Crossfade to this track over 0.8 seconds |
| `[audio: trackId volume 0.5]` | Set volume to 0.5 without stopping |
| `[audio: trackId play chain:nextTrackId]` | Play this track, then automatically play the next. E.g. play a battle intro SFX and automatically transition to battle BGM |

::: tip Fade-in and fade-out for play/stop
AI directives don't support fade-in/fade-out parameters for `play` and `stop`. To get fade effects, configure `fadeIn` and `fadeOut` directly on the AudioTrack definition, or use `crossfade` to transition between tracks.
:::

These can be mixed with state change directives. The AI might write:

```
A rumbling echoes from deep in the dungeon, and the ground begins to shake. [audio: earthquake play] You take damage from falling debris. [health: -5] Fear spreads through your heart. [fear: +10] The ambient sound grows more oppressive. [audio: ambient volume 0.3]
```

The player sees only clean narrative text, but simultaneously hears the earthquake sound effect, feels the stat changes, and senses the ambient volume dropping.

**The rules engine can also trigger audio.** In a Rule's actions, there's an action type called `play-audio` with the same fields as AudioEffect (`trackId`, `action`, `volume`, `fadeDuration`). This means you can control music entirely through the rules engine — without involving the AI at all. For example, "play crisis music when hp drops below 20."

---

## Practical examples

### Example 1: The simplest looping BGM

You have one background track and want it playing from start to finish.

**AudioTrack config:**
```json
{
  "id": "main_theme",
  "name": "Main Theme",
  "type": "bgm",
  "url": "https://example.com/main-theme.mp3",
  "loop": true,
  "volume": 0.7,
  "fadeIn": 2
}
```

**BGMPlaylist config:**
```json
{
  "tracks": ["main_theme"],
  "playMode": "loop",
  "autoPlay": true
}
```

That's all — players enter the world and hear music.

---

### Example 2: Combat track switch

Exploration plays a relaxed track; entering a combat zone automatically switches to tense battle music, and switches back when leaving.

**Two AudioTracks:**
```json
[
  { "id": "explore_bgm", "name": "Exploration", "type": "bgm", "url": "...", "loop": true },
  { "id": "battle_bgm", "name": "Battle", "type": "bgm", "url": "...", "loop": true }
]
```

**BGMPlaylist (default exploration track):**
```json
{
  "tracks": ["explore_bgm"],
  "playMode": "loop",
  "autoPlay": true
}
```

**ConditionalBGM (switch on entering combat zone):**
```json
{
  "id": "battle_music_trigger",
  "name": "Battle music trigger",
  "triggerType": "variable",
  "conditions": [
    { "variableId": "location", "operator": "eq", "value": "battle_arena" }
  ],
  "targetTrackId": "battle_bgm",
  "priority": 10,
  "fadeInDuration": 0.5,
  "fadeOutDuration": 0.5,
  "stopPreviousBGM": true,
  "fallback": "default"
}
```

When `location` becomes `"battle_arena"`, the exploration track fades out over 0.5 seconds and the battle track fades in over 0.5 seconds. When `location` changes to something else (condition no longer met), `fallback: "default"` automatically returns to the playlist's exploration track.

---

### Example 3: AI-triggered sound effect

Let the AI naturally trigger sound effects in narration. For example, a "door slammed open" scene.

**Register an SFX:**
```json
{
  "id": "door_slam",
  "name": "Door Slam",
  "type": "sfx",
  "url": "https://example.com/door-slam.mp3",
  "loop": false,
  "volume": 0.9
}
```

The AI's reply might look like:

```
Heavy footsteps echo from the end of the corridor, getting closer. Then—
BANG! The door flies open! [audio: door_slam play]
An armored figure appears in the doorway.
```

The player sees clean narration (no `[audio: ...]` part) and simultaneously hears the door slam.

---

### Example 4: SFX chained to BGM (chain usage)

Play a war horn SFX when battle starts, then seamlessly transition to battle BGM when the horn ends.

```
The war horn echoes through the valley — the enemy approaches! [audio: war_horn play chain:battle_bgm]
```

`chain:battle_bgm` means: when `war_horn` finishes playing, automatically start `battle_bgm`. This is smoother than writing two separate directives because the transition is seamless.

---

### Example 5: Rules engine audio control (no AI involvement)

If you don't want to leave audio control up to the AI (which sometimes forgets directives), configure it directly in the rules system.

**Rule config:**
```json
{
  "id": "low_hp_music",
  "name": "Low health crisis music",
  "trigger": {
    "type": "variable-crossed",
    "variableId": "hp",
    "direction": "drops-below",
    "threshold": 20
  },
  "actions": [
    {
      "type": "play-audio",
      "trackId": "crisis_bgm",
      "action": "crossfade",
      "fadeDuration": 1.5
    }
  ],
  "priority": 20
}
```

When `hp` drops from above 20 to below 20, the system automatically crossfades to crisis music over 1.5 seconds. Pure mechanical trigger — the AI doesn't need to do anything.
