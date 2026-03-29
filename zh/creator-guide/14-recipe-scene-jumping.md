# 点击 UI 跳转开场白与修改条目内容

> 点一个按钮 → 直接跳到另一个预写的开场白。在输入框打字 → 改变条目内容。这篇教你两种做法。

---

## 第一部分：按钮切换预写开场白

### 你要做的东西

一个有多个预写开场白的世界。玩家先看到「主开场」，上面有按钮。点击按钮后，聊天消息**立刻**切换成另一个预写的开场白——不需要 AI 重新生成。

### 原理

Yumina 已经把你所有的 greeting 条目存成了第一条消息的 **swipes**（左右滑切换）。新增的 `switchGreeting(index)` API 让自定义组件可以直接跳到任何一个：

```
玩家点击「进入黑暗洞穴」
  → api.switchGreeting(1)
  → 第一条消息切换到第 2 个开场白（index 1）
  → 游戏状态恢复到该开场白的快照
  → 玩家立刻看到预写的黑暗洞穴开场
```

### 一步步来

#### 第 1 步：创建多个开场白条目

每个 greeting 条目对应一个 swipe。第一个启用的 greeting（按 Position 排序）是默认显示的。

编辑器 → **条目（Entries）** 区域：

**开场白 1（主开场——路线选择）：**

| 字段 | 值 |
|------|-----|
| Name | Main Opening |
| Tag | Greeting |
| Section | System Presets |
| Position | 0 |

内容：

```
*你在一片神秘森林的深处醒来。晨雾在古老的树木之间翻涌。*

你面前有两条路：

**左边**——一条狭窄的小径消失在黑暗中。空气变冷了，远处有回声。

**右边**——一条洒满阳光的小路，野花在微风中摇曳，鸟鸣声不断。

你要走哪边？
```

**开场白 2（黑暗洞穴开场）：**

| 字段 | 值 |
|------|-----|
| Name | Dark Cave Opening |
| Tag | Greeting |
| Section | System Presets |
| Position | 1 |

内容：

```
*你踏上了左边的小路。头顶的树冠越来越密，吞噬了光线。几分钟后，小径缩窄成一道岩壁上的裂缝——一个洞穴的入口。*

*冷风从里面涌出，带着潮湿石头和金属的气味。深处闪烁着微弱的蓝绿色光芒——那是附着在洞壁上的发光菌类。*

*你深吸一口气，走了进去。身后，最后一丝日光缩成一条苍白的线，然后消失了。*

你独自身处黑暗之中。
```

**开场白 3（阳光草地开场）：**

| 字段 | 值 |
|------|-----|
| Name | Meadow Opening |
| Tag | Greeting |
| Section | System Presets |
| Position | 2 |

内容：

```
*你选择了右边的路。树木渐渐稀疏，温暖的阳光倾泻而入。几分钟后，森林让位于一片延伸到地平线的广阔草地。*

*各种颜色的野花在微风中轻轻摇曳。远处有一条溪流在阳光下闪闪发光。附近某处，一只鸟唱着你从未听过的旋律。*

*你感觉肩膀上的紧张感融化了。不管这是什么地方，它让人感到安全。*

欢迎来到永绽草地。
```

::: info 开场白的顺序很重要
开场白按 **Position** 字段排序。Position 0 = 默认显示（index 0），Position 1 = 第二个（index 1），以此类推。你传给 `switchGreeting()` 的 index 就对应这个顺序。
:::

#### 第 2 步：做带按钮的 UI

编辑器 → **消息渲染器（Message Renderer）** 区域 → 选 **Custom TSX** → 粘贴：

```tsx
export default function Renderer({ content, renderMarkdown, messageIndex }) {
  const api = useYumina();
  const hasChosen = api.variables.current_route !== "none";

  return (
    <div>
      {/* 消息文字 */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* 路线按钮——只在第一条消息且未选择时显示 */}
      {messageIndex === 0 && !hasChosen && (
        <div style={{
          display: "flex",
          gap: "12px",
          marginTop: "16px",
        }}>
          <button
            onClick={() => {
              api.setVariable("current_route", "dark");
              api.executeAction("choose-dark");
              api.switchGreeting?.(1);
            }}
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
            onClick={() => {
              api.setVariable("current_route", "light");
              api.executeAction("choose-light");
              api.switchGreeting?.(2);
            }}
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

::: tip 也可以用 Studio AI
在 Studio AI Assistant 里粘贴：

```
帮我做一个 messageRenderer。只在第一条消息（messageIndex === 0）上，在文字下面显示两个按钮：
- 「进入黑暗洞穴」（暗紫色） → switchGreeting(1)
- 「走向阳光草地」（暖绿色） → switchGreeting(2)
始终正常渲染消息文字（用 renderMarkdown）。
技术信息：useYumina() 有 switchGreeting，支持 Tailwind。
```
:::

#### 第 3 步：测试

1. **保存** 世界
2. 开一个 **新会话**
3. 你看到主开场和两个按钮
4. 点一个——第一条消息**立刻**变成预写的洞穴或草地开场
5. 按钮还在（因为仍然是 `messageIndex === 0`）。你可以点另一个切换，或者开始聊天

::: tip 想让按钮选了就消失？
用一个变量来追踪选择。加一个 `current_route` 字符串变量（默认 `"none"`），然后在 TSX 里检查：

```tsx
const { variables, switchGreeting, setVariable } = useYumina();
const hasChosen = variables.current_route !== "none";

// 按钮 onClick：
onClick={() => {
  setVariable("current_route", "dark");
  switchGreeting(1);
}}

// 条件渲染：
{messageIndex === 0 && !hasChosen && ( <按钮.../> )}
```
:::

---

## 第二部分：玩家输入修改条目内容

### 你要做的东西

UI 上有一个文本输入框，玩家输入内容（比如角色名、自定义设定、剧情指令），这些内容会被注入到条目里——改变 AI 读到的信息。

### 原理

条目支持**宏语法**：`{{variableId}}` 会在发送给 AI 之前被替换成变量的当前值。所以：

1. 创建一个字符串变量（比如 `custom_setting`）
2. 在条目内容里写 `{{custom_setting}}`
3. 玩家在输入框打字 → `setVariable("custom_setting", "他们输入的内容")`
4. 从下一条消息开始，条目就包含了玩家的文字

```
条目内容："这个世界有一条特殊规则：{{custom_rule}}"
玩家输入："魔法被禁止使用"
AI 收到的："这个世界有一条特殊规则：魔法被禁止使用"
```

### 一步步来

#### 第 1 步：创建字符串变量

编辑器 → **变量（Variables）** → **Add Variable**

| 字段 | 值 |
|------|-----|
| Name | Custom Rule |
| ID | `custom_rule` |
| Type | String |
| Default Value | `没有特殊规则。` |
| Behavior Rules | `Do not modify this variable. It is set by the player.` |

#### 第 2 步：在条目里引用它

编辑器 → **条目（Entries）** → 编辑或创建一个世界观条目：

| 字段 | 值 |
|------|-----|
| Name | World Rules |
| Tag | Lore |
| Section | System Presets |
| Always Send | Yes |

内容：

```
[世界规则]
以下规则在这个世界中生效，必须始终遵守：
{{custom_rule}}
```

当 `custom_rule` 是 `"没有特殊规则。"` 时，AI 看到默认文字。当玩家改了它，AI 就看到玩家写的内容。

#### 第 3 步：加一个输入 UI

在 **messageRenderer** 或 **customComponent** 里，加一个文本输入框：

```tsx
export default function Component() {
  const { variables, setVariable } = useYumina();
  const [inputValue, setInputValue] = React.useState("");
  const currentRule = variables.custom_rule || "没有特殊规则。";

  return (
    <YUI.Panel title="世界规则">
      <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "8px" }}>
        当前规则：{String(currentRule)}
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="输入新规则..."
          style={{
            flex: 1,
            padding: "8px 12px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#e2e8f0",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <YUI.ActionButton
          onClick={() => {
            if (inputValue.trim()) {
              setVariable("custom_rule", inputValue.trim());
              setInputValue("");
            }
          }}
        >
          应用
        </YUI.ActionButton>
      </div>
    </YUI.Panel>
  );
}
```

#### 第 4 步：测试

1. 开始会话——AI 遵循「没有特殊规则。」
2. 在输入框输入「魔法被禁止使用」然后点应用
3. 发一条消息——AI 现在会遵守「魔法被禁止使用」这条规则
4. 再改一次——AI 立刻适应

---

## 组合两种模式

你可以把开场白切换和条目修改结合起来。比如：

- **主开场白** 显示一个角色创建表单（名字、职业、背景故事输入框）
- 玩家填完 → 变量被设置 → 包含 `{{player_name}}`、`{{player_class}}`、`{{player_backstory}}` 宏的条目获取到这些值
- 玩家点「开始冒险」→ `switchGreeting(1)` 跳转到真正的故事开场
- AI 现在知道玩家的自定义角色信息了

---

## 速查表

| 你想做的事 | 怎么做 |
|-----------|--------|
| 跳转到预写的开场白 | `switchGreeting(index)` — index 对应 greeting 的 Position 顺序（从 0 开始） |
| 让玩家修改条目内容 | 变量 + 条目内容里的 `{{variableId}}` 宏 + UI 里调 `setVariable()` |
| 只在第一条消息显示按钮 | `{messageIndex === 0 && <按钮/>}` |
| 选了之后隐藏按钮 | 用一个变量追踪选择状态，TSX 里检查它 |
| 配合切换世界观条目 | 加行为规则，用 `toggle-entry` 动作开关条目 |
| 切换时播放音效/通知 | 加行为规则，变量变化时触发 `play-audio` / `notify-player` |

---

## 直接试试——可导入的示例世界

下载这个 JSON 文件，导入即可体验完整效果：

<a href="/recipe-1-demo-zh.json" download>recipe-1-demo-zh.json</a>

**导入方法：**
1. 进入 Yumina → **我的世界（My Worlds）** → **创建新世界**
2. 在编辑器里点 **Import**（或上传图标）
3. 选择下载的 `.json` 文件
4. 一个新世界会被创建，所有条目、变量、行为、渲染器和组件都已预配置好
5. 开一个新会话试试看

**包含内容：**
- 3 个开场白条目（主开场 + 黑暗洞穴 + 阳光草地）
- 2 个变量（`current_route` 追踪路线，`custom_rule` 玩家可编辑的规则）
- 2 个动作行为（选择路线时开关世界观条目）
- 一个消息渲染器（路线选择按钮 + 规则编辑器）
- 一个使用 `{{custom_rule}}` 宏的世界观条目

---

::: tip 这是实战配方 #1
后续还会有更多配方——战斗系统、商店界面、任务追踪等等。每个配方都是把变量、条目、行为和 UI 组合起来，做出更强大的东西。
:::
