# 点击 UI 跳转开场白与修改条目内容

> 点一个按钮 → 直接跳到另一个预写的开场白。在输入框打字 → 改变条目内容。这篇教你两种做法。

---

## 第一部分：按钮切换预写开场白

### 你要做的东西

一个有多个预写开场白的世界。玩家先看到「主开场」，上面有按钮。点击按钮后，聊天消息**立刻**切换成另一个预写的开场白——不需要 AI 重新生成。

### 原理

Yumina 把你在「首条消息」里写的所有问候语存成了第一条消息的 **swipes**（左右滑切换）。`switchGreeting(index)` API 让自定义组件可以直接跳到任何一个：

```
玩家点击「进入黑暗洞穴」
  → api.switchGreeting(1)
  → 第一条消息切换到第 2 个问候语（index 1）
  → 游戏状态恢复到该问候语的快照
  → 玩家立刻看到预写的黑暗洞穴开场
```

### 一步步来

#### 第 1 步：创建多个问候语

编辑器 → 侧边栏 → **首条消息** 标签页

这个标签页专门管理开场白。你会看到一个文本框和底部的数字标签（1, 2, 3...），每个标签对应一个问候语。

**问候语 1（主开场——路线选择）：**

点「创建首条消息」，写入：

```
*你在一片神秘森林的深处醒来。晨雾在古老的树木之间翻涌。*

你面前有两条路：

**左边**——一条狭窄的小径消失在黑暗中。空气变冷了，远处有回声。

**右边**——一条洒满阳光的小路，野花在微风中摇曳，鸟鸣声不断。

你要走哪边？
```

**问候语 2（黑暗洞穴开场）：**

点「添加问候语」，写入：

```
*你踏上了左边的小路。头顶的树冠越来越密，吞噬了光线。几分钟后，小径缩窄成一道岩壁上的裂缝——一个洞穴的入口。*

*冷风从里面涌出，带着潮湿石头和金属的气味。深处闪烁着微弱的蓝绿色光芒——那是附着在洞壁上的发光菌类。*

*你深吸一口气，走了进去。身后，最后一丝日光缩成一条苍白的线，然后消失了。*

你独自身处黑暗之中。
```

**问候语 3（阳光草地开场）：**

再点「添加问候语」，写入：

```
*你选择了右边的路。树木渐渐稀疏，温暖的阳光倾泻而入。几分钟后，森林让位于一片延伸到地平线的广阔草地。*

*各种颜色的野花在微风中轻轻摇曳。远处有一条溪流在阳光下闪闪发光。附近某处，一只鸟唱着你从未听过的旋律。*

*你感觉肩膀上的紧张感融化了。不管这是什么地方，它让人感到安全。*

欢迎来到永绽草地。
```

::: info 顺序就是 index
问候语的顺序就是 `switchGreeting()` 的 index。第一个 = index 0，第二个 = index 1，第三个 = index 2。你可以在标签页底部的数字标签（1, 2, 3）之间点击切换来编辑每个问候语。
:::

#### 第 2 步：（可选）创建路线追踪变量和行为

如果你希望按钮点了之后消失，以及后续对话使用不同的世界观，需要加变量和行为。

**创建变量：**

编辑器 → **变量** 标签页 → 添加变量

| 字段 | 值 |
|------|-----|
| 名称 | 当前路线 |
| ID | `current_route` |
| 类型 | 字符串 |
| 默认值 | `none` |
| 分类 | 标记 |
| 行为规则 | `不要修改这个变量。它由玩家的 UI 选择控制。` |

**创建世界观条目（默认禁用）：**

编辑器 → **知识库** 标签页 → 新建条目

黑暗洞穴世界观：
| 字段 | 值 |
|------|-----|
| 名称 | 黑暗洞穴世界观 |
| 区域 | 预设 |
| 启用 | **否** |

阳光草地世界观：
| 字段 | 值 |
|------|-----|
| 名称 | 阳光草地世界观 |
| 区域 | 预设 |
| 启用 | **否** |

**创建行为：**

编辑器 → **行为** 标签页 → 添加行为

行为「选择黑暗路线」：
| 字段 | 值 |
|------|-----|
| 名称 | 选择黑暗路线 |
| 触发条件 | **动作** → 动作 ID：`choose-dark` |

动作列表：
1. **编辑变量**：`current_route` → 设为 `dark`
2. **切换条目**：黑暗洞穴世界观 → 启用
3. **切换条目**：阳光草地世界观 → 禁用

行为「选择阳光路线」同理，反过来。

#### 第 3 步：做带按钮的 UI

编辑器 → **消息渲染器** 标签页 → 选「自定义 TSX」→ 粘贴：

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
            }}
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
            }}
          >
            走向阳光草地
          </button>
        </div>
      )}
    </div>
  );
}
```

按钮点击时做三件事：
1. `setVariable` — 记录选择，让按钮消失
2. `executeAction` — 触发行为，开关对应的世界观条目
3. `switchGreeting` — 切换到预写的开场白

::: tip 也可以用工作室 AI
编辑器 → 进入工作室 → AI 助手面板 → 粘贴：

```
帮我做一个消息渲染器。只在第一条消息（messageIndex === 0）且变量
current_route 等于 "none" 时，在文字下面显示两个按钮：
- 「进入黑暗洞穴」（暗紫色） → setVariable + executeAction + switchGreeting(1)
- 「走向阳光草地」（暖绿色） → setVariable + executeAction + switchGreeting(2)
始终正常渲染消息文字。
技术信息：useYumina() 有 switchGreeting、setVariable、executeAction，支持 Tailwind。
```
:::

#### 第 4 步：测试

1. **保存** 世界
2. 开一个 **新会话**
3. 你看到主开场和两个按钮
4. 点一个——第一条消息**立刻**变成预写的洞穴或草地开场，按钮消失
5. 发几条消息——AI 的回复会受到对应世界观条目的影响

---

## 第二部分：玩家输入修改条目内容

### 你要做的东西

UI 上有一个文本输入框，玩家输入内容（比如角色名、自定义设定、剧情指令），这些内容会被注入到条目里——改变 AI 读到的信息。

### 原理

条目支持**宏语法**：`{{variableId}}` 是一个占位符，引擎在每次构建提示词时，会把它替换成对应变量的当前值。

关键时序：**替换发生在构建提示词的时候**——也就是每次玩家发消息、AI 要回复之前。不是改变量的瞬间生效，而是下一轮对话时 AI 才会看到新内容。

完整流程：

```
1. 条目里写着：「特殊规则：{{custom_rule}}」
2. 变量 custom_rule 的值是 "所有魔法都可以使用"
3. 玩家发消息 → 引擎构建提示词 → 替换宏 → AI 收到「特殊规则：所有魔法都可以使用」

4. 玩家在 UI 输入框里输入 "魔法被禁止使用"
5. 调用 setVariable("custom_rule", "魔法被禁止使用") → 变量值变了
6. 此时 AI 还不知道。条目里依然写着 {{custom_rule}}，只是变量值变了。

7. 玩家再发一条消息 → 引擎重新构建提示词 → 替换宏 → AI 收到「特殊规则：魔法被禁止使用」
8. 从这条消息开始，AI 遵守新规则。
```

简单说：**改变量是即时的，但 AI 在下一条消息才会看到变化**。

### 一步步来

#### 第 1 步：创建字符串变量

编辑器 → **变量** 标签页 → 添加变量

| 字段 | 值 |
|------|-----|
| 名称 | 自定义规则 |
| ID | `custom_rule` |
| 类型 | 字符串 |
| 默认值 | *（留空，或写一个默认规则如 `所有魔法都可以使用`）* |
| 行为规则 | `不要修改这个变量。它由玩家通过 UI 设置。` |

#### 第 2 步：在条目里用 `{{custom_rule}}` 占位

编辑器 → **知识库** 标签页 → 新建条目

| 字段 | 值 |
|------|-----|
| 名称 | 世界规则 |
| 区域 | 预设 |

内容：

```
[世界规则]
以下规则在这个世界中生效，必须始终遵守：
{{custom_rule}}
```

引擎每次构建提示词时，会把 `{{custom_rule}}` 替换成这个变量当前的值。如果变量是空字符串，这一行就是空的。如果变量值是"魔法被禁止使用"，AI 就会看到"以下规则在这个世界中生效，必须始终遵守：魔法被禁止使用"。

#### 第 3 步：在消息渲染器里加一个输入 UI

由于普通聊天模式下自定义组件面板不会显示，输入框需要放在**消息渲染器**里。为了不在每条消息下面都重复，只在**最后一条消息**下面显示。

在你的消息渲染器 TSX 里，加上这段（放在消息文字渲染的后面）：

```tsx
// 在 Renderer 函数里，从 useYumina() 拿到需要的东西
const api = useYumina();
const msgs = api.messages || [];
const isLastMsg = messageIndex === msgs.length - 1;
const [ruleInput, setRuleInput] = React.useState("");
const currentRule = String(api.variables.custom_rule || "");

// 在 return 的 JSX 里，消息文字下面加：
{isLastMsg && (
  <div style={{
    marginTop: "12px",
    padding: "12px",
    background: "rgba(30,41,59,0.5)",
    borderRadius: "8px",
    border: "1px solid #334155",
  }}>
    <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
      世界规则：{currentRule || "（未设置）"}
    </div>
    <div style={{ display: "flex", gap: "8px" }}>
      <input
        type="text"
        value={ruleInput}
        onChange={(e) => setRuleInput(e.target.value)}
        placeholder="输入新规则..."
        style={{
          flex: 1, padding: "6px 10px", background: "#1e293b",
          border: "1px solid #475569", borderRadius: "6px",
          color: "#e2e8f0", fontSize: "13px", outline: "none",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && ruleInput.trim()) {
            api.setVariable("custom_rule", ruleInput.trim());
            setRuleInput("");
          }
        }}
      />
      <button
        onClick={() => {
          if (ruleInput.trim()) {
            api.setVariable("custom_rule", ruleInput.trim());
            setRuleInput("");
          }
        }}
        style={{
          padding: "6px 14px", background: "#4338ca", borderRadius: "6px",
          color: "#e0e7ff", fontSize: "13px", fontWeight: "600",
          cursor: "pointer", border: "none",
        }}
      >
        应用
      </button>
    </div>
  </div>
)}
```

::: info 为什么放在消息渲染器里？
在当前版本的 Yumina 中，自定义组件面板只在全屏模式下显示。普通聊天模式下不会渲染。所以如果你想在聊天界面里显示交互元素（按钮、输入框等），需要放在消息渲染器里。
:::

#### 第 4 步：测试

1. 开始会话——如果没有设置默认值，规则显示「（未设置）」
2. 在输入框输入「魔法被禁止使用」然后点应用（或按回车）
3. 变量值立刻更新，输入框上方的「世界规则」显示你输入的内容
4. **发一条消息**——这时引擎重新构建提示词，把 `{{custom_rule}}` 替换成「魔法被禁止使用」
5. AI 的回复开始遵守这条规则
6. 再改一次 → 再发一条消息 → AI 适应新规则

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
| 跳转到预写的开场白 | `switchGreeting(index)` — index 对应问候语的顺序（从 0 开始） |
| 让玩家修改条目内容 | 变量 + 条目内容里的 `{{variableId}}` 宏 + UI 里调 `setVariable()` |
| 只在第一条消息显示按钮 | `{messageIndex === 0 && <按钮/>}` |
| 选了之后隐藏按钮 | 用一个变量追踪选择状态，TSX 里检查它 |
| 配合切换世界观条目 | 加行为，用「切换条目」动作开关条目 |
| 切换时播放音效/通知 | 加行为，变量变化时触发「播放音频」/「通知玩家」 |

---

## 直接试试——可导入的示例世界

下载这个 JSON 文件，导入即可体验完整效果：

<a href="/recipe-1-demo-zh.json" download>recipe-1-demo-zh.json</a>

**导入方法：**
1. 进入 Yumina → 我的世界 → 创建新世界
2. 在编辑器里点「导入包」（或上传图标）
3. 选择下载的 `.json` 文件
4. 一个新世界会被创建，所有条目、变量、行为和渲染器都已预配置好
5. 开一个新会话试试看

**包含内容：**
- 3 个问候语（主开场 + 黑暗洞穴 + 阳光草地）
- 2 个变量（`current_route` 追踪路线，`custom_rule` 玩家可编辑的规则）
- 2 个动作行为（选择路线时开关世界观条目）
- 一个消息渲染器（路线选择按钮 + 规则编辑器）
- 一个使用 `{{custom_rule}}` 宏的世界观条目

---

::: tip 这是实战配方 #1
后续还会有更多配方——战斗系统、商店界面、任务追踪等等。每个配方都是把变量、条目、行为和 UI 组合起来，做出更强大的东西。
:::
