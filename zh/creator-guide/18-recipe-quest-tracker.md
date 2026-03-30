<div v-pre>

# 任务追踪

> 做一个任务追踪面板——显示所有任务的完成状态（打勾或打叉），实时显示金币奖励。玩家完成任务时自动弹出成就通知、发放奖励。这篇教你怎么用变量、行为和消息渲染器搭出来。

---

## 你要做的东西

一个嵌在聊天界面里的任务追踪面板：

- **任务列表**——每个任务显示名称和完成状态（完成 = 绿色勾，未完成 = 红色叉）
- **金币计数器**——实时显示玩家当前拥有的金币数量
- **自动检测完成**——当 AI 的回复或玩家的消息中提到关键词（比如"草药""找到草药"），自动标记任务完成
- **成就通知**——任务完成时弹出金色通知，告诉玩家获得了多少奖励
- **金币奖励**——每完成一个任务自动发放对应的金币

```
AI 回复中提到「找到草药」
  → 引擎检测到关键词「草药」
  → 检查条件：quest_1_complete == false？
    → 是：设 quest_1_complete = true，gold 加 30，弹出成就通知
    → 否：什么都不做（任务已经完成过了）
  → 任务面板自动更新：「寻找草药」从 ✗ 变成 ✓
```

---

## 原理

这个任务系统用到了三个核心机制：

1. **boolean 变量 + 关键词触发**——每个任务用一个布尔变量记录完成状态。当 AI 或玩家的消息里出现特定关键词时，行为规则自动把变量设为 `true`
2. **条件检查**——行为在触发前先检查任务是否已经完成。已完成的任务不会重复触发（不会重复发奖励）
3. **消息渲染器读变量**——面板实时从变量读取任务状态和金币数量，动态渲染勾号或叉号

---

## 一步步来

### 第 1 步：创建变量

我们需要 4 个变量——两个记录任务完成状态，一个记录金币，另外两个记录任务名称（方便消息渲染器动态显示）。

编辑器 → 左侧边栏 → **变量** 标签页 → 逐个点击「添加变量」

#### 变量 1：任务 1 完成状态

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 任务1完成 | 给你自己看的，方便在变量列表里识别 |
| ID | `quest_1_complete` | 行为规则和消息渲染器代码用这个 ID 来读写 |
| 类型 | 布尔 | 只有「完成」和「未完成」两个状态 |
| 默认值 | `false` | 新会话开始时任务还没完成 |
| 分类 | 标记 | 这是一个状态标记，不是数值属性 |
| 行为规则 | `不要直接修改这个变量。它由任务系统的行为规则控制。true 表示任务已完成，false 表示未完成。` | 告诉 AI 不要自作主张改完成状态 |

#### 变量 2：任务 2 完成状态

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 任务2完成 | 方便识别 |
| ID | `quest_2_complete` | 行为规则和消息渲染器代码用这个 ID |
| 类型 | 布尔 | 同样只有两个状态 |
| 默认值 | `false` | 新会话开始时未完成 |
| 分类 | 标记 | 状态标记 |
| 行为规则 | `不要直接修改这个变量。它由任务系统的行为规则控制。true 表示任务已完成，false 表示未完成。` | 防止 AI 擅自修改 |

#### 变量 3：金币

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 金币 | 方便识别 |
| ID | `gold` | 完成任务时自动增加金币 |
| 类型 | 数字 | 金币是数值，需要加减运算 |
| 默认值 | `0` | 新会话开始时没有金币——靠完成任务来赚 |
| 最小值 | `0` | 防止金币变成负数 |
| 分类 | 资源 | 金币属于资源类变量 |
| 行为规则 | `不要直接修改这个变量。它由任务系统自动管理。完成任务时会自动发放金币奖励。` | 防止 AI 自己加金币 |

#### 变量 4：任务 1 名称

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 任务1名称 | 方便识别 |
| ID | `quest_1_name` | 消息渲染器用这个 ID 来显示任务名 |
| 类型 | 字符串 | 任务名是文字 |
| 默认值 | `寻找草药` | 第一个任务的名称 |
| 分类 | 自定义 | 只是描述性数据 |
| 行为规则 | `不要修改这个变量。` | 任务名不应该被改动 |

#### 变量 5：任务 2 名称

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 任务2名称 | 方便识别 |
| ID | `quest_2_name` | 消息渲染器用这个 ID |
| 类型 | 字符串 | 任务名是文字 |
| 默认值 | `击败森林狼` | 第二个任务的名称 |
| 分类 | 自定义 | 描述性数据 |
| 行为规则 | `不要修改这个变量。` | 任务名不应该被改动 |

::: info 为什么每个变量都要写行为规则？
因为 AI 在生成回复时可以「建议」修改变量。如果你不告诉它别碰，它可能自己标记任务完成（比如 AI 觉得"玩家找到了草药"所以自己把 `quest_1_complete` 改成 `true`，但没走行为逻辑就没有金币奖励）。行为规则字段就是对 AI 的指令——写了之后 AI 就知道这些变量只由系统控制。
:::

---

### 第 2 步：创建行为规则

这是任务系统的核心。我们需要 2 个行为，分别在检测到关键词时标记对应任务完成并发放奖励。

编辑器 → **行为** 标签页 → 逐个点击「添加行为」

#### 行为 1：完成任务「寻找草药」

**WHEN（什么时候检查）：**

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 触发器类型 | AI 或玩家说了关键词 | 当聊天中出现特定文字时触发 |
| 关键词 | `草药` 或 `找到草药` | 当 AI 描述找到草药、或玩家说"我找到草药了"时匹配 |

> **关键词触发器怎么匹配？** 引擎会检查最新的消息内容——只要消息里**包含**关键词就算匹配。所以 AI 回复「你在灌木丛中发现了珍贵的草药」也会触发，因为内容包含"草药"。

**ONLY IF（条件）：**

| 变量 | 运算符 | 值 | 为什么 |
|------|--------|-----|--------|
| `quest_1_complete` | 等于 (eq) | `false` | 只有任务还没完成时才触发——防止重复发奖励 |

> **为什么需要条件？** 如果不加条件，每次 AI 提到"草药"都会触发奖励。加了 `quest_1_complete == false` 之后，第一次提到草药 → 完成任务、发奖励、标记 `true`。之后再提到草药 → 条件不通过（已经是 `true`），什么都不做。

**DO（执行动作）：**

按顺序添加以下动作：

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 修改变量 | 变量 `quest_1_complete`，操作 `set`，值 `true` | 标记任务已完成 |
| 修改变量 | 变量 `gold`，操作 `add`，值 `30` | 发放 30 金币奖励 |
| 显示通知 | 消息 `任务完成：寻找草药！获得 30 金币`，样式 `achievement` | 弹出金色成就通知 |
| 告诉 AI | 内容：`玩家刚刚完成了任务「寻找草药」，获得了 30 金币奖励。请在回复中适当提及。` | 让 AI 知道发生了什么，可以写出更好的剧情衔接 |

> **为什么要「告诉 AI」？** 修改变量和显示通知都是静默的系统操作——AI 本身不知道"任务刚刚完成了"。加了这一步后，AI 在下次回复时可以写出更自然的过渡（比如"你小心翼翼地把草药放进背包，想起了村长的嘱托。这趟差事总算没白跑"）。

#### 行为 2：完成任务「击败森林狼」

**WHEN（什么时候检查）：**

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 触发器类型 | AI 或玩家说了关键词 | 和上面一样，关键词触发 |
| 关键词 | `击败` 且 `狼` | 需要同时提到「击败」和「狼」才触发——防止只说"看到一只狼"就误触发 |

> **多个关键词的匹配逻辑。** 当你填多个关键词时，消息里需要同时包含所有关键词才会触发。所以 AI 回复「你挥剑击败了凶猛的森林狼」会触发（包含"击败"和"狼"），但「远处传来狼嚎声」不会触发（只有"狼"没有"击败"）。

**ONLY IF（条件）：**

| 变量 | 运算符 | 值 | 为什么 |
|------|--------|-----|--------|
| `quest_2_complete` | 等于 (eq) | `false` | 同样防止重复触发 |

**DO（执行动作）：**

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 修改变量 | 变量 `quest_2_complete`，操作 `set`，值 `true` | 标记任务已完成 |
| 修改变量 | 变量 `gold`，操作 `add`，值 `50` | 发放 50 金币奖励（击败森林狼更难，奖励更多） |
| 显示通知 | 消息 `任务完成：击败森林狼！获得 50 金币`，样式 `achievement` | 弹出金色成就通知 |
| 告诉 AI | 内容：`玩家刚刚完成了任务「击败森林狼」，获得了 50 金币奖励。请在回复中适当提及。` | 让 AI 知道发生了什么 |

::: info 行为的执行顺序
同一个行为里的动作是**按顺序执行**的。所以先标记完成 → 再加金币 → 再弹通知 → 最后告诉 AI。这个顺序很重要——如果先弹通知再标记完成，理论上没问题，但先改变量可以确保后续逻辑都基于最新状态。
:::

---

### 第 3 步：做任务追踪面板（消息渲染器）

这是让任务面板出现在聊天界面的关键步骤。

编辑器 → **消息渲染器** 标签页 → 选「自定义 TSX」→ 粘贴以下代码：

```tsx
export default function Renderer({ content, renderMarkdown, messageIndex }) {
  const api = useYumina();
  const msgs = api.messages || [];
  const isLastMsg = messageIndex === msgs.length - 1;

  // 读取变量
  const quest1Done = api.variables.quest_1_complete === true;
  const quest2Done = api.variables.quest_2_complete === true;
  const quest1Name = String(api.variables.quest_1_name || "寻找草药");
  const quest2Name = String(api.variables.quest_2_name || "击败森林狼");
  const gold = Number(api.variables.gold ?? 0);

  // 任务列表数据
  const quests = [
    { name: quest1Name, done: quest1Done, reward: 30 },
    { name: quest2Name, done: quest2Done, reward: 50 },
  ];

  const completedCount = quests.filter(q => q.done).length;

  return (
    <div>
      {/* 正常渲染消息文字 */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* 任务追踪面板——只在最后一条消息显示 */}
      {isLastMsg && (
        <div style={{
          marginTop: "16px",
          padding: "16px",
          background: "linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))",
          borderRadius: "12px",
          border: "1px solid #334155",
        }}>
          {/* 面板标题栏 */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}>
            <div style={{
              fontSize: "15px",
              fontWeight: "bold",
              color: "#e2e8f0",
              letterSpacing: "0.5px",
            }}>
              任务追踪
            </div>
            {/* 金币计数器 */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              background: "rgba(234,179,8,0.15)",
              border: "1px solid rgba(234,179,8,0.3)",
              borderRadius: "20px",
            }}>
              <span style={{ fontSize: "14px" }}>💰</span>
              <span style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#fbbf24",
              }}>
                {gold}
              </span>
            </div>
          </div>

          {/* 进度提示 */}
          <div style={{
            fontSize: "12px",
            color: "#64748b",
            marginBottom: "12px",
          }}>
            已完成 {completedCount}/{quests.length}
          </div>

          {/* 任务列表 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {quests.map((quest, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: quest.done
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(30,41,59,0.5)",
                  border: quest.done
                    ? "1px solid rgba(34,197,94,0.2)"
                    : "1px solid #1e293b",
                  borderRadius: "8px",
                }}
              >
                {/* 左侧：任务名称 */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  <span style={{
                    fontSize: "13px",
                    color: quest.done ? "#94a3b8" : "#e2e8f0",
                    textDecoration: quest.done ? "line-through" : "none",
                  }}>
                    {quest.name}
                  </span>
                </div>

                {/* 右侧：状态徽章 */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}>
                  {/* 奖励金额 */}
                  <span style={{
                    fontSize: "12px",
                    color: quest.done ? "#4ade80" : "#64748b",
                  }}>
                    {quest.done ? `+${quest.reward} 金` : `${quest.reward} 金`}
                  </span>

                  {/* 完成状态徽章 */}
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "bold",
                    background: quest.done
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(239,68,68,0.15)",
                    color: quest.done ? "#4ade80" : "#f87171",
                    border: quest.done
                      ? "1px solid rgba(34,197,94,0.3)"
                      : "1px solid rgba(239,68,68,0.25)",
                  }}>
                    {quest.done ? "✓" : "✗"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 全部完成提示 */}
          {completedCount === quests.length && (
            <div style={{
              marginTop: "12px",
              padding: "10px",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "13px",
              color: "#4ade80",
              fontWeight: "600",
            }}>
              所有任务已完成！
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### 代码逐段解释

别被代码长度吓到——它做的事情非常直观。一段一段来看：

#### 基础设置

```tsx
const api = useYumina();
const msgs = api.messages || [];
const isLastMsg = messageIndex === msgs.length - 1;
```

- `useYumina()` — 获取 Yumina API，可以读变量
- `isLastMsg` — 判断当前消息是不是最后一条。任务面板只在最后一条消息下面显示，避免每条消息都重复一个面板

#### 读取变量

```tsx
const quest1Done = api.variables.quest_1_complete === true;
const quest2Done = api.variables.quest_2_complete === true;
const quest1Name = String(api.variables.quest_1_name || "寻找草药");
const quest2Name = String(api.variables.quest_2_name || "击败森林狼");
const gold = Number(api.variables.gold ?? 0);
```

- `=== true` — 严格比较，确保只有布尔 `true` 才算完成。避免 `"true"`（字符串）或 `1`（数字）被误判
- `String(... || "寻找草药")` — 读取任务名称，如果变量不存在就用兜底值
- `Number(... ?? 0)` — 把金币转为数字。`?? 0` 表示变量不存在时用 0

#### 任务列表数据

```tsx
const quests = [
  { name: quest1Name, done: quest1Done, reward: 30 },
  { name: quest2Name, done: quest2Done, reward: 50 },
];
const completedCount = quests.filter(q => q.done).length;
```

把任务信息集中到一个数组里，方便用 `.map()` 循环渲染。`completedCount` 统计完成了几个，用于显示进度。

#### 状态徽章

```tsx
<span style={{
  background: quest.done
    ? "rgba(34,197,94,0.2)"    // 完成 → 绿色背景
    : "rgba(239,68,68,0.15)",  // 未完成 → 红色背景
  color: quest.done ? "#4ade80" : "#f87171",
}}>
  {quest.done ? "✓" : "✗"}
</span>
```

每个任务右侧有一个小方块——完成的是绿色勾号，未完成的是红色叉号。这就是 Badge（徽章）组件的效果。

#### 金币计数器

```tsx
<div style={{
  padding: "4px 12px",
  background: "rgba(234,179,8,0.15)",
  borderRadius: "20px",
}}>
  💰 {gold}
</div>
```

面板右上角的药丸形金币显示。每次完成任务后金币增加，面板会自动刷新显示最新数值。

#### 全部完成提示

```tsx
{completedCount === quests.length && (
  <div style={{ /* 绿色高亮样式 */ }}>
    所有任务已完成！
  </div>
)}
```

当所有任务都完成后，面板底部出现一行绿色文字。`completedCount === quests.length` 检查完成数是否等于总数。

::: tip 不想自己写代码？用工作室 AI
编辑器顶部 → 点击「进入工作室」→ AI 助手面板 → 用中文描述你想要什么（比如"做一个任务追踪面板，显示任务完成状态和金币"），AI 会帮你生成代码。
:::

---

### 第 4 步：保存并测试

1. 点击编辑器顶部的「保存」
2. 点击「开始游戏」或回到首页开一个新会话
3. 你会看到 AI 的回复下方出现任务追踪面板：两个红色 ✗ 标记的任务、金币 0
4. 发一条消息（比如"我在森林里搜寻草药"）——如果 AI 回复里提到了"草药"，面板会自动更新：「寻找草药」变成绿色 ✓，金币变成 30，弹出成就通知
5. 再发一条消息（比如"我遇到了森林狼，和它战斗"）——如果 AI 回复里包含"击败"和"狼"，第二个任务也完成，金币增加到 80
6. 两个任务都完成后，面板底部出现「所有任务已完成！」的绿色提示

**如果遇到问题：**

| 现象 | 可能的原因 | 解决方法 |
|------|-----------|---------|
| 看不到任务面板 | 消息渲染器代码没保存或有语法错误 | 检查消息渲染器底部的编译状态，应该显示绿色「OK」 |
| AI 提到了草药但任务没完成 | 行为的关键词和 AI 实际用词不一致 | 检查 AI 的回复里是否真的包含"草药"这两个字。如果 AI 用了别的词（比如"药草"），需要在行为里加上这个关键词 |
| 任务完成了但金币没变 | 行为里缺少「修改变量 gold add」动作 | 回到行为编辑器，确认在「修改变量 quest_1_complete」之后有「修改变量 gold add 30」 |
| 同一个任务重复触发奖励 | 条件没有配置 | 确认行为的 ONLY IF 条件里有 `quest_1_complete eq false`——只有未完成时才触发 |
| 面板没有实时更新 | 正常现象——面板在下一条消息时刷新 | 变量已经改了，等 AI 回复或你发下一条消息时面板会自动更新 |
| 通知没弹出 | 行为里缺少「显示通知」动作 | 确认动作列表里有显示通知，样式选 `achievement` |
| 击败狼的任务不触发 | 两个关键词必须同时出现 | 确认 AI 的回复里同时包含"击败"和"狼"。如果 AI 写的是"打败了狼"，你需要把关键词改成"打败"或者加上"打败"作为备选 |

---

## 进阶：扩展任务系统

掌握了基础之后，你可以在此基础上扩展更多功能。

### 加更多任务

在变量标签页增加新的布尔变量（`quest_3_complete`）和字符串变量（`quest_3_name`），然后在行为标签页创建对应的关键词触发行为。最后在消息渲染器的 `quests` 数组里加一行：

```tsx
const quests = [
  { name: quest1Name, done: quest1Done, reward: 30 },
  { name: quest2Name, done: quest2Done, reward: 50 },
  { name: quest3Name, done: quest3Done, reward: 100 },
];
```

### 让 AI 主动发布任务

你可以做一个「接受任务」的流程——AI 在对话中描述一个新任务，然后行为检测到特定关键词时动态修改任务名称变量：

| 动作类型 | 设置 |
|---------|------|
| 修改变量 | 变量 `quest_3_name`，操作 `set`，值 `护送商人到安全地带` |
| 显示通知 | 消息 `新任务：护送商人到安全地带`，样式 `achievement` |

### 结合商店系统

完成任务赚到的金币可以在商店里花掉。参考配方 #3（商店与交易）——用同一个 `gold` 变量，任务系统往里加金币，商店系统从里面扣金币。两个系统共享同一个经济体。

### 任务分支

你可以用行为的条件组合做出复杂的任务依赖关系。比如"只有完成了「寻找草药」才能接受「拯救村庄」任务"：

| 变量 | 运算符 | 值 |
|------|--------|-----|
| `quest_1_complete` | 等于 (eq) | `true` |
| `quest_3_complete` | 等于 (eq) | `false` |

两个条件同时满足时才触发——确保前置任务已完成，且当前任务还没做过。

---

## 速查表

| 你想做的事 | 怎么做 |
|-----------|--------|
| 记录任务完成状态 | 创建 boolean 变量，默认 `false`，分类选 标记 |
| 检测关键词触发任务完成 | 行为触发器选「AI 或玩家说了关键词」，填入关键词 |
| 防止重复触发 | 行为条件里加 `quest_complete eq false` |
| 完成时弹成就通知 | 行为动作：显示通知，样式 `achievement` |
| 完成时发金币 | 行为动作：修改变量，`gold` add 数量 |
| 让 AI 知道任务完成了 | 行为动作：告诉 AI，写一句话说明发生了什么 |
| 显示任务面板 | 消息渲染器里读变量、渲染勾/叉和金币 |
| 只在最后一条消息显示面板 | 消息渲染器里判断 `isLastMsg` |
| 任务完成后划线 | 用 `textDecoration: "line-through"` 样式 |
| 显示完成进度 | 用 `quests.filter(q => q.done).length` 计数 |
| 所有任务完成时特殊提示 | 判断 `completedCount === quests.length` |

---

## 直接试试——可导入的示例世界

下载这个 JSON 文件，导入即可体验完整的任务追踪系统：

<a href="/recipe-6-demo-zh.json" download>recipe-6-demo-zh.json</a>

**导入方法：**
1. 进入 Yumina → 我的世界 → 创建新世界
2. 在编辑器顶部点「更多操作」→「导入包」
3. 选择下载的 `.json` 文件
4. 世界会被创建，所有变量、行为和渲染器都已预配置好
5. 开一个新会话试试看

**包含内容：**
- 5 个变量（`quest_1_complete` 和 `quest_2_complete` 任务状态、`gold` 金币、`quest_1_name` 和 `quest_2_name` 任务名称）
- 2 条行为（寻找草药完成 + 击败森林狼完成，各含条件检查、变量修改、通知和告诉 AI）
- 一个消息渲染器（任务追踪面板：任务列表 + 状态徽章 + 金币计数器 + 完成进度）

---

::: tip 这是实战配方 #6
前面的配方教了场景跳转、战斗系统、商店交易和角色创建。这个配方教你用布尔变量 + 关键词触发 + 条件检查做出任务追踪系统。同样的模式可以扩展成成就系统、剧情进度追踪、支线任务树——任何需要"检测事件 → 标记状态 → 发放奖励 → 更新 UI"的玩法。
:::

</div>
