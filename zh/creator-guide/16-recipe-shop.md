<div v-pre>

# 商店与交易

> 做一个商店 UI——玩家浏览商品、点击购买，金币自动扣除，物品自动进入背包。这篇教你怎么把变量、行为和根组件（Root Component）组合成一个完整的交易系统。

---

## 你要做的东西

一个嵌在聊天界面里的商店面板。玩家可以看到自己有多少金币、商店里卖什么、每样东西多少钱。点击「购买」按钮后：

- 金币自动减少对应的价格
- 物品自动添加到背包（json 数组）
- 弹出「购买成功！」通知
- 如果金币不够，弹出「金币不足！」警告，不会扣钱也不会加物品

底部还有一个物品栏网格，实时显示背包里的所有物品。

```
玩家点击「购买药水（20 金）」
  → 行为检查：gold >= 20？
    → 是：gold 减 20，inventory push "药水"，弹出成功通知
    → 否：弹出「金币不足！」警告
```

---

## 原理

这个商店系统用到了三个核心机制的组合：

1. **number 变量 + 条件检查** — 金币是一个数字变量，行为在执行前先检查它是否够用
2. **json 变量 + push 操作** — 背包是一个 json 数组，每次购买用 `push` 往里面添加物品
3. **action 触发器** — 每个购买按钮对应一个动作 ID，根组件里的按钮通过 `executeAction()` 触发行为

整个流程：

```
根组件里的按钮 UI
  → 玩家点击「购买药水」
  → 调用 api.executeAction("buy-potion")
  → 引擎找到动作 ID 为 "buy-potion" 的行为
  → 检查条件：gold >= 20？
    → 通过 → 执行动作：修改变量（gold -20）、修改变量（inventory push "药水"）、显示通知
    → 不通过 → 什么都不做（金币不足的提示由另一条行为处理）
```

---

## 一步步来

### 第 1 步：创建变量

我们需要两个变量——一个记录金币数量，一个记录背包里有什么。

编辑器 → 左侧边栏 → **变量** 标签页 → 点击「添加变量」

#### 变量 1：金币

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 金币 | 给你自己看的，方便识别 |
| ID | `gold` | 代码和行为里用这个 ID 来读写 |
| 类型 | 数字 | 金币是数值，需要加减运算 |
| 默认值 | `100` | 新会话开始时玩家有 100 金币 |
| 最小值 | `0` | 防止金币变成负数——引擎会自动钳制 |
| 分类 | 资源 | 金币属于资源类变量 |
| 行为规则 | `玩家通过商店购买物品时会自动扣减金币。你也可以在剧情中增减金币——例如完成任务奖励金币、被盗贼偷走金币、或者找到宝箱。` | 告诉 AI 金币可以在剧情中变化，不仅限于商店 |

> **为什么要设最小值 0？** 虽然我们在行为的条件里已经检查了"金币够不够"，但加一道引擎层面的保护更安全。万一某个地方漏了检查，金币也不会变成负数。

#### 变量 2：背包

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 背包 | 给你自己看的 |
| ID | `inventory` | 代码和行为里用这个 ID |
| 类型 | JSON | 背包是一个数组，需要 json 类型来存 |
| 默认值 | `[]` | 空数组——新会话开始时背包是空的 |
| 分类 | 物品栏 | 背包属于物品栏类变量 |
| 行为规则 | `商店购买会自动添加物品。你也可以在剧情中添加或移除物品——例如玩家捡到东西、物品损坏、被抢走、或作为任务奖励获得。` | 告诉 AI 背包可以在剧情中变化，不仅限于商店 |

> **json 类型变量可以存任何 JSON 数据结构。** 这里我们用数组（`[]`）来存物品名称的列表。每次购买物品时，用 `push` 操作往数组末尾添加一个字符串。比如买了一瓶药水后，变量值从 `[]` 变成 `["药水"]`，再买一把铁剑就变成 `["药水", "铁剑"]`。

---

### 第 2 步：创建商店行为

我们需要多条行为——每种商品的「购买成功」和「金币不足」各一条。这里以药水和铁剑为例。

编辑器 → **行为** 标签页 → 点击「添加行为」

#### 行为 1：购买药水（成功）

**WHEN（什么时候检查）：**

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 触发器类型 | 动作按钮被按下 | 当根组件调用 `executeAction("buy-potion")` 时触发 |
| 动作 ID | `buy-potion` | 和根组件代码里的 `executeAction("buy-potion")` 一致 |

**ONLY IF（条件）：**

| 变量 | 运算符 | 值 | 为什么 |
|------|--------|-----|--------|
| `gold` | 大于等于 (gte) | `20` | 药水售价 20 金——只有金币够才能买 |

**DO（执行动作）：**

按顺序添加以下动作：

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 修改变量 | 变量 `gold`，操作 `subtract`，值 `20` | 扣除 20 金币 |
| 修改变量 | 变量 `inventory`，操作 `push`，值 `"药水"` | 把「药水」添加到背包数组 |
| 显示通知 | 消息 `购买成功！获得了药水。`，样式 `achievement` | 弹出金色成功通知 |

> **push 操作是 json 数组专用的。** 它会在数组末尾追加一个元素，不会覆盖已有内容。所以每次买药水，背包里就多一个 `"药水"` 字符串。

#### 行为 2：购买药水（金币不足）

这条行为也监听同一个动作 ID，但条件是"金币**不够**"。

**WHEN：**

| 字段 | 填什么 |
|------|--------|
| 触发器类型 | 动作按钮被按下 |
| 动作 ID | `buy-potion` |

**ONLY IF：**

| 变量 | 运算符 | 值 | 为什么 |
|------|--------|-----|--------|
| `gold` | 小于 (lt) | `20` | 金币少于 20，买不起 |

**DO：**

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 显示通知 | 消息 `金币不足！药水需要 20 金。`，样式 `warning` | 弹出黄色警告 |

> **为什么要分两条行为？** 因为一条行为只能有一组条件。如果条件通过就执行动作，不通过就什么都不做。所以我们用两条行为覆盖两种情况：金币够 → 购买成功；金币不够 → 弹警告。它们监听同一个动作 ID，但条件互斥，所以永远只有一条会触发。

#### 行为 3：购买铁剑（成功）

**WHEN：**

| 字段 | 填什么 |
|------|--------|
| 触发器类型 | 动作按钮被按下 |
| 动作 ID | `buy-sword` |

**ONLY IF：**

| 变量 | 运算符 | 值 |
|------|--------|-----|
| `gold` | 大于等于 (gte) | `50` |

**DO：**

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 修改变量 | 变量 `gold`，操作 `subtract`，值 `50` | 扣除 50 金币 |
| 修改变量 | 变量 `inventory`，操作 `push`，值 `"铁剑"` | 把「铁剑」添加到背包数组 |
| 显示通知 | 消息 `购买成功！获得了铁剑。`，样式 `achievement` | 弹出金色成功通知 |

#### 行为 4：购买铁剑（金币不足）

**WHEN：**

| 字段 | 填什么 |
|------|--------|
| 触发器类型 | 动作按钮被按下 |
| 动作 ID | `buy-sword` |

**ONLY IF：**

| 变量 | 运算符 | 值 |
|------|--------|-----|
| `gold` | 小于 (lt) | `50` |

**DO：**

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 显示通知 | 消息 `金币不足！铁剑需要 50 金。`，样式 `warning` | 弹出黄色警告 |

::: tip 想加更多商品？
重复上面的模式就行——每种商品两条行为（成功 + 不足），只需要改动作 ID、价格、物品名称。比如加一个 30 金的「盾牌」：动作 ID `buy-shield`，条件 `gold gte 30`，动作 `subtract 30` + `push "盾牌"`。
:::

---

### 第 3 步：在根组件里加商店面板

这是让商店 UI 出现在聊天界面的关键步骤。我们会在消息下方显示三个区域：金币余额、商品列表（带购买按钮）、背包物品栏。

编辑器 → **自定义 UI（Custom UI）** 区域 → 打开 `index.tsx` → 粘贴以下代码（替换默认的 `return <Chat />`）：

```tsx
export default function MyWorld() {
  const api = useYumina();
  const msgs = api.messages || [];

  // 读取变量
  const gold = Number(api.variables.gold ?? 100);
  const inventory = Array.isArray(api.variables.inventory)
    ? api.variables.inventory
    : [];

  // 商品列表定义
  const shopItems = [
    { name: "药水",   price: 20, actionId: "buy-potion", icon: "🧪", desc: "恢复少量生命值" },
    { name: "铁剑",   price: 50, actionId: "buy-sword",  icon: "⚔️", desc: "一把普通的铁剑" },
  ];

  return (
    <Chat renderBubble={(msg) => {
      const isLastMsg = msg.messageIndex === msgs.length - 1;
      return (
    <div>
      {/* 正常渲染消息文字（平台已经转好 HTML，直接用 contentHtml） */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: msg.contentHtml }}
      />

      {/* 只在最后一条消息下方显示商店 */}
      {isLastMsg && (
        <div style={{
          marginTop: "16px",
          padding: "16px",
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "12px",
          border: "1px solid #334155",
        }}>

          {/* ====== 金币显示 ====== */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            padding: "10px 14px",
            background: "linear-gradient(135deg, #78350f, #92400e)",
            borderRadius: "8px",
            border: "1px solid #b45309",
          }}>
            <span style={{ fontSize: "20px" }}>💰</span>
            <span style={{ color: "#fde68a", fontSize: "16px", fontWeight: "bold" }}>
              {gold} 金币
            </span>
          </div>

          {/* ====== 商店标题 ====== */}
          <div style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "#94a3b8",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}>
            商店
          </div>

          {/* ====== 商品列表 ====== */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {shopItems.map((item) => (
              <div
                key={item.actionId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "rgba(30, 41, 59, 0.8)",
                  borderRadius: "8px",
                  border: "1px solid #475569",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "22px" }}>{item.icon}</span>
                  <div>
                    <div style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: "600" }}>
                      {item.name}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => api.executeAction(item.actionId)}
                  style={{
                    padding: "6px 16px",
                    background: gold >= item.price
                      ? "linear-gradient(135deg, #065f46, #047857)"
                      : "linear-gradient(135deg, #374151, #4b5563)",
                    border: gold >= item.price
                      ? "1px solid #10b981"
                      : "1px solid #6b7280",
                    borderRadius: "6px",
                    color: gold >= item.price ? "#a7f3d0" : "#9ca3af",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: gold >= item.price ? "pointer" : "not-allowed",
                    opacity: gold >= item.price ? 1 : 0.6,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.price} 金
                </button>
              </div>
            ))}
          </div>

          {/* ====== 背包标题 ====== */}
          <div style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "#94a3b8",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}>
            背包
          </div>

          {/* ====== 物品栏网格 ====== */}
          {inventory.length === 0 ? (
            <div style={{
              padding: "20px",
              textAlign: "center",
              color: "#475569",
              fontSize: "13px",
              background: "rgba(30, 41, 59, 0.4)",
              borderRadius: "8px",
              border: "1px dashed #334155",
            }}>
              背包是空的
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: "8px",
            }}>
              {inventory.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px 6px",
                    background: "rgba(30, 41, 59, 0.8)",
                    borderRadius: "8px",
                    border: "1px solid #475569",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "24px" }}>
                    {item === "药水" ? "🧪" : item === "铁剑" ? "⚔️" : "📦"}
                  </span>
                  <span style={{ color: "#cbd5e1", fontSize: "11px", textAlign: "center" }}>
                    {String(item)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
      );
    }} />
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
// ...
<Chat renderBubble={(msg) => {
  const isLastMsg = msg.messageIndex === msgs.length - 1;
  // ...
}} />
```

- 根组件 `MyWorld()` 是世界 UI 的入口。`<Chat renderBubble={...} />` 让平台继续负责消息列表、输入框、滚动，我们只接管单条消息气泡的样子
- `useYumina()` — 获取 Yumina API，可以读变量、触发动作
- `msg.messageIndex` — 当前这条气泡在消息列表里的索引，用来判断是不是最后一条。商店面板只在最后一条消息下面显示，避免每条消息都重复一个商店
- `msg.contentHtml` — 平台已经把 Markdown 渲染好的 HTML，直接 `dangerouslySetInnerHTML` 就行

#### 读取变量

```tsx
const gold = Number(api.variables.gold ?? 100);
const inventory = Array.isArray(api.variables.inventory)
  ? api.variables.inventory
  : [];
```

- `api.variables.gold` — 读取金币变量。`?? 100` 是兜底——如果变量还没加载就用 100
- `api.variables.inventory` — 读取背包变量。先用 `Array.isArray()` 确认它真的是数组，防止意外情况

#### 商品列表定义

```tsx
const shopItems = [
  { name: "药水",   price: 20, actionId: "buy-potion", icon: "🧪", desc: "恢复少量生命值" },
  { name: "铁剑",   price: 50, actionId: "buy-sword",  icon: "⚔️", desc: "一把普通的铁剑" },
];
```

把商品信息集中定义在一个数组里，后面用 `.map()` 循环渲染。想加新商品？往数组里加一行就行——当然你也需要在编辑器里加对应的行为。

#### 购买按钮

```tsx
<button onClick={() => api.executeAction(item.actionId)}>
  {item.price} 金
</button>
```

这是最核心的一行。点击按钮时调用 `api.executeAction("buy-potion")`，引擎就会去找动作 ID 为 `"buy-potion"` 的行为，检查条件，执行动作。**所有的逻辑（检查金币够不够、扣钱、加物品、弹通知）都在行为里定义好了**，按钮只负责触发。

#### 按钮状态视觉反馈

```tsx
background: gold >= item.price
  ? "linear-gradient(135deg, #065f46, #047857)"   // 买得起 → 绿色
  : "linear-gradient(135deg, #374151, #4b5563)",   // 买不起 → 灰色
cursor: gold >= item.price ? "pointer" : "not-allowed",
opacity: gold >= item.price ? 1 : 0.6,
```

根据金币是否足够，动态切换按钮的颜色、鼠标样式和透明度。买得起的商品按钮是绿色的，买不起的变灰。这只是视觉提示——实际的购买逻辑在行为的条件里。

#### 物品栏网格

```tsx
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
  gap: "8px",
}}>
  {inventory.map((item, idx) => (
    <div key={idx} style={{ /* 格子样式 */ }}>
      <span>{item === "药水" ? "🧪" : item === "铁剑" ? "⚔️" : "📦"}</span>
      <span>{String(item)}</span>
    </div>
  ))}
</div>
```

用 CSS Grid 把背包物品排成网格。`auto-fill` + `minmax(80px, 1fr)` 让格子自动适配宽度——窗口宽就多排几个，窗口窄就少排几个。每个格子显示物品图标和名称。

::: tip 不想自己写代码？用工作室 AI
编辑器顶部 → 点击「进入工作室」→ AI 助手面板 → 用中文描述你想要什么，比如"做一个商店界面，有金币显示、商品列表和背包网格"，AI 会帮你生成代码。
:::

---

### 第 4 步：保存并测试

1. 点击编辑器顶部的「保存」
2. 点击「开始游戏」或回到首页开一个新会话
3. 你会看到 AI 的回复下方出现商店面板：金币 100、两个商品、空背包
4. 点击「20 金」购买药水——金币变成 80，背包里出现药水图标，弹出金色通知「购买成功！获得了药水。」
5. 再点一次——金币变成 60，背包里有两个药水
6. 点击「50 金」购买铁剑——金币变成 10，背包里多了一把铁剑
7. 现在再试着买任何东西——弹出黄色警告「金币不足！」，金币和背包不变
8. 继续和 AI 对话——商店面板会一直显示在最新的消息下方，状态实时更新

**如果遇到问题：**

| 现象 | 可能的原因 | 解决方法 |
|------|-----------|---------|
| 看不到商店面板 | 根组件代码没保存或有语法错误 | 检查自定义 UI 底部的编译状态，应该显示绿色「OK」 |
| 按钮点了没反应 | 行为的动作 ID 和代码里的不一致 | 确认行为的动作 ID 是 `buy-potion` / `buy-sword`，和代码里 `executeAction()` 的参数一模一样 |
| 金币扣了但背包没变 | 行为里的 push 操作没设置对 | 检查修改变量动作：变量选 `inventory`，操作选 `push`，值填 `"药水"`（要带引号） |
| 金币不够但没弹警告 | 「金币不足」的行为条件写反了 | 确认条件是 `gold lt 20`（小于），不是 `gold gte 20` |
| 背包里的物品不显示图标 | 物品名称和代码里的判断不一致 | 确认行为 push 的值和代码里的图标映射一致（`"药水"` 对应 `"🧪"`） |
| 购买后金币显示没更新 | 正常现象——等下一条消息就会刷新 | 发一条消息后检查，或者检查通知是否弹出了（通知弹出说明购买成功了） |

---

## 进阶：扩展商店系统

掌握了基础之后，你可以用同样的模式做更复杂的系统。

### 加更多商品

在根组件的 `shopItems` 数组里加一行：

```tsx
const shopItems = [
  { name: "药水",   price: 20, actionId: "buy-potion", icon: "🧪", desc: "恢复少量生命值" },
  { name: "铁剑",   price: 50, actionId: "buy-sword",  icon: "⚔️", desc: "一把普通的铁剑" },
  { name: "盾牌",   price: 30, actionId: "buy-shield",  icon: "🛡️", desc: "提供基本防护" },
  { name: "魔法卷轴", price: 80, actionId: "buy-scroll", icon: "📜", desc: "释放一次火球术" },
];
```

然后在编辑器的行为标签页里，给每个新商品创建两条行为（成功 + 不足），和药水、铁剑的模式完全一样。

### 让 AI 知道玩家买了什么

如果你想让 AI 的剧情随购买行为变化（比如买了铁剑后 AI 知道玩家有武器了），可以在购买成功的行为里额外加一个「告诉 AI」动作：

| 动作类型 | 设置 |
|---------|------|
| 告诉 AI | 内容：`玩家刚刚在商店购买了铁剑。请在后续回复中适当提及这把武器。` |

这会往 AI 的上下文里注入一条临时指令，让 AI 知道发生了什么。

### 赚取金币

现在玩家只能花钱，不能赚钱。你可以用行为给玩家发金币：

- **每回合奖励**：创建一条行为，触发器选「每 N 回合」（比如每 3 回合），动作是 `修改变量 gold add 10`。每 3 轮对话自动获得 10 金币。
- **关键词奖励**：触发器选「AI 说了关键词」，关键词填「战斗胜利」或「完成任务」。当 AI 在回复中提到这些词时，自动给玩家加金币。
- **手动奖励按钮**：在根组件里加一个「工作赚钱」按钮，用 `executeAction("earn-gold")` 触发一条行为，动作是 `gold add 15`。

---

## 速查表

| 你想做的事 | 怎么做 |
|-----------|--------|
| 记录金币 | 创建 number 变量，分类选 资源 |
| 记录背包 | 创建 json 变量，默认值 `[]`，分类选 物品栏 |
| 买东西扣钱 | 行为动作：修改变量，操作 `subtract` |
| 买东西加物品 | 行为动作：修改变量，操作 `push` |
| 检查金币够不够 | 行为条件：`gold gte 价格` |
| 金币不足弹提示 | 另一条行为，条件 `gold lt 价格`，动作 显示通知（warning） |
| 购买成功弹提示 | 行为动作：显示通知（achievement 样式） |
| 按钮触发购买 | 根组件里调 `api.executeAction("动作ID")` |
| 显示物品栏网格 | 根组件里用 CSS Grid + `inventory.map()` 渲染 |
| 加更多商品 | 往 shopItems 数组加一行 + 行为里加两条规则 |

---

## 直接试试——可导入的示例世界

下载这个 JSON 文件，导入即可体验完整的商店系统：

<a href="/recipe-3-demo-zh.json" download>recipe-3-demo-zh.json</a>

**导入方法：**
1. 进入 Yumina → 我的世界 → 创建新世界
2. 在编辑器顶部点「更多操作」→「导入包」
3. 选择下载的 `.json` 文件
4. 世界会被创建，所有变量、行为和渲染器都已预配置好
5. 开一个新会话试试看

**包含内容：**
- 2 个变量（`gold` 金币 + `inventory` 背包）
- 4 条行为（药水购买成功/不足 + 铁剑购买成功/不足）
- 一个根组件（金币显示 + 商品列表 + 物品栏网格）

---

::: tip 这是实战配方 #3
前面的配方教了场景跳转和条目修改，这个配方教你用变量条件检查 + json 数组 + 行为动作组合做出交互系统。同样的模式可以用来做任务系统、战斗系统、制作系统——任何需要"检查条件 → 扣资源 → 加物品 → 给反馈"的玩法。
:::

</div>
