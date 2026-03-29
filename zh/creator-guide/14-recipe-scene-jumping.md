# 点击 UI 跳转场景与切换条目

> 在聊天界面点一个按钮 → 跳转到不同的场景 → 世界书条目自动切换。这篇教你怎么把这套串起来。

---

## 你要做的东西

一个有可点击路线按钮的世界。玩家点击按钮后：

1. 游戏状态更新（记录玩家选了哪条路线）
2. 对应路线的世界观条目被启用，其他路线的被禁用
3. AI 生成那条路线的开场

这是以下所有玩法的基础：路线选择、章节跳转、场景切换等等。

---

## 原理——30 秒速览

```
玩家点击「进入黑暗洞穴」
  → executeAction("choose-dark")
  → 行为规则触发：
      1. 设置 current_route = "dark"
      2. 启用「黑暗洞穴世界观」条目，禁用「阳光草地世界观」条目
      3. 发送隐藏消息给 AI：「生成黑暗洞穴的开场。」
  → AI 写出黑暗洞穴的开场，使用刚被启用的世界观
```

四个功能协同工作：

| 功能 | 作用 |
|------|------|
| **变量** | 记录当前激活的路线 |
| **条目** | 多套世界观/角色条目，默认禁用 |
| **动作触发行为** | 串联整个跳转：开关条目 + 发送上下文 |
| **自定义 UI（TSX）** | 提供可点击的按钮 |

---

## 一步步来

### 第 1 步：创建路线变量

编辑器 → **变量（Variables）** 区域 → **Add Variable**

| 字段 | 值 |
|------|-----|
| Name | Current Route |
| ID | `current_route` |
| Type | String |
| Default Value | `none` |
| Category | Flag |
| Behavior Rules | `Do not modify this variable. It is controlled by the player's UI choices.` |

::: tip 为什么要写 Behavior Rules？
Behavior Rules 是告诉 AI **不要自己动这个变量**的。你希望它只被玩家点按钮控制——而不是 AI 写到一半突然决定帮你切路线。
:::

---

### 第 2 步：创建条目

你需要三类条目：

1. **默认开场白** —— 玩家看到的第一条消息，描述路线选择的场景
2. **路线专属世界观条目** —— 默认禁用，行为规则触发时才启用
3. （可选）**路线专属角色条目** —— 同一角色在不同路线下表现不同

#### 2a. 默认开场白

编辑器 → **条目（Entries）** 区域 → **Add Entry**

| 字段 | 值 |
|------|-----|
| Name | Route Selection Opening |
| Tag | Greeting |
| Section | System Presets |
| Enabled | Yes |

**内容**——写一段呈现选择的开场：

```
*你在一片神秘森林的深处醒来。晨雾在古老的树木之间翻涌，空气中弥漫着潮湿的泥土气息。*

你面前有两条路：

**左边**——一条狭窄的小径消失在黑暗中。空气变冷了，你隐约听到远处传来的回声，似乎来自一个洞穴。

**右边**——一条洒满阳光的小路，野花在微风中摇曳。你闻到了蜂蜜的香味，听到了鸟鸣声。

你要走哪边？
```

这条开场白没有特殊设置——新会话开始时自动显示（Greeting 类型条目的默认行为）。

#### 2b. 黑暗路线世界观

**Add Entry：**

| 字段 | 值 |
|------|-----|
| Name | Dark Cave Lore |
| Tag | Lore |
| Section | System Presets |
| Always Send | Yes |
| Enabled | **No**（默认禁用——行为规则会在需要时启用它） |

**内容：**

```
[世界设定：暗影之口洞穴]
玩家已经进入暗影之口洞穴。关键细节：
- 古代矮人遗迹，已被遗弃数百年
- 发光菌类提供微弱的蓝绿色光线
- 深处隧道中潜伏着奇异生物
- 越往里走温度越低
- 偶尔有震动从天花板上摇落碎石

保持紧张的恐怖生存氛围。描写回荡的声音、闪烁的阴影、滴水声和头顶石块的压迫感。
```

#### 2c. 阳光路线世界观

**Add Entry：**

| 字段 | 值 |
|------|-----|
| Name | Sunlit Meadow Lore |
| Tag | Lore |
| Section | System Presets |
| Always Send | Yes |
| Enabled | **No**（默认禁用） |

**内容：**

```
[世界设定：永绽草地]
玩家已经进入永绽草地。关键细节：
- 广阔的花田延伸到天际线
- 远处可以看到一个温馨的小村庄
- 友善的森林精灵偶尔以浮光的形态出现
- 一条小溪穿过草地
- 天气永远温暖宜人

保持温暖、治愈的氛围。描写鲜艳的色彩、花香、微风和平和的感觉。
```

::: info 为什么「Always Send = Yes」但「Enabled = No」？
这两个设置是配合使用的。**Always Send** 的意思是"当这条条目是启用状态时，每次都发给 AI"。**Enabled** 控制它是否激活。默认禁用意味着这条条目一开始是沉睡的，直到行为规则用 `toggle-entry` 把它打开。这样你就能精确控制每个时刻哪些世界观是激活的。
:::

#### 2d. （可选）路线专属角色条目

你可以让同一个角色在不同路线中表现完全不同。创建两条条目，都**默认禁用**：

**条目：「Alicia — 友善模式」**

| 字段 | 值 |
|------|-----|
| Always Send | Yes |
| Enabled | No |

内容：`Alicia 温暖友好。她微笑着说话，主动提出带领玩家穿过草地……`

**条目：「Alicia — 敌对模式」**

| 字段 | 值 |
|------|-----|
| Always Send | Yes |
| Enabled | No |

内容：`Alicia 多疑且冷漠。她躲在阴影中，用不信任的眼神打量着玩家，说话简短生硬……`

同一个角色，完全不同的性格——由行为规则在玩家选路线时切换。

---

### 第 3 步：创建动作行为

这是把所有东西串起来的关键。每个行为：接收按钮点击 → 开关对应条目 → 告诉 AI 写新开场。

编辑器 → **行为（Behaviors）** 区域 → **Add Behavior**

#### 行为 A：「选择黑暗路线」

| 字段 | 值 |
|------|-----|
| Name | Choose Dark Route |
| WHEN | **Action button pressed** → Action ID：`choose-dark` |
| ONLY IF | *（留空）* |

**DO——按顺序添加这些动作：**

**动作 1：修改变量**

| 字段 | 值 |
|------|-----|
| Variable | `current_route` |
| Operation | Set |
| Value | `dark` |

**动作 2：开启黑暗世界观条目**

| 字段 | 值 |
|------|-----|
| Entry | Dark Cave Lore |
| Enabled | Yes |

**动作 3：关闭阳光世界观条目**

| 字段 | 值 |
|------|-----|
| Entry | Sunlit Meadow Lore |
| Enabled | No |

**动作 4：发送上下文（触发 AI 回复）**

| 字段 | 值 |
|------|-----|
| Role | System |
| Message | `The player chose to enter the dark cave. Write a vivid, atmospheric opening scene for the Shadowmaw Cave. Describe the player stepping into the darkness, the temperature dropping, the last rays of sunlight fading behind them. End with something that draws the player deeper in. Do not mention route selection or give the player a choice — they have already chosen.` |

::: tip 如果你还有角色条目
再多加几个 toggle-entry 动作就行：启用「Alicia — 敌对模式」，禁用「Alicia — 友善模式」。一个行为里可以链接任意多个 toggle-entry 动作。
:::

#### 行为 B：「选择阳光路线」

同样的结构，但反过来：

| 字段 | 值 |
|------|-----|
| Name | Choose Light Route |
| WHEN | **Action button pressed** → Action ID：`choose-light` |

**DO：**

1. 修改变量：`current_route` → Set → `light`
2. Toggle entry：**Sunlit Meadow Lore** → Enabled：**Yes**
3. Toggle entry：**Dark Cave Lore** → Enabled：**No**
4. 发送上下文：`The player chose to walk toward the sunlit meadow. Write a warm, beautiful opening scene for the Everbloom Meadow. Describe golden sunlight, wildflowers, a gentle breeze, and the feeling of stepping into a peaceful world. Do not mention route selection or give the player a choice — they have already chosen.`

---

### 第 4 步：做带按钮的 UI

两种方式——选你更舒服的。

#### 方式 A：让 Studio AI 帮你写

编辑器 → 点击 **Enter Studio** → **AI Assistant** 面板 → 粘贴：

```
帮我做一个消息渲染器（messageRenderer），能显示路线选择按钮。

规则：
1. 始终正常渲染消息文字（用 renderMarkdown）。
2. 只在变量 current_route 等于 "none" 时，在消息文字下面显示两个大按钮：
   - 「进入黑暗洞穴」——暗紫色/靛蓝色风格
   - 「走向阳光草地」——暖绿色/金色风格
3. 黑暗按钮点击时 → executeAction("choose-dark")
4. 草地按钮点击时 → executeAction("choose-light")
5. 当 current_route 不是 "none" 时，只显示消息文字，不显示按钮。

我的变量：
- current_route（string）："none" = 还没选，"dark" 或 "light" = 已选路线

技术信息：
- TSX，export default function Renderer({ content, renderMarkdown })
- useYumina() 可以拿到 { variables, executeAction }
- 支持 Tailwind CSS
```

在 Canvas 预览里检查效果。满意就点 **Approve**。搞定。

#### 方式 B：自己写代码

编辑器 → **消息渲染器（Message Renderer）** 区域 → 选 **Custom TSX** → 粘贴：

```tsx
export default function Renderer({ content, renderMarkdown }) {
  const { variables, executeAction } = useYumina();
  const route = variables.current_route;

  return (
    <div>
      {/* 消息文字 */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* 路线按钮——只在选路线之前显示 */}
      {route === "none" && (
        <div style={{
          display: "flex",
          gap: "12px",
          marginTop: "16px",
        }}>
          <button
            onClick={() => executeAction("choose-dark")}
            style={{
              flex: 1,
              padding: "16px",
              background: "linear-gradient(135deg, #1e1b4b, #312e81)",
              border: "1px solid #4338ca",
              borderRadius: "12px",
              color: "#c7d2fe",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "transform 0.15s",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            进入黑暗洞穴
          </button>

          <button
            onClick={() => executeAction("choose-light")}
            style={{
              flex: 1,
              padding: "16px",
              background: "linear-gradient(135deg, #365314, #4d7c0f)",
              border: "1px solid #65a30d",
              borderRadius: "12px",
              color: "#ecfccb",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "transform 0.15s",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            走向阳光草地
          </button>
        </div>
      )}
    </div>
  );
}
```

检查代码框底部——如果显示 **Compile Status: OK** 就没问题。

---

### 第 5 步：测试

1. **保存** 世界
2. 开一个 **新会话**（或点 Preview）
3. 你应该能看到开场白文字，下面有两个路线按钮
4. 点一个——AI 应该生成一段全新的路线开场
5. 再发几条消息——AI 的回复应该会受到路线专属世界观的影响
6. 再开一个新会话，选另一条路线——不同的世界观，不同的氛围

**排查问题：**

- **按钮点了之后不消失？** 检查 `current_route` 有没有被设置——看聊天页面右侧的变量面板。
- **AI 没有用对应的世界观？** 检查行为的 `toggle-entry` 动作是否指向了正确的条目名称，以及条目的 `Always Send` 是否设为 Yes。
- **点了按钮 AI 没有回复？** 确保行为里有 `send-context` 动作——这才是触发 AI 回复的关键。

---

## 为什么能跑通——完整链路

玩家点击「进入黑暗洞穴」的时候，底层发生了什么：

1. **按钮点击** → `executeAction("choose-dark")` 在客户端触发
2. **客户端引擎** 扫描所有行为，找到触发器类型为 `action`、ID 为 `"choose-dark"` 的行为
3. **行为「Choose Dark Route」** 匹配 → 按顺序执行 DO 中的动作：
   - `modify-variable`：把 `current_route` 从 `"none"` 改成 `"dark"`
   - `toggle-entry`：启用「Dark Cave Lore」，禁用「Sunlit Meadow Lore」
   - `send-context`：排队一条隐藏的系统消息给 AI
4. **上下文消息触发 AI 生成** → 完整的提示词被重新组装，包含所有当前启用的条目
5. **「Dark Cave Lore」** 已启用 + `alwaysSend: true` → 加入提示词。**「Sunlit Meadow Lore」** 已禁用 → 不加入。
6. **AI 生成回复** → 它看到了黑暗洞穴的世界观和上下文指令 → 写出一段氛围感十足的洞穴开场
7. **玩家看到**：一条新的洞穴场景消息。路线按钮消失了（因为 `current_route` 不再是 `"none"`）。黑暗洞穴冒险开始。

之后每条消息都遵循同样的模式：只有启用的条目会被加入提示词，AI 自动保持对应的风格。

---

## 变体

### 游戏中途跳转场景（不只是开场）

同样的模式，但按钮放在 **侧边栏面板** 里，而不是消失式按钮：

- 用 **customComponent**（Studio → Code View → Add Component）代替 messageRenderer
- 按钮始终可见——玩家可以随时在场景之间跳转
- 每个行为开关对应的条目并发送上下文：`"玩家移动到了[地点]。描写过渡场景和新环境。"`
- 调整按钮样式，高亮当前激活的场景

### 两条以上的路线

直接扩展：

- 一个 `current_route` 变量，更多可能的值：`"dark"`、`"light"`、`"neutral"`、`"secret"`
- 每条路线一个行为，每个行为里有所有条目集的 toggle-entry 动作（启用自己的，禁用其他的）
- UI 上放更多按钮——或者用 `YUI.ChoiceButtons` 做更整洁的布局：

```tsx
const routes = [
  { label: "黑暗洞穴", action: "choose-dark" },
  { label: "阳光草地", action: "choose-light" },
  { label: "山间小路", action: "choose-neutral" },
];

// 在渲染器里：
{route === "none" && (
  <YUI.ChoiceButtons
    choices={routes.map(r => r.label)}
    onSelect={(choice) => {
      const r = routes.find(x => x.label === choice);
      if (r) executeAction(r.action);
    }}
    layout="vertical"
  />
)}
```

### 切换角色行为，不只是世界观

给同一个角色创建多个条目版本——每条路线一个，都默认禁用。在每条路线的行为里，用 toggle-entry 启用匹配的角色条目、禁用其他的。AI 看到的是完全不同的角色设定，取决于当前激活的路线。

### 加上音效和通知

在行为的 DO 里加更多动作就行：

- **播放音频**：进入洞穴时渐变到暗系环境音，进入草地时换欢快 BGM
- **通知玩家**：弹一个 toast 比如「第一章：走入黑暗」，用 `achievement` 样式

这些都只是同一个行为里的额外动作——想加多少加多少。

---

## 速查表

| 你想做的事 | 怎么做 |
|-----------|--------|
| 按钮触发场景切换 | TSX 里 `executeAction("action-id")` → 行为用 `action` 触发器 |
| AI 写新开场 | 行为 DO：`send-context`，写一段场景描写指令 |
| 按场景开关世界观条目 | 行为 DO：`toggle-entry` → 条目名 → 启用/禁用 |
| 角色性格随场景变化 | 同上——按路线 toggle 不同的角色条目 |
| 按钮选了就消失 | TSX：`{variable === "none" && <按钮/>}` |
| 按钮始终可见（侧边栏） | 用 `customComponent` 代替 `messageRenderer` |
| 切换场景时播放音效 | 行为 DO：`play-audio` → 音轨 ID → crossfade |
| 弹出提示通知 | 行为 DO：`notify-player` → 消息 + 样式 |

---

::: tip 这是实战配方 #1
后续还会有更多配方——战斗系统、商店界面、任务追踪等等。每个配方都遵循同样的模式：把变量、条目、行为和 UI 组合起来，做出比单个功能更强大的东西。
:::
