# 变量系统

> 变量是你的世界的"记忆"——它们记录一切需要追踪的东西，让AI和引擎知道现在发生了什么、发生过什么。

---

## 简单版

想象一下，你在纸上记录一场桌游的状态：谁的血量多少、背包里有什么、某扇门有没有被打开。变量就是这张纸——只不过引擎帮你管着，AI帮你改。

### 四种类型

| 类型 | 用途 | 举个栗子 |
|------|------|----------|
| `number` | 数字，能加减乘 | 生命值、金币、好感度 |
| `string` | 文字 | 当前位置、角色称号 |
| `boolean` | 开关，只有 true/false | 是否拿到钥匙、门锁了没 |
| `json` | 复杂数据结构（对象、数组） | 背包物品列表、阵营关系网 |

### 怎么创建

在世界编辑器里打开"变量"区域，点"添加变量"，填三样东西就行：

1. **名字** — 给变量起个名，比如 `health`
2. **类型** — 选一种：number / string / boolean / json
3. **默认值** — 游戏开始时的初始值

就这么简单。AI 在回复里写一个 `[health: -10]`，引擎就会自动帮你把生命值减掉 10 点。

### 最简单的 HP 例子

```
名字:       health
类型:       number
默认值:     100
最小值:     0
最大值:     100
分类:       stat
描述:       角色当前生命值
```

当 AI 写出 `[health: -20]`，引擎把 100 变成 80。再来一个 `[health: -90]`，引擎算出 -10，但因为你设了最小值 0，它会自动钳制到 0。不会出现负血量。

---

## 详细版

### 变量字段 — 编辑器里你会看到什么

在编辑器里点击 **添加变量**，你会看到以下字段。下面是每个字段的位置和作用。

| 编辑器字段 | 在哪里找到 | 它是干什么的 |
|---|---|---|
| **ID** | 名称下方（自动生成，也可手动设置） | 变量的唯一标识符，AI 在指令里用它来引用变量，比如 `[health: -10]`。从名称自动生成（小写加下划线），也可以手动填写 |
| **显示名称** | 变量面板顶部 | 在编辑器侧边栏和状态面板里看到的名字。AI 也可以用这个名字来引用变量——引擎会自动做名称到 ID 的映射 |
| **类型** 下拉菜单 | 名称下方 | Number、String、Boolean 或 JSON。决定了变量能存什么、能做什么操作 |
| **默认值** | 主输入区域 | 玩家开始新会话时这个变量的初始值 |
| **最小值 / 最大值** | 数字输入框（仅 Number 类型时显示） | 引擎会自动将数值钳制在这个范围内。设 min `0`、max `100`，就不会出现负血量或超过上限的情况 |
| **分类** 下拉菜单 | 默认值下方 | 帮助在编辑器和提示词中组织变量：属性、背包、资源、标记、关系、自定义 |
| **行为规则** | 底部的文本区域 | 用自然语言告诉 AI 什么时候、怎么修改这个变量。会被包含在系统提示词里，让 AI 知道规则 |
| **描述** | 目前编辑器界面没有暴露 | 给自己看的备注。可以通过 JSON 导出/导入设置 |

::: details 技术参考：JSON 字段映射

以下是编辑器字段与底层 JSON 字段的对照表。导出/导入世界文件时会用到。

| JSON 字段 | 类型 | 必填 | 编辑器对应 |
|---|---|---|---|
| `id` | string | 是 | **ID** |
| `name` | string (min 1) | 是 | **显示名称** |
| `type` | `"number"` / `"string"` / `"boolean"` / `"json"` | 是 | **类型** 下拉菜单 |
| `defaultValue` | number / string / boolean / object / array | 是 | **默认值** |
| `description` | string | 否 | **描述**（仅 JSON） |
| `min` | number | 否 | **最小值**（仅 Number 类型） |
| `max` | number | 否 | **最大值**（仅 Number 类型） |
| `category` | enum（见下方） | 否 | **分类** 下拉菜单 |
| `behaviorRules` | string | 否 | **行为规则** |
| `updateHints` | string | 否 | **已废弃**——请使用 `behaviorRules`。保留该字段仅为兼容旧的导入文件 |

:::

### 分类 (category)

分类不影响变量的实际行为，但它能帮你整理变量、也让 AI 更好地理解每个变量的角色：

| 分类 | 含义 | 典型用途 |
|------|------|----------|
| `stat` | 属性 | HP、MP、力量、敏捷 |
| `inventory` | 背包 | 物品列表、装备 |
| `resource` | 资源 | 金币、木材、食物 |
| `flag` | 标记 | 某件事是否发生过、某扇门是否解锁 |
| `relationship` | 关系 | 角色好感度、阵营声望 |
| `custom` | 自定义 | 以上都不是的时候用 |

### 所有操作 (EffectOperation) 详解

AI 在回复中使用方括号语法来修改变量。引擎解析这些指令，执行对应的操作。一共有 9 种。

> **既可用 ID，也可用显示名。** 指令可以写变量的 `id`（如 `player_hp`），也可以写 `name`（如 `Player HP`）——引擎内部维护一张 name→id 的映射表，两种写法都能解析。名称匹配区分大小写。

#### set — 直接赋值

把变量设成一个新值，不管之前是什么。

```
[location: set "forest"]        -- 把位置设为"forest"
[health: set 50]                -- 把生命值直接设为 50
[health: 50]                    -- 对于正数，省略操作符时默认按 set 处理
```

> **注意：** `[health: -10]` **不是**"设置为 -10"。前面的 `-` 是 `subtract` 的简写，所以这条指令是把当前生命值减 10。如果要真的赋一个负数，请写 `[health: set -10]`。

#### add — 加法

给 number 变量加一个数。

```
[gold: add 50]                  -- 金币 +50
[gold: +50]                     -- 简写形式，效果相同
```

#### subtract — 减法

从 number 变量减去一个数。

```
[health: subtract 10]           -- 生命值 -10
[health: -10]                   -- 简写形式，效果相同
```

#### multiply — 乘法

把 number 变量乘以一个数。暴击翻倍之类的场景很适合。

```
[damage: multiply 2]            -- 伤害翻倍
[damage: *2]                    -- 简写形式，效果相同
```

#### toggle — 翻转布尔值

把 boolean 变量从 true 变 false，或者从 false 变 true。不需要写值。

```
[hasKey: toggle]                -- 拿到钥匙了（false -> true）
```

#### append — 字符串拼接

在 string 变量的末尾追加文字。适合做简单的事件日志。

```
[log: append " - 击败了哥布林"]  -- 日志后面加一条记录
```

#### merge — JSON 深度合并

把一个对象浅合并进 json 变量。已有的键会被覆盖，新的键会被添加。

```
[stats: merge {"level": 2}]    -- 把 level 字段更新为 2
```

注意：merge 只对"对象"类型的 json 变量生效，不能对数组用。

#### push — 数组追加

在 json 数组类型的变量末尾添加一个元素。值**必须是合法的 JSON**——对象 `{...}` 或数组 `[...]`。裸的字符串或数字不被指令解析器接受。

```
[inventory: push {"id": "sword", "name": "铁剑", "qty": 1}]    -- push 一个对象
[waypoints: push [12, 34]]                                     -- push 一个数组
```

> **小贴士：** 如果背包需要存放纯字符串（如 `"torch"`），推荐的做法是把每个条目包成对象（`{"id": "torch"}`）；另外也可以在规则动作的 `modify-variable` 里操作，那里的值类型不受限制。

#### delete — 删除键或元素

删除对象中的某个键，或数组中某个索引位置的元素。**不能通过 `[var: ...]` 指令语法使用**：解析器的 JSON 模式只接受对象/数组形式的 JSON 值，`delete` 需要的裸字符串/裸数字无法传到处理函数。

两种可行的做法：

1. **JSON Patch 块**——推荐 AI 使用。例如发出 `<UpdateVariable target="inventory"><JSONPatch>[{"op":"remove","path":"/0"}]</JSONPatch></UpdateVariable>` 移除第一个背包物品，或 `{"op":"remove","path":"/visited"}` 移除对象里的键。
2. **规则动作**——在规则的 `modify-variable` 动作里设 `operation: "delete"`，`value: "visited"`（删对象键用字符串）或 `value: 0`（删数组索引用数字）。

完整的 `<UpdateVariable>` 语法见[指令与宏](./05-directives-and-macros.md)。

### min/max 自动钳制

这是 number 变量的护栏。假设你设了 `min: 0, max: 100`：

- 当一次操作让数值超过 100，引擎自动压到 100
- 当一次操作让数值低于 0，引擎自动拉到 0

你不需要在 AI 的提示词里反复强调"不要让生命值变成负数"——引擎层面就帮你兜住了。

### 嵌套 JSON 路径 (dot-path)

这是变量系统最强大的功能之一。对于 json 类型的变量，AI 可以用点号路径直接深入操作嵌套结构，而不需要 merge 整个对象。

比如你有一个叫 `gameState` 的 json 变量，里面的结构是：

```json
{
  "factions": {
    "emberCourt": { "affinity": 30 },
    "frostHold": { "affinity": 50 }
  },
  "player": {
    "level": 5
  }
}
```

AI 可以这样写：

```
[gameState.factions.emberCourt.affinity: +5]
```

引擎会自动导航到 `gameState` -> `factions` -> `emberCourt` -> `affinity`，然后加 5。从 30 变成 35。其他所有数据保持不变。

如果路径中间某一层不存在，引擎会自动创建空对象来补上——不会报错。

嵌套路径支持的操作：`set`、`add`、`subtract`、`merge`、`push`。

> **⚠️ dot-path 只对 `json` 类型变量有效。** 如果根变量是 `number`、`string` 或 `boolean`，类似 `[player.hp: +5]` 的指令会被引擎**静默忽略**。复合状态请一律声明为 `json` 变量。另外，`multiply` 和 `toggle` 在嵌套路径上尚未接线——当前实现会静默退化为 `set`。嵌套路径上的 `delete` 请使用 JSON Patch（见上面 delete 小节）。

### behaviorRules — 给 AI 的行为指导

这个字段是纯文本，写给 AI 看的。它不影响引擎的行为，但会被包含在发给 AI 的系统提示词里，帮助 AI 理解应该怎样修改这个变量。

比如一个 HP 变量的 behaviorRules 可以写：

```
普通攻击造成 5-15 点伤害，暴击翻倍。
治疗药水恢复 30 点。
HP 降到 0 时角色死亡，必须触发死亡剧情。
不要频繁修改 HP，只在战斗和受伤场景中修改。
```

这就像在跟 AI 说："嘿，这个变量你得这么用。"它比在系统提示词里写一大段规则要更精准，因为 behaviorRules 是跟着变量走的。

### 变量的生命周期

一个变量从出生到被使用，经历这几个阶段：

1. **定义** — 你在编辑器里创建变量，设好类型、默认值、约束
2. **初始化** — 玩家开始新会话时，所有变量被设为默认值，组成初始的 GameState
3. **AI 修改** — AI 在回复中写出方括号指令，引擎解析后执行操作（加减乘除等）
4. **规则修改** — 规则系统检查条件，满足时自动执行额外的变量修改（比如"HP 归零时触发死亡"）
5. **持久化** — 每轮结束后，整个 GameState（包括所有变量的当前值）被存入数据库，下次继续

如果世界定义里新增了变量但玩家的存档里没有，引擎会在加载时自动用默认值补上。如果世界定义里删除了某个变量，存档里对应的值会在标准化时被过滤掉。所以你可以放心地迭代变量设计，不用担心搞坏老玩家的存档。

---

## 实用例子

### 1. 简单 HP 变量

最经典的用法。一个有上下限保护的生命值。

```json
{
  "id": "health",
  "name": "health",
  "type": "number",
  "defaultValue": 100,
  "min": 0,
  "max": 100,
  "category": "stat",
  "description": "角色当前生命值",
  "behaviorRules": "普通攻击造成 5-15 点伤害。治疗药水恢复 30 点。HP 归零时角色死亡。"
}
```

AI 回复中的操作示例：

```
勇者被哥布林的利爪划过手臂。[health: -8]

你喝下了治疗药水，温暖的光芒流过全身。[health: +30]
```

因为 max 是 100，就算当前 HP 是 90 然后 +30，结果也只会是 100，不会变成 120。

### 2. 背包变量（json 对象数组）

把物品存成对象，这样 `push` 就能直接接受它们。需要按索引移除某个物品时，使用 `<UpdateVariable>` JSON Patch。

```json
{
  "id": "inventory",
  "name": "inventory",
  "type": "json",
  "defaultValue": [
    {"id": "torch", "name": "火把", "qty": 1},
    {"id": "bread", "name": "面包", "qty": 2}
  ],
  "category": "inventory",
  "description": "玩家的背包（对象数组）",
  "behaviorRules": "获得物品时用 push 添加完整的物品对象。使用或丢弃物品时，通过 <UpdateVariable target=\"inventory\"><JSONPatch>[{\"op\":\"remove\",\"path\":\"/<索引>\"}]</JSONPatch></UpdateVariable> 块移除。背包上限 10 个物品。"
}
```

AI 回复中的操作示例：

```
你从宝箱中找到一把生锈的铁剑。
[inventory: push {"id": "iron_sword", "name": "铁剑", "qty": 1}]

你点燃火把照亮了洞穴深处。火把在潮湿的空气中渐渐熄灭。
<UpdateVariable target="inventory"><JSONPatch>[{"op":"remove","path":"/0"}]</JSONPatch></UpdateVariable>
```

JSON Patch 块会移除数组中索引 0 的元素（也就是 "torch"）。更多 patch 示例见[指令与宏](./05-directives-and-macros.md)。

### 3. 角色关系变量（json 对象 + 嵌套路径）

用一个 json 对象存储多个角色的关系数据，通过 dot-path 精确修改。

```json
{
  "id": "relationships",
  "name": "relationships",
  "type": "json",
  "defaultValue": {
    "aria": { "trust": 50, "romance": 0, "met": true },
    "kael": { "trust": 30, "romance": 0, "met": false }
  },
  "category": "relationship",
  "description": "各角色的关系数值",
  "behaviorRules": "trust 范围 0-100，romance 范围 0-100。重大抉择影响 10-20 点，日常对话影响 1-5 点。met 在首次见面时设为 true。"
}
```

AI 回复中的操作示例：

```
Aria 对你的坦诚感到意外，嘴角微微上扬。
[relationships.aria.trust: +10]

你在酒馆里第一次遇见了 Kael。他警惕地打量着你。
[relationships.kael.met: set true]
[relationships.kael.trust: +5]
```

引擎会自动导航到嵌套路径，只修改对应的字段，其他数据原封不动。比如修改 `aria.trust` 不会影响 `aria.romance` 或任何 `kael` 的数据。

这种结构比为每个角色单独建变量要灵活得多——你可以随时通过 merge 加入新角色，AI 也可以用 dot-path 精确到任意深度。
