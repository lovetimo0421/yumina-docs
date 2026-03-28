# 音频系统

> 给你的世界加上耳朵能听到的东西——背景音乐、音效、环境音，让玩家不只是在"看"故事，而是"身处"故事里。

---

## 简单版

音频是沉浸感的放大器。想象一下：玩家走进一座古堡，文字再好，如果耳边没有风声和远处的钟鸣，总感觉差点意思。Yumina 的音频系统就是来补上这块拼图的。

**三种音频类型：**

- **BGM（背景音乐）**——持续播放的音乐，比如探索时的悠扬旋律、战斗时的紧张节奏
- **SFX（音效）**——一次性的短音频，比如开门声、爆炸声、获得物品的叮咚声
- **Ambient（环境音）**——循环的氛围音，比如雨声、森林鸟叫、酒馆里的嘈杂人声

**最快上手：** 上传一首 BGM 音频文件，把 `loop` 设成 `true`，把播放列表的 `autoPlay` 打开——搞定。玩家一进入你的世界，音乐就自动响起来了。

**想更进一步？** 你可以：
- 设置"条件 BGM"——当某个变量满足条件时自动切歌（比如进入战斗区域自动换战斗曲）
- 让 AI 在叙述中触发音效——AI 写"门被猛地撞开"的时候，顺手带一条音频指令，玩家就能听到撞门声

音频系统的设计哲学是：简单的事情一步到位，复杂的事情分层解锁。你不需要一开始就搞懂所有字段，用到再学完全来得及。

---

## 详细版

### AudioTrack（音频轨道）

每一条音频资源在系统里就是一个 AudioTrack，你可以把它理解为"一首歌"或"一段音效"的登记卡。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一标识符，AI 指令和规则里都用这个来引用它。比如 `battle_bgm`、`door_slam` |
| `name` | string | 是 | 显示名称，给你自己看的。比如"战斗主题曲" |
| `type` | `"bgm"` / `"sfx"` / `"ambient"` | 是 | 音频类型。决定了它在播放时的行为逻辑 |
| `url` | string | 是 | 音频文件的 URL 地址 |
| `loop` | boolean | 否 | 是否循环播放。BGM 和 Ambient 通常设为 `true`，SFX 通常不需要 |
| `volume` | number (0-1) | 否 | 音量大小。`1` 是最大声，`0.5` 是一半，`0` 是静音。不填默认满音量 |
| `fadeIn` | number (秒) | 否 | 淡入时长，单位秒。比如 `2` 就是 2 秒渐渐响起来 |
| `fadeOut` | number (秒) | 否 | 淡出时长，单位秒。停止播放时不会突然断掉，而是慢慢消失 |
| `maxDuration` | number (秒) | 否 | 最大播放时长。到时间后自动停止（带淡出）。适合那种"播一小段就够了"的场景 |

一个世界可以注册多条 AudioTrack，它们都存在世界定义的 `audioTracks` 数组里。

---

### BGMPlaylist（BGM 播放列表）

如果你有好几首 BGM，不想只循环一首，可以用播放列表把它们串起来。把它想象成一个"音乐盒"——你放几张碟进去，告诉它怎么播就行。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tracks` | string[] | `[]` | 曲目 ID 数组，引用 `audioTracks` 里的 ID。播放顺序就是数组顺序 |
| `playMode` | `"loop"` / `"shuffle"` / `"sequential"` | `"loop"` | **loop**: 列表播完从头再来；**shuffle**: 随机打乱顺序播；**sequential**: 播完一遍就停 |
| `autoPlay` | boolean | `true` | 进入世界后是否自动开始播放 |
| `waitForFirstMessage` | boolean | `false` | 设为 `true` 的话，不会一进来就播，而是等玩家发出第一条消息后才开始。适合有开场白或角色创建流程的世界 |
| `gapSeconds` | number (0-30) | `0` | 两首曲子之间的间隔秒数。设个 `2` 就会有短暂的静默过渡，更有"换碟"的感觉 |

每个世界只有一个 `bgmPlaylist`（可选）。如果你只有一首 BGM 并且设了 `loop: true`，其实不设播放列表也行，直接用条件 BGM 或 AI 指令来控制也可以。

---

### ConditionalBGM（条件 BGM）

这是音频系统里最有趣的部分——让音乐跟着故事走。想象你在玩一个 RPG，走进酒馆是欢快的手风琴，走进地牢变成阴森的低音提琴，遇到 Boss 突然切成激昂的管弦乐。条件 BGM 就是实现这个效果的。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | string | — | 唯一标识符 |
| `name` | string | — | 显示名称，方便你自己管理 |
| `triggerType` | 见下方 | `"variable"` | 触发方式 |
| `conditions` | Condition[] | `[]` | 变量条件数组（triggerType 为 `variable` 时使用） |
| `conditionLogic` | `"all"` / `"any"` | `"all"` | 条件之间的逻辑关系。`all` = 全部满足才触发，`any` = 任一满足就触发 |
| `keywords` | string[] | — | 关键词列表（triggerType 为 `keyword` 或 `ai-keyword` 时使用） |
| `matchWholeWords` | boolean | — | 是否全词匹配 |
| `atTurn` | number | — | 在第几回合触发（triggerType 为 `turn-count` 时使用） |
| `everyNTurns` | number | — | 每隔几回合触发一次 |
| `targetTrackId` | string | — | 触发后要播放的目标曲目 ID |
| `priority` | number | `0` | 优先级。数字越大优先级越高。当多个条件同时满足时，优先级高的赢 |
| `fadeInDuration` | number (秒) | `1` | 新曲目淡入时长 |
| `fadeOutDuration` | number (秒) | `1` | 旧曲目淡出时长 |
| `stopPreviousBGM` | boolean | `true` | 是否停掉正在播放的 BGM。通常保持 `true`，除非你想叠加多层音乐（比如叠加一层紧张的弦乐） |
| `fallback` | string | `"default"` | 条件不再满足时的行为：`"default"` 回到播放列表默认曲目，`"previous"` 回到之前那首，也可以填具体的 trackId |

**triggerType 的五种触发方式：**

| 值 | 什么时候触发 | 典型用法 |
|----|-------------|---------|
| `variable` | 游戏变量满足指定条件时 | 当 `location == "battle_arena"` 时切战斗曲 |
| `ai-keyword` | AI 回复中出现指定关键词时 | AI 提到"战斗开始"时切歌 |
| `keyword` | 玩家消息中出现指定关键词时 | 玩家说"演奏"时触发音乐 |
| `turn-count` | 到达指定回合数时 | 第 10 回合切换到紧张的倒计时音乐 |
| `session-start` | 会话开始时 | 每次进入世界播放固定的开场曲 |

---

### AI 音频指令

AI 不只是写文字——它还可以在回复中嵌入音频指令。这些指令对玩家不可见（引擎会自动剥离），但会触发对应的音频效果。就像电影剧本里的舞台指示，观众看不到，但工作人员会照着执行。

指令格式是 `[audio: trackId action]`，和变量指令（比如 `[health: -10]`）风格一致。

**支持的指令：**

| 指令 | 说明 |
|------|------|
| `[audio: trackId play]` | 播放指定曲目 |
| `[audio: trackId play 2.0]` | 播放，并用 2 秒淡入 |
| `[audio: trackId stop]` | 停止播放 |
| `[audio: trackId stop 1.5]` | 停止，并用 1.5 秒淡出 |
| `[audio: trackId crossfade 0.8]` | 交叉淡入淡出切换到这首曲目，过渡时长 0.8 秒 |
| `[audio: trackId volume 0.5]` | 把音量调到 0.5（不停止播放） |
| `[audio: trackId play chain:nextTrackId]` | 播完这首后自动播下一首。比如先放一段战斗前奏 SFX，播完自动切到战斗 BGM |

这些指令可以和状态变更指令混在一起使用。AI 可以写出这样的回复：

```
地牢深处传来轰鸣声，地面开始震动。[audio: earthquake play] 你的生命值因为落石受到了伤害。[health: -5] 恐惧感在心中蔓延。[fear: +10] 周围的环境音变得更加压抑。[audio: ambient volume 0.3]
```

玩家看到的只有干净的叙述文字，但会同时听到地震音效、感受到数值变化和氛围音量的降低。

**规则系统也能触发音频。** 在规则（Rule）的 actions 中，有一种 action 类型叫 `play-audio`，字段和 AudioEffect 一样（`trackId`、`action`、`volume`、`fadeDuration`）。这意味着你可以不依赖 AI，纯靠规则引擎来控制音乐——比如"当 hp 降到 20 以下时播放危机音乐"。

---

## 实用例子

### 例 1：最简单的循环 BGM

你有一首背景音乐，想让它从头到尾一直放。

**AudioTrack 配置：**
```json
{
  "id": "main_theme",
  "name": "主题曲",
  "type": "bgm",
  "url": "https://example.com/main-theme.mp3",
  "loop": true,
  "volume": 0.7,
  "fadeIn": 2
}
```

**BGMPlaylist 配置：**
```json
{
  "tracks": ["main_theme"],
  "playMode": "loop",
  "autoPlay": true
}
```

就这样，玩家进入世界就会听到音乐了。

---

### 例 2：战斗切歌

玩家探索时放轻松的音乐，进入战斗区域自动切成紧张的战斗曲，离开后切回来。

**准备两条 AudioTrack：**
```json
[
  { "id": "explore_bgm", "name": "探索", "type": "bgm", "url": "...", "loop": true },
  { "id": "battle_bgm", "name": "战斗", "type": "bgm", "url": "...", "loop": true }
]
```

**BGMPlaylist（默认播探索曲）：**
```json
{
  "tracks": ["explore_bgm"],
  "playMode": "loop",
  "autoPlay": true
}
```

**ConditionalBGM（进入战斗区域时切歌）：**
```json
{
  "id": "battle_music_trigger",
  "name": "战斗音乐触发",
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

当 `location` 变成 `"battle_arena"` 时，探索曲在 0.5 秒内淡出，战斗曲在 0.5 秒内淡入。当 `location` 变成别的值时（条件不再满足），`fallback: "default"` 让它自动回到播放列表里的探索曲。

---

### 例 3：AI 触发音效

让 AI 在叙述中自然地触发音效。比如"门被撞开"的场景。

**注册一条 SFX：**
```json
{
  "id": "door_slam",
  "name": "撞门声",
  "type": "sfx",
  "url": "https://example.com/door-slam.mp3",
  "loop": false,
  "volume": 0.9
}
```

AI 的回复可能长这样：

```
走廊尽头传来沉重的脚步声，越来越近。突然——
砰！门被猛地撞开！[audio: door_slam play]
一个身披铁甲的身影出现在门口。
```

玩家看到的是干净的叙述（没有 `[audio: ...]` 部分），同时耳边响起撞门的音效。

---

### 例 4：SFX 接 BGM（chain 用法）

战斗开始时先播一段号角音效，号角结束后自动衔接战斗 BGM。

```
号角声在山谷间回荡，敌军已经逼近！[audio: war_horn play chain:battle_bgm]
```

`chain:battle_bgm` 的意思是：等 `war_horn` 这条 SFX 播完后，自动开始播放 `battle_bgm`。这比分开写两条指令更丝滑，因为衔接是无缝的。

---

### 例 5：用规则引擎控制音乐（不依赖 AI）

如果你不想把音频控制交给 AI（毕竟 AI 有时会忘记写指令），可以直接在规则系统里配置。

**Rule 配置：**
```json
{
  "id": "low_hp_music",
  "name": "低血量危机音乐",
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

当 `hp` 从 20 以上降到 20 以下时，自动用 1.5 秒的交叉淡入淡出切换到危机音乐。纯机械触发，AI 完全不需要操心。
