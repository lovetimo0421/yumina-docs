# 行为规则引擎

> 行为（Behavior）是你世界里的自动化管家——你定好条件，它帮你盯着、帮你执行，玩家完全无感。
>
> 在编辑器里，这个区域叫 **Behaviors**（行为）。

---

## 简单版

### 规则是什么？

想象你雇了一个管家。你跟他说："如果客人到了门口，就开灯；如果冰箱空了，就去买菜。" 然后你就不用管了——管家会一直盯着，条件满足就自动干活。

Yumina 的规则引擎就是这个管家。你写好规则，引擎会在每次对话、每次状态变化时自动检查，该触发就触发，该执行就执行。你不需要写代码，不需要手动控制——全部声明式搞定。

### WHEN / ONLY IF / DO 三段式

在编辑器里，每条行为都由三个区块组成——对应编辑器里你看到的三个彩色标签：

- **WHEN（什么时候检查）**——触发时机。比如"当变量变化时"、"每 3 回合"、"玩家说了某个关键词"。
- **ONLY IF（条件满足吗，可选）**——检查当前状态。比如"HP 是否小于等于 0"、"location 是否等于 dark_forest"。
- **DO（做什么）**——执行动作。比如"通知玩家游戏结束"、"修改变量"、"切换背景音乐"。

WHEN 决定引擎什么时候来看你这条行为，ONLY IF 决定看了之后要不要执行（不填就直接执行），DO 是真正干活的部分。

### 一个最简单的例子

> 当 HP 变化时，如果 HP 降到 0 以下，那么通知玩家"你死了"。

```
WHEN:    变量越过阈值（health 降到 0 以下）
ONLY IF: （不填，直接执行）
DO:      显示通知 "你死了"（danger 样式）
```

就这么简单。在编辑器里点 **Add Behavior**，选触发事件、填条件、加动作，全程点点选选就行。玩家在冒险中 HP 被扣到 0 以下的瞬间，屏幕上弹出一个红色警告。不需要 AI 记住这件事，不需要你在提示词里反复强调——引擎自动搞定。

---

## 详细版

### Behavior 全字段一览

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | string | 是 | — | 唯一标识符 |
| `name` | string | 是 | — | 行为名称（给你自己看的） |
| `description` | string | 否 | — | 描述（也是给你自己看的） |
| `trigger` | TriggerConfig | 是 | — | WHEN：触发器配置 |
| `conditions` | Condition[] | 否 | `[]` | ONLY IF：条件列表 |
| `conditionLogic` | `"all"` / `"any"` | 否 | `"all"` | 条件之间的逻辑关系 |
| `actions` | RuleAction[] | 否 | `[]` | DO：动作列表 |
| `priority` | number | 否 | `0` | 优先级，数字越大越先评估 |
| `cooldownTurns` | number | 否 | — | 触发后冷却多少回合才能再次触发 |
| `maxFireCount` | number | 否 | — | 最多触发几次（之后永远不再触发） |
| `enabled` | boolean | 否 | `true` | 是否启用 |

---

### 触发器 (Trigger) —— WHEN 部分

触发器决定引擎什么时候来"看"你这条规则。你可以把它理解为闹钟——闹钟响了，管家才会起来检查条件。

#### 触发器类型

编辑器把触发器分成几个分组，方便你找：

**消息类（Messages）**

| 编辑器标签 | 内部类型 | 说明 |
|-----------|---------|------|
| 每回合 | `every-turn` | 每次玩家和 AI 完成一轮对话后触发 |
| 玩家说了关键词 | `keyword` | 玩家消息包含关键词时触发 |
| AI 说了关键词 | `ai-keyword` | AI 回复包含关键词时触发 |
| 会话开始 | `session-start` | 新会话（对话）开始时触发 |

**游戏状态类（Game State）**

| 编辑器标签 | 内部类型 | 说明 |
|-----------|---------|------|
| 变量变化 | `state-change` | 任何变量发生改变时触发 |
| 变量越过阈值 | `variable-crossed` | 某个数值变量越过一个阈值时触发。需要额外填：`variableId`、`threshold`、`direction`（`"rises-above"` 上穿 / `"drops-below"` 下穿） |
| 动作按钮被按下 | `action` | 自定义动作被执行时触发。需要填 `actionId` |

**时间类（Timing）**

| 编辑器标签 | 内部类型 | 说明 |
|-----------|---------|------|
| 每 N 回合 | `turn-count` | 在特定回合（`atTurn`）或每隔 N 回合（`everyNTurns`）时触发 |

**计时器类（Timers）**

| 编辑器标签 | 内部类型 | 说明 |
|-----------|---------|------|
| 计时器到时 | `timer:fired` | 由"启动计时器"动作创建的计时器倒计时结束时触发 |

**`state-change` vs `variable-crossed` 的区别：** `state-change` 是"只要有变量动了我就来看看"，非常宽泛。`variable-crossed` 是"我只关心某个变量越过某条线的那个瞬间"，非常精准。打个比方，`state-change` 是你让管家每次有动静都来看看门，`variable-crossed` 是你让管家只在温度计跌破 0 度的时候来喊你。

**关键词触发的高级配置：** `keyword` 和 `ai-keyword` 触发器支持相当精细的匹配控制：

- `matchWholeWords`——全词匹配（避免 "cat" 匹配到 "category"）
- `useFuzzyMatch`——模糊匹配（容忍拼写错误）
- `secondaryKeywords` + `secondaryKeywordLogic`——二级关键词过滤，逻辑有四种：
  - `AND_ANY`：主关键词匹配后，二级关键词任一匹配即通过
  - `AND_ALL`：主关键词匹配后，二级关键词全部匹配才通过
  - `NOT_ANY`：主关键词匹配后，二级关键词全部不匹配才通过
  - `NOT_ALL`：主关键词匹配后，二级关键词不是全部匹配才通过

---

### 条件 (Condition) —— IF 部分

触发器只是让引擎"看过来"，条件才是真正的门槛。条件检查的是当前游戏状态中变量的值。

每个条件由三部分组成：

```
variableId  +  operator  +  value
```

#### 7 种运算符

| 运算符 | 含义 | 适用类型 | 例子 |
|--------|------|----------|------|
| `eq` | 等于 | 数字/字符串/布尔 | `health eq 0` |
| `neq` | 不等于 | 数字/字符串/布尔 | `status neq "dead"` |
| `gt` | 大于 | 数字 | `gold gt 100` |
| `gte` | 大于等于 | 数字 | `level gte 5` |
| `lt` | 小于 | 数字 | `hunger lt 20` |
| `lte` | 小于等于 | 数字 | `hp lte 0` |
| `contains` | 包含子串 | 字符串 | `inventory contains "sword"` |

#### 条件组合逻辑

- `conditionLogic: "all"`（默认）—— 所有条件都满足才算通过，相当于 AND
- `conditionLogic: "any"` —— 任何一个条件满足就算通过，相当于 OR

比如你想表达"HP 低于 20 并且没有药水"，那就两个条件 + `"all"`。想表达"HP 低于 20 或者中了毒"，那就两个条件 + `"any"`。

**注意：** 如果 `conditions` 是空数组，条件检查直接通过。也就是说，如果你只写了触发器没写条件，那触发器一响规则就执行。

---

### 动作 (Action) —— DO 部分

条件通过后，引擎就会执行行为里定义的动作。一条行为可以有多个动作，它们会按顺序全部执行。

#### 动作类型

编辑器把动作分成几个分组：

##### 游戏（Game）

**1. `modify-variable` —— 修改变量**

直接改游戏状态里的某个变量。

| 字段 | 说明 |
|------|------|
| `variableId` | 要修改的变量 ID |
| `operation` | 操作：`set`（覆盖）、`add`（加）、`subtract`（减）、`multiply`（乘）、`toggle`（布尔翻转）、`append`（字符串追加）、`merge`（对象合并）、`push`（数组追加）、`delete`（删除键） |
| `value` | 操作的值 |

##### AI 与故事（AI & Story）

**2. `inject-directive` —— 告诉 AI（注入临时系统提示）**

往 AI 的上下文里塞一段临时指令。这是行为引擎最强大的动作之一——你可以在特定条件下改变 AI 的行为。

| 字段 | 说明 |
|------|------|
| `directiveId` | 指令的唯一 ID（用于后续移除） |
| `content` | 指令内容（纯文本） |
| `position` | 插入位置：`top`（最顶）、`before_char`（角色描述前）、`after_char`（角色描述后）、`bottom`（最底）、`depth`（按深度）、`auto`（自动，默认） |
| `persistent` | 是否持久（默认 `true`，跨回合保留） |
| `duration` | 持续几回合后自动消失（可选） |

**3. `remove-directive` —— 停止告诉 AI（移除指令）**

移除之前通过 `inject-directive` 注入的指令。

| 字段 | 说明 |
|------|------|
| `directiveId` | 要移除的指令 ID |

**4. `send-context` —— 让 AI 回复（发送上下文消息）**

给 AI 发一条隐形消息并触发 AI 生成回复。玩家看不见这条消息，但 AI 能看到并据此回复。

| 字段 | 说明 |
|------|------|
| `message` | 消息内容 |
| `role` | 消息角色：`"system"`（默认）或 `"user"` |

**5. `toggle-entry` —— 启用/禁用条目**

控制知识库条目（World Entry）的启用状态。

| 字段 | 说明 |
|------|------|
| `entryId` | 条目 ID |
| `enabled` | `true` 启用 / `false` 禁用 |

**6. `toggle-rule` —— 启用/禁用其他行为**

让行为之间互相控制。这是实现复杂行为链的关键。

| 字段 | 说明 |
|------|------|
| `ruleId` | 目标行为 ID |
| `enabled` | `true` 启用 / `false` 禁用 |

##### 玩家（Player）

**7. `notify-player` —— 显示通知**

在玩家界面弹出一条通知。

| 字段 | 说明 |
|------|------|
| `message` | 通知内容 |
| `style` | 样式：`"info"`（默认，蓝色）、`"achievement"`（成就，金色）、`"warning"`（警告，黄色）、`"danger"`（危险，红色） |

##### 音频（Audio）

**8. `play-audio` —— 播放音频**

控制背景音乐或音效。

| 字段 | 说明 |
|------|------|
| `trackId` | 音轨 ID（对应 `audioTracks` 里定义的音轨） |
| `action` | 操作：`"play"`（播放）、`"stop"`（停止）、`"crossfade"`（渐变切换）、`"volume"`（调节音量） |
| `volume` | 音量 0~1（可选） |
| `fadeDuration` | 渐变时长，秒（可选） |

##### 计时器（Timers）

**9. `start-timer` —— 启动计时器**

启动一个倒计时。到时后会触发 `timer:fired` 事件，你可以用另一条行为来响应这个事件。

| 字段 | 说明 |
|------|------|
| `id` | 计时器 ID（唯一标识） |
| `name` | 显示名称 |
| `duration` | 倒计时时长，秒 |
| `repeat` | 是否重复（可选，默认不重复） |

**10. `cancel-timer` —— 取消计时器**

取消一个正在运行的计时器。

| 字段 | 说明 |
|------|------|
| `id` | 要取消的计时器 ID |

---

### 高级特性

#### 优先级 (priority)

数字越大的规则越先被评估和执行。当多条规则同时触发时，优先级决定谁先跑。

场景举例：你有一条规则在 HP 归零时宣告死亡（priority: 100），另一条规则在 HP 低于 20 时提示危险（priority: 50）。两条可能同时满足，但死亡通知一定先执行。

#### 冷却 (cooldownTurns)

规则触发一次之后，要等指定回合数才能再次触发。适合那些不应该每回合都响的规则，比如"每隔至少 5 回合才提醒一次饥饿"。

#### 最大触发次数 (maxFireCount)

规则一生最多触发这么多次。比如开场教程提示只需要出现一次，设 `maxFireCount: 1` 就好。触发够了之后，这条规则就永远安静了。

#### 规则互控 (toggle-rule)

规则 A 的动作可以启用或禁用规则 B。配合 `manual` 触发器，你可以实现"平时休眠，被激活后才开始工作"的规则。

举个例子：规则 A 监听玩家是否进入了地下城（keyword 触发）。进入后，规则 A 用 `toggle-rule` 启用规则 B（一个 `every-turn` 触发的怪物遭遇规则）。离开地下城时，再禁用规则 B。这样怪物遭遇只在地下城里发生。

---

### 评估流程

每次玩家发消息或状态变化后，引擎的完整处理流程如下：

```
收到事件（玩家消息、AI回复、状态变化、回合结束、计时器到时等）
  |
  v
按 priority 从高到低排序所有行为
  |
  v
逐条检查：
  1. 行为是否启用？（enabled + 运行时未被禁用）
  2. WHEN 事件类型是否匹配？
  3. WHEN 的具体条件是否满足？（关键词匹配、阈值穿越等）
  4. ONLY IF 条件是否通过？
  5. 是否在冷却中？
  6. 是否超过最大触发次数？
  |
  v
全部通过 → 收集该行为的所有动作
  |
  v
所有行为检查完毕 → 按收集顺序执行所有动作
  |
  v
动作可能修改变量 → 引发新一轮事件 → 再次评估（有深度限制，防止无限循环）
```

整个过程对玩家透明——他们只看到结果。

---

## 实用例子

### 例 1：HP 归零，游戏结束

玩家角色在战斗中 HP 降到 0 以下时，弹出红色危险通知。

```json
{
  "id": "rule-death",
  "name": "死亡判定",
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
      "message": "你的角色已经死亡。游戏结束。",
      "style": "danger"
    }
  ],
  "priority": 100,
  "maxFireCount": 1,
  "enabled": true
}
```

**要点：** 用 `variable-crossed` 而不是 `state-change` + 条件，因为你只想在 HP "越过" 0 的那个瞬间触发一次，而不是每次 HP 变化都检查一遍。`maxFireCount: 1` 确保死亡通知只弹一次。

---

### 例 2：每 3 回合饥饿值 +1

模拟生存游戏中的饥饿机制，每过 3 个回合自动增加饥饿值。

```json
{
  "id": "rule-hunger-tick",
  "name": "饥饿周期",
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

**要点：** `everyNTurns: 3` 意味着第 3、6、9、12... 回合都会触发。不需要条件——只要到了回合就加饥饿。如果你想在饥饿满了之后停止增加，可以加一个条件 `hunger lt 10`。

---

### 例 3：进入危险区域，切换背景音乐

当玩家的 location 变量变成 "dark_forest" 时，渐变切换到恐怖 BGM。

```json
{
  "id": "rule-dark-forest-bgm",
  "name": "黑暗森林 BGM",
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

**要点：** 这里用 `state-change` 触发 + 条件检查，因为 location 可能来自 AI 的回复解析。`cooldownTurns: 5` 防止玩家在森林边缘反复进出时音乐不停切换。

---

### 例 4：规则互控——地下城怪物遭遇

进入地下城时激活怪物遭遇规则，离开时关闭。

```json
[
  {
    "id": "rule-enter-dungeon",
    "name": "进入地下城",
    "trigger": {
      "type": "keyword",
      "keywords": ["进入地下城", "走进洞穴", "enter dungeon"]
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
    "name": "怪物遭遇",
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

**要点：** 怪物遭遇规则初始是 `enabled: false` 的。只有当"进入地下城"规则触发后，通过 `toggle-rule` 把它激活，它才开始每回合工作。`cooldownTurns: 2` 确保不会每回合都遇怪——至少间隔 2 回合。同时，`inject-directive` 动态地往 AI 上下文里注入了地下城氛围描写指令，让 AI 的文风随场景切换。

---

### 例 5：成就系统

玩家金币超过 1000 时解锁"富甲一方"成就。

```json
{
  "id": "rule-rich-achievement",
  "name": "富甲一方",
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
      "message": "成就解锁：富甲一方 —— 你的金币超过了 1000！",
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

**要点：** `variable-crossed` + `rises-above` 精准捕捉"越过 1000"的瞬间。`maxFireCount: 1` 确保成就只解锁一次。动作里既弹了金色成就通知，又把一个布尔变量标记为 `true`，方便其他行为或条目根据成就状态做条件判断。

---

### 例 6：计时器——限时挑战

玩家进入某个房间后启动 60 秒倒计时，到时间触发爆炸。

```
行为 A：进入密室
  WHEN:    玩家说了关键词 "进入密室"
  ONLY IF: （无）
  DO:
    - 修改变量 location = "secret_room"
    - 启动计时器（ID: bomb_timer, 时长: 60秒, 不重复）
    - 显示通知 "炸弹已启动！你有60秒逃出去！" (warning)

行为 B：炸弹爆炸
  WHEN:    计时器到时（bomb_timer）
  ONLY IF: location == "secret_room"
  DO:
    - 修改变量 health = 0
    - 显示通知 "轰——你没能及时逃出密室。" (danger)
```

**要点：** 行为 A 用 `start-timer` 启动一个 60 秒的倒计时。倒计时结束后，引擎自动触发 `timer:fired` 事件，行为 B 响应这个事件。如果玩家在 60 秒内离开了密室（location 不再是 "secret_room"），ONLY IF 条件不满足，炸弹就不会生效——这就是条件检查的妙用 (≧▽≦)
