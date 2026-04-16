<div v-pre>

# 物品栏与装备

> 做一个物品栏网格——显示玩家收集到的所有物品，带图标和数量。消耗品可以使用（用掉后消失），装备可以穿戴。这篇教你怎么用 JSON 变量、渲染器逻辑和行为系统搭出一个完整的物品栏系统。

---

## 你要做的东西

一个嵌在聊天界面里的物品栏面板。玩家可以看到自己拥有的所有物品，每个物品显示图标、名称和数量。物品下方有操作按钮：

- **消耗品**（如药水）——点击「使用」按钮 → HP 恢复 20 → 药水数量减 1 → 数量为 0 时从背包移除 → 弹出「使用了药水！HP +20」提示
- **装备**（如铁剑）——点击「装备」按钮 → 武器槽显示「铁剑」→ AI 知道玩家手持铁剑 → 弹出「装备了铁剑！」通知

```
玩家点击药水的「使用」按钮
  → 渲染器检查：物品栏里有药水吗？
    → 有：更新物品栏数组，hp +20，弹出成功提示
    → 没有：弹出「没有药水了！」警告

玩家点击铁剑的「装备」按钮
  → 渲染器检查：已经装备了？
    → 没有：触发 "equip-sword" 行为
    → 行为设置 equipped_weapon，告诉 AI，弹出通知
    → 已装备：弹出「已经装备着了！」提示
```

---

## 原理

物品栏存在一个 **JSON 变量**里——一个变量就能存储整个物品对象数组。根组件（Root Component）读取这个数组来显示网格，玩家使用或获取物品时，根组件通过 `api.setVariable()` 直接操作数组。

**为什么在渲染器里处理逻辑？** 行为系统的条件运算符（`eq`、`neq`、`gt`、`lt`、`contains` 等）作用于简单值——数字、字符串、布尔值。它们无法搜索 JSON 数组内部（比如"数组里有没有一个 name 等于'药水'的对象？"）。对于物品栏这种复杂数据结构，渲染器是处理逻辑的合适场所，因为那里可以用 JavaScript。

行为仍然用于它们擅长的事：设置简单变量（`equipped_weapon`）、注入 AI 指令（「告诉 AI」）、显示通知。

**分工：**

| 什么事 | 在哪里做 | 为什么 |
|--------|---------|--------|
| 显示物品栏网格 | 渲染器 | 读取 JSON 数组并渲染 UI |
| 使用消耗品 | 渲染器 | 需要查找、更新、移除数组元素 |
| 装备武器 | 行为 | 设置字符串变量 + 告诉 AI |
| 告诉 AI 变化 | 行为 | 只有行为能注入 AI 指令 |

---

## 一步步来

### 第 1 步：创建变量

我们需要 3 个变量——物品栏（JSON 数组）、生命值（数字）、当前装备的武器（字符串）。

编辑器 → 左侧边栏 → **变量** 标签页 → 逐个点击「添加变量」

#### 变量 1：物品栏

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 物品栏 | 给你自己看的，方便识别 |
| ID | `inventory` | 代码和行为里用这个 ID 来读写 |
| 类型 | JSON | 物品栏是一个数组，需要 JSON 类型来存 |
| 默认值 | `[{"name":"药水","icon":"🧪","count":2},{"name":"铁剑","icon":"⚔️","count":1}]` | 新会话开始时玩家默认有 2 瓶药水和 1 把铁剑 |
| 分类 | 物品栏 | 归类到物品栏分类下 |
| 行为规则 | `物品栏按钮会自动管理使用和装备操作。你也可以在剧情中添加物品（玩家捡到、获得奖励）或移除物品（损坏、丢失、被偷）。` | 告诉 AI 背包在剧情中也可以变化 |

> **JSON 变量的默认值必须是合法的 JSON。** 注意用双引号包裹字段名和字符串值。每个物品对象有三个字段：`name`（名称，用于匹配和显示）、`icon`（图标，用于 UI 显示）、`count`（数量，消耗品需要追踪数量）。

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
| 行为规则 | `当前值代表玩家的剩余生命值（0-100）。在战斗或危险场景中减少，使用药水或休息时增加。` | 告诉 AI 什么时候该改 HP |

#### 变量 3：当前武器

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 当前武器 | 方便识别 |
| ID | `equipped_weapon` | 记录玩家装备的武器名称 |
| 类型 | 字符串 | 存武器名字的文本 |
| 默认值 | *留空* | 空字符串 = 没装备武器 |
| 分类 | 自定义 | 装备状态类变量 |
| 行为规则 | `当前值代表玩家装备的武器名称，空字符串表示未装备。装备按钮会自动设置，但你也可以在剧情中改变——例如武器损坏、被夺走、或获得新武器。` | 告诉 AI 装备状态在剧情中也可能变化 |

> **为什么 equipped_weapon 用字符串而不是 JSON？** 因为玩家同一时间只能装备一把武器。一个简单的字符串就够了——空字符串表示没装备，`"铁剑"` 表示装备了铁剑。如果你想做多槽位装备系统（武器 + 护甲 + 饰品），可以改成 JSON 对象。

---

### 第 2 步：创建行为

我们需要 2 条行为——装备铁剑（成功和已装备）。药水使用完全在渲染器里处理。

编辑器 → **行为** 标签页 → 点击「添加行为」

#### 行为 1：装备铁剑（成功）

**WHEN（什么时候检查）：**

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 触发器类型 | 动作按钮被按下 | 当根组件调用 `executeAction("equip-sword")` 时触发 |
| 动作 ID | `equip-sword` | 和根组件代码里的 `executeAction("equip-sword")` 一致 |

**ONLY IF（条件）：**

| 变量 | 运算符 | 值 | 为什么 |
|------|--------|-----|--------|
| `equipped_weapon` | 不等于 (neq) | `铁剑` | 还没装备铁剑——防止和行为 2（已装备）重叠 |

**DO（执行动作）：**

按顺序添加以下动作：

| 动作类型 | 设置 | 作用 |
|---------|------|------|
| 修改变量 | 变量 `equipped_weapon`，操作 `set`，值 `铁剑` | 把当前武器设为铁剑 |
| 告诉 AI | 内容：`玩家装备了铁剑。从现在开始，玩家手持一把铁制长剑。请在后续战斗描写和互动中体现这把武器的存在。` | 注入指令让 AI 知道玩家有武器了 |
| 显示通知 | 消息 `装备了铁剑！`，样式 `achievement` | 弹出金色成功通知 |

> **「告诉 AI」动作是什么？** 它会往 AI 的上下文里注入一条临时指令。这样 AI 在写下一条回复时，就知道玩家刚装备了铁剑，可以在剧情描写中体现（比如"你握紧手中的铁剑，寒光在火光中闪烁"）。

#### 行为 2：装备铁剑（已装备）

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

> **为什么没有「使用药水」行为？** 因为检查 JSON 数组里是否包含某个特定物品需要用 JavaScript——行为系统的 `contains` 运算符只能用于字符串，不能搜索数组。所以药水的逻辑放在根组件里，用 JavaScript 直接操作数组，然后通过 `api.setVariable()` 更新变量。

---

### 第 3 步：在根组件里加物品栏面板

这是让物品栏 UI 出现在聊天界面的关键步骤。我们会在最新的消息下方显示三个区域：HP 状态栏、装备槽、物品栏网格（每个物品带操作按钮）。

编辑器 → **自定义 UI（Custom UI）** 区域 → 打开 `index.tsx` → 粘贴以下代码（替换默认的 `return <Chat />`）：

```tsx
export default function MyWorld() {
  var api = useYumina();
  var msgs = api.messages || [];

  // 读取变量
  var hp = Number(api.variables.hp ?? 80);
  var equippedWeapon = String(api.variables.equipped_weapon || "");
  var inventory = Array.isArray(api.variables.inventory)
    ? api.variables.inventory
    : [];

  // ── 物品栏逻辑（在根组件中运行） ──

  function useItem(itemName) {
    var inv = Array.isArray(api.variables.inventory)
      ? api.variables.inventory
      : [];
    var idx = -1;
    for (var i = 0; i < inv.length; i++) {
      if (inv[i] && inv[i].name === itemName) { idx = i; break; }
    }
    if (idx === -1) {
      api.showToast("没有" + itemName + "了！", "error");
      return;
    }
    var item = inv[idx];
    var newInv = inv.slice(); // 复制数组
    if (Number(item.count) <= 1) {
      newInv.splice(idx, 1); // 完全移除
    } else {
      newInv[idx] = { name: item.name, icon: item.icon, count: Number(item.count) - 1 };
    }
    api.setVariable("inventory", newInv);

    // 药水专属：回复 HP
    if (itemName === "药水") {
      var currentHp = Number(api.variables.hp ?? 0);
      api.setVariable("hp", Math.min(currentHp + 20, 100));
      api.showToast("使用了药水！HP +20", "success");
    }
  }

  function equipItem(itemName, actionId) {
    if (equippedWeapon === itemName) {
      api.showToast(itemName + "已经装备着了！", "info");
      return;
    }
    api.executeAction(actionId); // 触发行为来设置变量 + 告诉 AI
  }

  // 物品类型映射：决定每种物品能做什么操作
  var itemActions = {
    "药水": { type: "consumable", handler: function() { useItem("药水"); }, label: "使用" },
    "铁剑": { type: "equipment", handler: function() { equipItem("铁剑", "equip-sword"); }, label: "装备" },
  };

  return (
    <Chat renderBubble={(msg) => {
      var isLastMsg = msg.messageIndex === msgs.length - 1;
      return (
    <div>
      {/* 正常渲染消息文字（平台已经转好 HTML，直接用 contentHtml） */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: msg.contentHtml }}
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
                  width: Math.min(hp, 100) + "%",
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
              {inventory.map(function(item, idx) {
                var name = String(item?.name || item);
                var icon = String(item?.icon || "📦");
                var count = Number(item?.count ?? 1);
                var action = itemActions[name];

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
                        onClick={action.handler}
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
    }} />
  );
}
```

---

### 代码逐段解释

别被代码长度吓到——它做的事情非常直观。一段一段来看：

#### 基础设置

```tsx
var api = useYumina();
var msgs = api.messages || [];
// ...
<Chat renderBubble={(msg) => {
  var isLastMsg = msg.messageIndex === msgs.length - 1;
  // ...
}} />
```

- 根组件 `MyWorld()` 是世界 UI 的入口。`<Chat renderBubble={...} />` 让平台继续负责消息列表、输入框、滚动，我们只接管单条消息气泡的样子
- `useYumina()` — 获取 Yumina API，可以读变量、触发动作
- `msg.messageIndex` — 这条气泡在消息列表里的索引。物品栏面板只在最后一条消息下面显示，避免每条消息都重复
- `msg.contentHtml` — 平台已经把 Markdown 渲染好的 HTML，直接 `dangerouslySetInnerHTML` 就行

#### 读取变量

```tsx
var hp = Number(api.variables.hp ?? 80);
var equippedWeapon = String(api.variables.equipped_weapon || "");
var inventory = Array.isArray(api.variables.inventory)
  ? api.variables.inventory
  : [];
```

- `api.variables.hp` — 读取生命值。`?? 80` 是兜底——如果变量还没加载就用 80
- `api.variables.equipped_weapon` — 读取当前武器。空字符串表示没装备
- `api.variables.inventory` — 读取物品栏。用 `Array.isArray()` 确认它是数组，防止意外

#### 物品栏逻辑函数

```tsx
function useItem(itemName) {
  var inv = Array.isArray(api.variables.inventory)
    ? api.variables.inventory : [];
  var idx = -1;
  for (var i = 0; i < inv.length; i++) {
    if (inv[i] && inv[i].name === itemName) { idx = i; break; }
  }
  if (idx === -1) {
    api.showToast("没有" + itemName + "了！", "error");
    return;
  }
  // ... 更新数组并调用 api.setVariable()
}
```

这是核心模式。因为行为系统的条件运算符无法搜索 JSON 数组内部，所以我们在渲染器里直接处理逻辑：

1. **找到物品** — 遍历数组，按 `name` 匹配
2. **检查是否存在** — 如果没找到，弹出错误提示
3. **更新数组** — 减少数量或完全移除
4. **写回变量** — 调用 `api.setVariable("inventory", newInv)` 保存变更

对于装备，`equipItem()` 委托给 `api.executeAction()`，因为行为负责设置变量和注入 AI 指令：

```tsx
function equipItem(itemName, actionId) {
  if (equippedWeapon === itemName) {
    api.showToast(itemName + "已经装备着了！", "info");
    return;
  }
  api.executeAction(actionId);
}
```

#### 物品类型映射

```tsx
var itemActions = {
  "药水": { type: "consumable", handler: function() { useItem("药水"); }, label: "使用" },
  "铁剑": { type: "equipment", handler: function() { equipItem("铁剑", "equip-sword"); }, label: "装备" },
};
```

这是一个查找表。根据物品名称决定按钮的文字和要调用的处理函数。`type` 字段用来区分消耗品和装备——消耗品按钮是绿色的，装备按钮是蓝色的。想加新物品？往这里加一行。消耗品加逻辑到 `useItem`，装备则在编辑器里创建对应的行为。

#### 操作按钮

```tsx
<button onClick={action.handler}>
  {equippedWeapon === name ? "已装备" : action.label}
</button>
```

点击按钮直接调用处理函数。消耗品的处理函数用 JavaScript 操作数组，装备的处理函数调用 `api.executeAction()` 触发对应的行为。

::: tip 不想自己写代码？用工作室 AI
编辑器顶部 → 点击「进入工作室」→ AI 助手面板 → 用中文描述你想要什么，比如"做一个物品栏网格，有 HP 条、装备槽，物品可以使用或装备"，AI 会帮你生成代码。
:::

---

### 第 4 步：保存并测试

1. 点击编辑器顶部的「保存」
2. 点击「开始游戏」或回到首页开一个新会话
3. 你会看到 AI 的回复下方出现物品栏面板：HP 80/100、武器未装备、2 个药水和 1 把铁剑
4. 点击药水下面的「使用」——HP 从 80 变成 100，药水消失，弹出「使用了药水！HP +20」
5. 点击铁剑下面的「装备」——装备槽显示「铁剑」，按钮变成灰色「已装备」，弹出「装备了铁剑！」
6. 再点一次铁剑的「已装备」按钮——弹出「铁剑已经装备着了！」
7. 继续和 AI 对话——如果你配了「告诉 AI」动作，AI 的回复会体现玩家手持铁剑

**如果遇到问题：**

| 现象 | 可能的原因 | 解决方法 |
|------|-----------|---------|
| 看不到物品栏面板 | 根组件代码没保存或有语法错误 | 检查自定义 UI 底部的编译状态，应该显示绿色「OK」 |
| 物品栏里没有物品 | JSON 变量默认值格式不对 | 确认默认值是合法的 JSON 数组，双引号包裹字段名 |
| 按钮点了没反应 | 行为的动作 ID 和代码里的不一致 | 确认行为的动作 ID 是 `equip-sword`，和代码里 `executeAction()` 的参数一模一样 |
| 药水用了但没消失 | `useItem` 函数找不到物品名称 | 确认 JSON 里物品的 `name` 字段和 `useItem()` 里查找的名称完全一致——区分大小写 |
| HP 没变化 | `api.setVariable` 没有正确调用 | 检查变量 ID 是不是 `hp`——必须和变量定义里的一致 |
| 装备了但 AI 不知道 | 没加「告诉 AI」动作 | 在装备行为的 DO 里加一个「告诉 AI」动作 |

---

## AI 如何修改物品栏

AI 也可以在剧情中通过指令来添加或移除物品。因为物品栏是 JSON 变量，AI 可以用 `push` 指令添加物品：

```
你打败了哥布林，在它的遗物中发现了一瓶生命药水。
[inventory: push {"name":"药水","icon":"🧪","count":1}]
```

::: warning 数组指令的限制
`push` 指令可以正常往数组末尾添加物品。但 `delete` 在数组上只能用数字索引（比如 `[inventory: delete 0]` 移除第一个元素），`merge` 只能用于普通对象、不能用于数组。对于复杂的物品栏操作（按名称移除特定物品、更新物品数量），请使用渲染器的 JavaScript 逻辑，或者设计你的系统让 AI 通过其他变量传达意图，再由行为来执行。
:::

---

## 速查表

| 你想做的事 | 怎么做 |
|-----------|--------|
| 存储物品列表 | 创建 JSON 变量，默认值为数组 `[{...}, ...]` |
| 显示物品栏网格 | 渲染器里用 CSS Grid + `inventory.map()` |
| 使用消耗品 | 渲染器：找到物品 → 更新数组 → `api.setVariable()` → 弹出提示 |
| 装备物品 | 渲染器：调用 `api.executeAction()` → 行为：设置变量 + 告诉 AI |
| 检查是否拥有某物品 | 渲染器：`inventory.find(i => i.name === "物品名")` |
| 添加物品（AI） | AI 指令：`[inventory: push {"name":"物品","icon":"📦","count":1}]` |
| 记录当前装备 | 创建 string 变量，空字符串 = 未装备 |
| 按钮触发使用/装备 | 渲染器里调用处理函数或 `api.executeAction("动作ID")` |
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
- 2 条行为（装备铁剑 成功 + 已装备）
- 一个根组件（HP 状态栏 + 装备槽 + 物品栏网格 + 操作按钮 + 使用/装备逻辑）

---

::: tip 这是实战配方 #7
前面的配方教了场景跳转、战斗系统、商店交易和角色创建。这个配方教你用渲染器 JavaScript 逻辑结合行为系统来管理 JSON 数组物品栏。同样的模式可以用来做任务日志、技能树、制作配方——任何需要"管理一个列表、对列表元素做操作"的玩法。
:::

</div>
