<div v-pre>

# 物品栏与装备

> 做一个物品栏网格——显示玩家收集到的所有物品，带图标和数量。消耗品可以使用（用掉后消失），装备可以穿戴。这篇教你怎么用 json 变量的 push/delete/merge 操作搭出一个完整的物品栏系统。

---

## 你要做的东西

一个嵌在聊天界面里的物品栏面板。玩家可以看到自己拥有的所有物品，每个物品显示图标、名称和数量。物品下方有操作按钮：

- **消耗品**（如药水）——点击「使用」按钮 → HP 恢复 20 → 药水数量减 1 → 数量为 0 时从背包移除 → 弹出「使用了药水！HP +20」通知
- **装备**（如铁剑）——点击「装备」按钮 → 武器槽显示「铁剑」→ AI 知道玩家手持铁剑 → 弹出「装备了铁剑！」通知

```
玩家点击药水的「使用」按钮
  → 触发 "use-potion" 行为
  → 行为检查：inventory 里有药水？
    → 有：hp 加 20，药水 count 减 1，弹出成功通知
    → 没有：弹出「没有药水可以使用！」警告

玩家点击铁剑的「装备」按钮
  → 触发 "equip-sword" 行为
  → equipped_weapon 设为 "铁剑"
  → 注入指令告诉 AI：玩家现在手持铁剑
  → 弹出「装备了铁剑！」通知
```

---

## 原理

这个物品栏系统的核心是 **json 变量**。普通变量（number、string）只能存一个值，但 json 变量可以存一整个数组或对象——非常适合用来表示物品列表。

Yumina 的行为系统对 json 变量提供了三种专用操作：

| 操作 | 作用 | 举例 |
|------|------|------|
| `push` | 往数组末尾添加一个元素 | 捡到新物品 → push 一个物品对象 |
| `delete` | 从数组中删除匹配的元素 | 用完药水 → delete 掉药水对象 |
| `merge` | 更新数组中匹配元素的字段 | 药水数量减 1 → merge 更新 count 字段 |

我们的物品栏变量是一个 JSON 数组，每个元素是一个物品对象：

```json
[
  { "name": "药水", "icon": "🧪", "count": 2 },
  { "name": "铁剑", "icon": "⚔️", "count": 1 }
]
```

整个流程：

```
消息渲染器（物品栏 UI）
  → 玩家点击药水的「使用」按钮
  → 调用 api.executeAction("use-potion")
  → 引擎找到动作 ID 为 "use-potion" 的行为
  → 检查条件：inventory 里有药水？
    → 通过 → 执行动作：hp +20，inventory merge 药水 count -1（或 delete），显示通知
    → 不通过 → 弹出「没有药水」警告
```

---

## 一步步来

### 第 1 步：创建变量

我们需要 3 个变量——物品栏（json 数组）、生命值（数字）、当前装备的武器（字符串）。

编辑器 → 左侧边栏 → **变量** 标签页 → 逐个点击「添加变量」

#### 变量 1：物品栏

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 物品栏 | 给你自己看的，方便识别 |
| ID | `inventory` | 代码和行为里用这个 ID 来读写 |
| 类型 | JSON | 物品栏是一个数组，需要 json 类型来存 |
| 默认值 | `[{"name":"药水","icon":"🧪","count":2},{"name":"铁剑","icon":"⚔️","count":1}]` | 新会话开始时玩家默认有 2 瓶药水和 1 把铁剑 |
| 分类 | 物品栏 | 归类到物品栏分类下 |
| 行为规则 | `不要修改这个变量。它由物品栏系统自动管理。` | 告诉 AI 不要自己往背包里塞东西 |

> **json 变量的默认值必须是合法的 JSON。** 注意用双引号包裹字段名和字符串值。每个物品对象有三个字段：`name`（名称，用于匹配和显示）、`icon`（图标，用于 UI 显示）、`count`（数量，消耗品需要追踪数量）。

#### 变量 2：生命值

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 生命值 | 方便识别 |
| ID | `hp` | 使用药水时回复 HP |
| 类型 | 数字 | HP 是数值，需要加减运算 |
| 默认值 | `80` | 不满血开局——这样玩家有动力使用药水 |
| 最小值 | `0` | 防止 HP 变成负数 |
| 最大值 | `100` | HP 上限 100，防止无限叠加 |
| 分类 | 属性 | 角色属性类变量 |
| 行为规则 | `不要直接修改这个变量。它由物品栏系统自动管理。当前值代表玩家的剩余生命值，最大 100。` | 防止 AI 擅自修改 |

#### 变量 3：当前武器

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 当前武器 | 方便识别 |
| ID | `equipped_weapon` | 记录玩家装备的武器名称 |
| 类型 | 字符串 | 存武器名字的文本 |
| 默认值 | *留空* | 空字符串 = 没装备武器 |
| 分类 | 自定义 | 装备状态类变量 |
| 行为规则 | `不要修改这个变量。它由装备系统自动管理。当前值代表玩家装备的武器名称，空字符串表示未装备。` | 防止 AI 擅自修改 |

> **为什么 equipped_weapon 用字符串而不是 json？** 因为玩家同一时间只能装备一把武器。一个简单的字符串就够了——空字符串表示没装备，`"铁剑"` 表示装备了铁剑。如果你想做多槽位装备系统（武器 + 护甲 + 饰品），可以改成 json 对象。

---

### 第 2 步：创建行为

我们需要 4 条行为——使用药水（成功/没有药水）和装备铁剑（成功/已装备）。

编辑器 → **行为** 标签页 → 点击「添加行为」

#### 行为 1：使用药水（成功）

**WHEN（什么时候检查）：**

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 触发器类型 | 动作按钮被按下 | 当消息渲染器调用 `executeAction("use-potion")` 时触发 |
| 动作 ID | `use-potion` | 和消息渲染器代码里的 `executeAction("use-potion")` 一致 |

**ONLY IF（条件）：**

| 变量 | 运算符 | 值 | 为什么 |
|------|--------|-----|--------|
| `inventory` | 包含 (contains) | `药水` | 检查物品栏里是否有药水 |

**DO（执行动作）：**

按顺序添加以下动作：

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 修改变量 | 变量 `hp`，操作 `add`，值 `20` | HP 恢复 20 点 |
| 修改变量 | 变量 `inventory`，操作 `delete`，值 `{"name":"药水"}` | 从物品栏中移除药水 |
| 显示通知 | 消息 `使用了药水！HP +20`，样式 `achievement` | 弹出金色成功通知 |

> **delete 操作怎么匹配？** 当你 delete `{"name":"药水"}` 时，引擎会在数组里找到第一个 `name` 字段等于 `"药水"` 的对象，整个删掉。不需要写完整的对象（不需要包含 icon 和 count），只要提供足够的字段让引擎能找到目标就行。

::: tip 想减少数量而不是直接删除？
如果你想让药水数量 -1（而不是直接整个移除），用 `merge` 操作代替 `delete`。merge `{"name":"药水","count":-1}` 会找到名为「药水」的对象，把它的 count 减 1。但你需要额外加一条行为：当 count 降到 0 时，再用 delete 把它移除。下面的「进阶」部分会讲这种做法。
:::

#### 行为 2：使用药水（没有药水）

这条行为也监听同一个动作 ID，但条件是"物品栏里**没有**药水"。

**WHEN：**

| 字段 | 填什么 |
|------|--------|
| 触发器类型 | 动作按钮被按下 |
| 动作 ID | `use-potion` |

**ONLY IF：**

| 变量 | 运算符 | 值 | 为什么 |
|------|--------|-----|--------|
| `inventory` | 不包含 (not_contains) | `药水` | 物品栏里没有药水 |

**DO：**

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 显示通知 | 消息 `没有药水可以使用！`，样式 `warning` | 弹出黄色警告 |

#### 行为 3：装备铁剑（成功）

**WHEN：**

| 字段 | 填什么 |
|------|--------|
| 触发器类型 | 动作按钮被按下 |
| 动作 ID | `equip-sword` |

**ONLY IF：**

| 变量 | 运算符 | 值 | 为什么 |
|------|--------|-----|--------|
| `inventory` | 包含 (contains) | `铁剑` | 物品栏里有铁剑才能装备 |

**DO：**

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 修改变量 | 变量 `equipped_weapon`，操作 `set`，值 `铁剑` | 把当前武器设为铁剑 |
| 告诉 AI | 内容：`玩家装备了铁剑。从现在开始，玩家手持一把铁制长剑。请在后续战斗描写和互动中体现这把武器的存在。` | 注入指令让 AI 知道玩家有武器了 |
| 显示通知 | 消息 `装备了铁剑！`，样式 `achievement` | 弹出金色成功通知 |

> **「告诉 AI」动作是什么？** 它会往 AI 的上下文里注入一条临时指令。这样 AI 在写下一条回复时，就知道玩家刚装备了铁剑，可以在剧情描写中体现（比如"你握紧手中的铁剑，寒光在火光中闪烁"）。

#### 行为 4：装备铁剑（已装备）

**WHEN：**

| 字段 | 填什么 |
|------|--------|
| 触发器类型 | 动作按钮被按下 |
| 动作 ID | `equip-sword` |

**ONLY IF：**

| 变量 | 运算符 | 值 | 为什么 |
|------|--------|-----|--------|
| `equipped_weapon` | 等于 (eq) | `铁剑` | 已经装备了铁剑，不需要重复装备 |

**DO：**

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 显示通知 | 消息 `铁剑已经装备着了！`，样式 `info` | 弹出蓝色提示 |

> **为什么要分两条行为？** 和商店配方一样——一条行为只能有一组条件。条件通过就执行，不通过就什么都不做。所以我们用两条行为覆盖两种情况。它们监听同一个动作 ID，但条件互斥，永远只有一条会触发。

---

### 第 3 步：做物品栏消息渲染器

这是让物品栏 UI 出现在聊天界面的关键步骤。我们会在最新的消息下方显示三个区域：HP 状态栏、装备槽、物品栏网格（每个物品带操作按钮）。

编辑器 → **消息渲染器** 标签页 → 选「自定义 TSX」→ 粘贴以下代码：

```tsx
export default function Renderer({ content, renderMarkdown, messageIndex }) {
  const api = useYumina();
  const msgs = api.messages || [];
  const isLastMsg = messageIndex === msgs.length - 1;

  // 读取变量
  const hp = Number(api.variables.hp ?? 80);
  const equippedWeapon = String(api.variables.equipped_weapon || "");
  const inventory = Array.isArray(api.variables.inventory)
    ? api.variables.inventory
    : [];

  // 物品类型映射：决定每种物品能做什么操作
  const itemActions = {
    "药水": { type: "consumable", actionId: "use-potion", label: "使用" },
    "铁剑": { type: "equipment", actionId: "equip-sword", label: "装备" },
  };

  return (
    <div>
      {/* 正常渲染消息文字 */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* 只在最后一条消息下方显示物品栏 */}
      {isLastMsg && (
        <div style={{
          marginTop: "16px",
          padding: "16px",
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: "12px",
          border: "1px solid #334155",
        }}>

          {/* ====== HP 状态栏 ====== */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px",
          }}>
            <span style={{ fontSize: "16px" }}>❤️</span>
            <div style={{ flex: 1 }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "4px",
              }}>
                <span style={{ color: "#94a3b8", fontSize: "12px" }}>HP</span>
                <span style={{ color: "#e2e8f0", fontSize: "12px", fontWeight: "bold" }}>
                  {hp} / 100
                </span>
              </div>
              <div style={{
                height: "8px",
                background: "#1e293b",
                borderRadius: "4px",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min(hp, 100)}%`,
                  background: hp > 50
                    ? "linear-gradient(90deg, #22c55e, #4ade80)"
                    : hp > 20
                      ? "linear-gradient(90deg, #eab308, #facc15)"
                      : "linear-gradient(90deg, #ef4444, #f87171)",
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }} />
              </div>
            </div>
          </div>

          {/* ====== 装备槽 ====== */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "14px",
            padding: "10px 14px",
            background: "rgba(30, 41, 59, 0.8)",
            borderRadius: "8px",
            border: "1px solid #475569",
          }}>
            <span style={{ fontSize: "16px" }}>⚔️</span>
            <span style={{ color: "#94a3b8", fontSize: "13px" }}>武器：</span>
            <span style={{
              color: equippedWeapon ? "#e2e8f0" : "#475569",
              fontSize: "13px",
              fontWeight: equippedWeapon ? "600" : "normal",
              fontStyle: equippedWeapon ? "normal" : "italic",
            }}>
              {equippedWeapon || "未装备"}
            </span>
          </div>

          {/* ====== 物品栏标题 ====== */}
          <div style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "#94a3b8",
            marginBottom: "10px",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}>
            物品栏
          </div>

          {/* ====== 物品栏网格 ====== */}
          {inventory.length === 0 ? (
            <div style={{
              padding: "24px",
              textAlign: "center",
              color: "#475569",
              fontSize: "13px",
              background: "rgba(30, 41, 59, 0.4)",
              borderRadius: "8px",
              border: "1px dashed #334155",
            }}>
              物品栏是空的
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "8px",
            }}>
              {inventory.map((item, idx) => {
                const name = String(item?.name || item);
                const icon = String(item?.icon || "📦");
                const count = Number(item?.count ?? 1);
                const action = itemActions[name];

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "12px 8px 8px",
                      background: "rgba(30, 41, 59, 0.8)",
                      borderRadius: "8px",
                      border: equippedWeapon === name
                        ? "1px solid #22d3ee"
                        : "1px solid #475569",
                      gap: "6px",
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{icon}</span>
                    <span style={{
                      color: "#e2e8f0",
                      fontSize: "12px",
                      fontWeight: "600",
                      textAlign: "center",
                    }}>
                      {name}
                    </span>
                    <span style={{
                      color: "#64748b",
                      fontSize: "11px",
                    }}>
                      x{count}
                    </span>

                    {/* 操作按钮 */}
                    {action && (
                      <button
                        onClick={() => api.executeAction(action.actionId)}
                        style={{
                          marginTop: "4px",
                          padding: "4px 14px",
                          background: action.type === "consumable"
                            ? "linear-gradient(135deg, #065f46, #047857)"
                            : equippedWeapon === name
                              ? "linear-gradient(135deg, #374151, #4b5563)"
                              : "linear-gradient(135deg, #1e3a5f, #1e40af)",
                          border: action.type === "consumable"
                            ? "1px solid #10b981"
                            : equippedWeapon === name
                              ? "1px solid #6b7280"
                              : "1px solid #3b82f6",
                          borderRadius: "6px",
                          color: action.type === "consumable"
                            ? "#a7f3d0"
                            : equippedWeapon === name
                              ? "#9ca3af"
                              : "#bfdbfe",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        {equippedWeapon === name ? "已装备" : action.label}
                      </button>
                    )}
                  </div>
                );
              })}
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

- `useYumina()` — 获取 Yumina API，可以读变量、触发动作
- `isLastMsg` — 判断当前消息是不是最后一条。物品栏面板只在最后一条消息下面显示，避免每条消息都重复

#### 读取变量

```tsx
const hp = Number(api.variables.hp ?? 80);
const equippedWeapon = String(api.variables.equipped_weapon || "");
const inventory = Array.isArray(api.variables.inventory)
  ? api.variables.inventory
  : [];
```

- `api.variables.hp` — 读取生命值。`?? 80` 是兜底——如果变量还没加载就用 80
- `api.variables.equipped_weapon` — 读取当前武器。空字符串表示没装备
- `api.variables.inventory` — 读取物品栏。用 `Array.isArray()` 确认它是数组，防止意外

#### 物品类型映射

```tsx
const itemActions = {
  "药水": { type: "consumable", actionId: "use-potion", label: "使用" },
  "铁剑": { type: "equipment", actionId: "equip-sword", label: "装备" },
};
```

这是一个查找表。根据物品名称决定按钮的文字和触发的动作 ID。`type` 字段用来区分消耗品和装备——消耗品按钮是绿色的，装备按钮是蓝色的。想加新物品？往这里加一行，再在编辑器里加对应的行为。

#### HP 状态栏

```tsx
<div style={{
  height: "100%",
  width: `${Math.min(hp, 100)}%`,
  background: hp > 50 ? "...绿色..." : hp > 20 ? "...黄色..." : "...红色...",
}} />
```

一个简单的进度条。宽度跟着 HP 变化，颜色也会变——高于 50 是绿色（安全），20-50 是黄色（警告），低于 20 是红色（危险）。`transition: "width 0.3s ease"` 让宽度变化有平滑动画。

#### 装备槽

```tsx
<span style={{
  color: equippedWeapon ? "#e2e8f0" : "#475569",
  fontStyle: equippedWeapon ? "normal" : "italic",
}}>
  {equippedWeapon || "未装备"}
</span>
```

显示当前装备的武器名称。没装备时显示灰色斜体的「未装备」，装备了就显示白色正体的武器名。

#### 物品栏网格

```tsx
<div style={{
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: "8px",
}}>
```

用 CSS Grid 把物品排成网格。`auto-fill` + `minmax(140px, 1fr)` 让格子自动适配宽度——因为每个格子里有按钮，所以最小宽度设为 140px，比纯展示的物品栏稍宽。

#### 操作按钮

```tsx
<button onClick={() => api.executeAction(action.actionId)}>
  {equippedWeapon === name ? "已装备" : action.label}
</button>
```

这是最核心的一行。点击按钮时调用 `api.executeAction("use-potion")` 或 `api.executeAction("equip-sword")`，引擎就去找对应的行为并执行。如果是装备类物品且已经装备，按钮文字变成「已装备」。

::: tip 不想自己写代码？用工作室 AI
编辑器顶部 → 点击「进入工作室」→ AI 助手面板 → 用中文描述你想要什么，比如"做一个物品栏网格，有 HP 条、装备槽，物品可以使用或装备"，AI 会帮你生成代码。
:::

---

### 第 4 步：保存并测试

1. 点击编辑器顶部的「保存」
2. 点击「开始游戏」或回到首页开一个新会话
3. 你会看到 AI 的回复下方出现物品栏面板：HP 80/100、武器未装备、2 个药水和 1 把铁剑
4. 点击药水下面的「使用」——HP 从 80 变成 100，药水消失，弹出金色通知「使用了药水！HP +20」
5. 点击铁剑下面的「装备」——装备槽显示「铁剑」，按钮变成灰色「已装备」，弹出「装备了铁剑！」
6. 再点一次铁剑的「已装备」按钮——弹出蓝色提示「铁剑已经装备着了！」
7. 继续和 AI 对话——如果你配了「告诉 AI」动作，AI 的回复会体现玩家手持铁剑

**如果遇到问题：**

| 现象 | 可能的原因 | 解决方法 |
|------|-----------|---------|
| 看不到物品栏面板 | 消息渲染器代码没保存或有语法错误 | 检查消息渲染器底部的编译状态，应该显示绿色「OK」 |
| 物品栏里没有物品 | json 变量默认值格式不对 | 确认默认值是合法的 JSON 数组，双引号包裹字段名 |
| 按钮点了没反应 | 行为的动作 ID 和代码里的不一致 | 确认行为的动作 ID 是 `use-potion` / `equip-sword`，和代码里 `executeAction()` 的参数一模一样 |
| 药水用了但没消失 | delete 操作的匹配值写错了 | 确认 delete 的值是 `{"name":"药水"}`——注意双引号 |
| HP 没变化 | 行为里的 add 操作没设置对 | 检查修改变量动作：变量选 `hp`，操作选 `add`，值填 `20` |
| 装备了但 AI 不知道 | 没加「告诉 AI」动作 | 在装备行为的 DO 里加一个「告诉 AI」动作 |

---

## 进阶：json 变量的三种操作详解

掌握了基础之后，来深入了解 json 变量的三种操作。这是物品栏系统的核心知识。

### push——添加物品

`push` 在数组末尾追加一个元素。

| 场景 | 操作 | 变量变化 |
|------|------|---------|
| 玩家捡到一瓶药水 | push `{"name":"药水","icon":"🧪","count":1}` | `[...]` → `[..., {"name":"药水","icon":"🧪","count":1}]` |
| 玩家获得新武器 | push `{"name":"魔法杖","icon":"🪄","count":1}` | `[...]` → `[..., {"name":"魔法杖","icon":"🪄","count":1}]` |

> **注意：** push 不会检查是否已有同名物品。如果物品栏里已经有「药水」，再 push 一个「药水」会变成两条记录。如果你想让同名物品叠加数量，应该用 merge 更新 count，而不是 push 新条目。

### delete——移除物品

`delete` 从数组中删除**第一个**匹配的元素。

| 场景 | 操作 | 变量变化 |
|------|------|---------|
| 用掉了药水 | delete `{"name":"药水"}` | `[{"name":"药水",...}, {"name":"铁剑",...}]` → `[{"name":"铁剑",...}]` |
| 丢弃铁剑 | delete `{"name":"铁剑"}` | `[{"name":"铁剑",...}]` → `[]` |

> **部分匹配就够了。** 你不需要写完整的对象，只要提供的字段能唯一匹配到目标就行。`{"name":"药水"}` 就能匹配到 `{"name":"药水","icon":"🧪","count":2}`。

### merge——更新物品字段

`merge` 找到匹配的元素，然后**合并/更新**指定的字段。

| 场景 | 操作 | 变量变化 |
|------|------|---------|
| 药水数量减 1 | merge `{"name":"药水","count":-1}` | `{"name":"药水","count":2}` → `{"name":"药水","count":1}` |
| 药水数量加 3 | merge `{"name":"药水","count":3}` | `{"name":"药水","count":1}` → `{"name":"药水","count":4}` |

> **merge 的 count 是增量还是赋值？** 取决于引擎的实现。在 Yumina 中，数字字段的 merge 是**增量操作**——`count: -1` 表示在现有值上减 1，而不是把 count 设为 -1。如果你想设为精确值，用 `set` 操作代替 merge。

### 组合使用的高级模式

**数量管理模式**——消耗品消耗时减数量，数量为 0 时移除：

```
行为 A：使用药水
  条件：inventory contains "药水"
  动作：
    1. 修改变量 hp，操作 add，值 20
    2. 修改变量 inventory，操作 merge，值 {"name":"药水","count":-1}
    3. 显示通知「使用了药水！HP +20」

行为 B：移除空药水条目
  条件：inventory contains "药水" AND 药水的 count = 0
  动作：
    1. 修改变量 inventory，操作 delete，值 {"name":"药水"}
```

**物品获取模式**——如果物品栏已有同名物品就叠加数量，否则添加新条目：

```
行为 A：获得药水（已有）
  条件：inventory contains "药水"
  动作：
    1. 修改变量 inventory，操作 merge，值 {"name":"药水","count":1}

行为 B：获得药水（新物品）
  条件：inventory not_contains "药水"
  动作：
    1. 修改变量 inventory，操作 push，值 {"name":"药水","icon":"🧪","count":1}
```

---

## 速查表

| 你想做的事 | 怎么做 |
|-----------|--------|
| 存储物品列表 | 创建 json 变量，默认值为数组 `[{...}, ...]` |
| 添加新物品 | 行为动作：修改变量，操作 `push`，值为物品对象 |
| 移除物品 | 行为动作：修改变量，操作 `delete`，值为匹配对象 |
| 更新物品数量 | 行为动作：修改变量，操作 `merge`，值含 count 增量 |
| 检查是否拥有某物品 | 行为条件：`inventory contains "物品名"` |
| 使用消耗品 | 行为：检查有无 → hp add → delete（或 merge count -1） |
| 装备物品 | 行为：set 装备变量 + 告诉 AI |
| 记录当前装备 | 创建 string 变量，空字符串 = 未装备 |
| 显示物品栏网格 | 消息渲染器里用 CSS Grid + `inventory.map()` |
| 按钮触发使用/装备 | 消息渲染器里调 `api.executeAction("动作ID")` |
| 让 AI 知道装备变化 | 行为里加「告诉 AI」动作 |

---

## 直接试试——可导入的示例世界

下载这个 JSON 文件，导入即可体验完整的物品栏系统：

<a href="/recipe-7-demo-zh.json" download>recipe-7-demo-zh.json</a>

**导入方法：**
1. 进入 Yumina → 我的世界 → 创建新世界
2. 在编辑器顶部点「更多操作」→「导入包」
3. 选择下载的 `.json` 文件
4. 世界会被创建，所有变量、行为和渲染器都已预配置好
5. 开一个新会话试试看

**包含内容：**
- 3 个变量（`inventory` 物品栏 + `hp` 生命值 + `equipped_weapon` 当前武器）
- 4 条行为（使用药水 成功/失败 + 装备铁剑 成功/已装备）
- 一个消息渲染器（HP 状态栏 + 装备槽 + 物品栏网格 + 操作按钮）

---

::: tip 这是实战配方 #7
前面的配方教了场景跳转、战斗系统、商店交易和角色创建。这个配方教你用 json 变量的 push/delete/merge 操作管理结构化数据，做出一个有使用和装备功能的物品栏。同样的模式可以用来做任务日志、技能树、制作配方——任何需要"管理一个列表、对列表元素做操作"的玩法。
:::

</div>
