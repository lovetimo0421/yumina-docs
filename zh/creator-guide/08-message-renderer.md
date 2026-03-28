<div v-pre>

# 自定义消息渲染器

> 用一段 TSX 代码，把 AI 回复从"一坨纯文字"变成任何你想要的视觉体验——气泡对话、视觉小说、战斗日志、RPG 面板，随便你。

---

## 简单版

### 渲染器是什么

想象一下：AI 给你回了一段文字。默认情况下，这段文字会原封不动地用 Markdown 格式显示出来——加粗、斜体、换行，仅此而已。就像一本只有黑白印刷的小说。

**消息渲染器**就是你的"排版设计师"。你交给它一段 TSX 代码，它会拦截每一条 AI 回复，按照你的设计重新呈现。

打个比方：
- 默认渲染 = 在记事本里看小说
- 自定义渲染 = 在精装书里看小说，有插图、有排版、有章节标题

### 效果对比

| | 默认渲染 | 自定义渲染 |
|---|---|---|
| 外观 | Markdown 纯文本 | 完全自定义 UI |
| 角色名 | 统一显示 "Narrator" | 可以根据角色动态变化 |
| 游戏状态 | 需要看侧边栏 | 可以直接嵌入消息中 |
| 交互 | 无 | 可以做选择按钮、折叠面板等 |
| 适用场景 | 简单聊天 | 沉浸式游戏体验 |

### 不会写代码？

没关系。你可以：
1. 从现有模板复制粘贴，改改文字和颜色
2. 把你想要的效果描述给 AI（比如 Claude），让它帮你写
3. 先用默认渲染跑起来，等熟悉了再慢慢加

但说实话，这是一个**进阶功能**。如果你完全没接触过 HTML 或 React，建议先玩玩 07-components.md 里的内置组件，那个不需要写代码。

---

## 详细版

### 三种渲染方式——搞清楚区别

Yumina 有三种"自定义 UI"的方式，它们的定位完全不同，别搞混了：

#### 1. messageRenderer —— 改造每条消息的样子

这是本章的主角。它替换掉默认的 Markdown 渲染，让每条 AI 回复都按你的设计来显示。

适用场景：聊天气泡、视觉小说对话框、战斗日志。

在 world 定义中，它是一个单独的字段：

```json
{
  "messageRenderer": {
    "id": "message-renderer",
    "name": "我的渲染器",
    "tsxCode": "export default function Renderer({ content, renderMarkdown }) { ... }",
    "description": "",
    "order": 0,
    "visible": true
  }
}
```

#### 2. customComponents —— 额外的 UI 面板

它**不替换**消息渲染，而是在聊天界面旁边**额外添加**独立面板。比如角色创建界面、游戏侧边栏、地图面板。

在 world 定义中，它是一个数组，可以有多个：

```json
{
  "customComponents": [
    { "id": "...", "name": "角色面板", "tsxCode": "...", "order": 0, "visible": true },
    { "id": "...", "name": "地图",     "tsxCode": "...", "order": 1, "visible": true }
  ]
}
```

#### 3. fullScreenComponent —— 全屏模式

当你在 settings 里设置 `fullScreenComponent: true` 时，customComponents 会占据整个屏幕，聊天窗口完全消失。适合做视觉小说、全屏游戏这类完全自定义的体验。

```json
{
  "settings": {
    "fullScreenComponent": true
  }
}
```

一句话总结：
- **messageRenderer** = 改消息长什么样
- **customComponents** = 在旁边加东西
- **fullScreenComponent** = 全屏接管

---

### CustomComponent 数据结构

不管是 messageRenderer 还是 customComponents，底层数据结构都是同一个 `CustomComponent`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一标识符 |
| `name` | string | 显示名称（给你自己看的） |
| `tsxCode` | string | TSX 代码，核心内容 |
| `description` | string | 描述（可选） |
| `order` | number | 排序用（customComponents 有多个时） |
| `visible` | boolean | 是否显示 |
| `updatedAt` | string | 最后更新时间（自动维护） |

---

### TSX 入门速成（给没写过 React 的人）

TSX 你可以理解为 "HTML + JavaScript 的混血"。看个最简单的例子：

```tsx
export default function MyRenderer({ content }) {
  return (
    <div style={{ padding: "16px", background: "#1a1a2e", borderRadius: "8px" }}>
      <p style={{ color: "#e0e0e0" }}>{content}</p>
    </div>
  );
}
```

几个关键点：

**标签就是 HTML 标签**，但有些名字不一样：
- `class` 要写成 `className`
- `style` 接收一个对象，不是字符串：`style={{ color: "red" }}`（注意双花括号）

**花括号里写 JavaScript 表达式**：
```tsx
<span>{variables.health} / {variables.maxHealth}</span>
```

**条件渲染**——某个条件成立时才显示：
```tsx
{health < 20 && <span style={{ color: "red" }}>危险!</span>}
```

**列表渲染**——遍历一个数组：
```tsx
{items.map((item, i) => <div key={i}>{item}</div>)}
```

**三元表达式**——二选一：
```tsx
<span style={{ color: isAlive ? "green" : "red" }}>
  {isAlive ? "存活" : "死亡"}
</span>
```

---

### messageRenderer 收到什么 Props

当你的渲染器被调用时，Yumina 会传入这些参数：

```typescript
// 你的函数签名应该长这样：
export default function MyRenderer({
  content,         // string   —— AI 回复文本（已去除 [var: op value] 指令）
  role,            // string   —— "assistant" 或 "user"
  messageIndex,    // number   —— 这是第几条消息（从 0 开始）
  variables,       // object   —— 当前游戏状态（所有变量的最新值）
  renderMarkdown,  // function —— 内置的 Markdown 渲染函数，返回 HTML 字符串
  isStreaming,     // boolean  —— AI 是否正在生成中（流式输出时为 true）
}) {
  // ...
}
```

各参数详解：

**`content`** —— 这是最核心的。AI 回复经过引擎处理后，所有 `[health: subtract 10]` 这样的指令已经被提取掉了，你拿到的是纯净的叙事文本。

**`role`** —— 通常是 `"assistant"`（AI 回复）。用户消息在默认设置下不走渲染器，但如果你想统一处理，可以判断这个字段。

**`variables`** —— 当前快照对应的游戏状态。比如 `variables.health`、`variables["player-name"]`。每条消息附带的是那条消息发送时的状态快照。

**`renderMarkdown`** —— Yumina 内置的 Markdown 转 HTML 函数。如果你懒得自己处理粗体/斜体，可以直接调用它：

```tsx
<div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
```

**`isStreaming`** —— AI 正在流式输出时为 `true`。你可以用它显示打字动画或加载指示器。

---

### useYumina() Hook —— 和游戏引擎交互

除了 Props，你还可以通过 `useYumina()` 获取更多能力：

```tsx
export default function MyRenderer({ content, renderMarkdown }) {
  const api = useYumina();

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      <button onClick={() => api.sendMessage("攻击")}>攻击</button>
      <button onClick={() => api.setVariable("health", 100)}>回满血</button>
      <button onClick={() => api.executeAction("flee")}>触发逃跑规则</button>
    </div>
  );
}
```

`useYumina()` 返回的完整 API：

| 方法/属性 | 说明 |
|---|---|
| `sendMessage(text)` | 以玩家身份发送一条消息 |
| `setVariable(id, value)` | 直接修改一个游戏变量 |
| `executeAction(actionId)` | 触发一个 action 类型的规则 |
| `variables` | 当前所有游戏变量（和 Props 里的 variables 一样） |
| `worldName` | 当前世界名称 |
| `currentUser` | 当前用户信息（`{ id, name, image }`） |
| `messages` | 所有聊天消息列表 |
| `isStreaming` | AI 是否正在流式输出 |
| `streamingContent` | 流式输出的当前累积内容 |
| `playAudio(trackId, opts)` | 播放音轨 |
| `stopAudio(trackId?)` | 停止音轨（不传 ID 则停止全部） |
| `resolveAssetUrl(ref)` | 将 `@asset:xxx` 引用解析为真实 URL |

---

### 编写渲染器的步骤

1. 在编辑器中打开你的世界
2. 找到 **消息渲染器（Message Renderer）** 区域
3. 选择 **自定义 TSX（Custom TSX）** 模式
4. 在代码框里写你的 TSX 代码
5. 编辑器会实时编译，底部有编译状态指示（绿色 OK / 红色报错）
6. 保存世界，回到游戏界面测试

你也可以在 **Studio** 的 Code View 面板里编辑——那里有更好的编辑体验。

---

### 运行环境里有什么

你的 TSX 代码运行在一个沙盒里，可以用以下全局变量：

| 变量 | 说明 |
|---|---|
| `React` | React 库（`useState`、`useEffect` 等都在里面） |
| `useYumina` | 获取游戏 API 的 Hook |
| `Icons` | 全部 Lucide 图标，用法：`<Icons.Heart size={16} />`。完整列表见 [lucide.dev/icons](https://lucide.dev/icons) |
| `YUI` | Yumina 内置 UI 组件库（`YUI.StatBar`、`YUI.Panel`、`YUI.DialogueBox` 等） |

注意：你**不能** import 任何外部包。所有依赖都通过上面这些全局变量获取。

**YUI 组件库包含：**
Scene, Sprite, DialogueBox, ChoiceButtons, StatBar, StatCard, Badge, Panel, Tabs, ActionButton, ItemGrid, Fullscreen。

---

### 样式技巧

**内联样式**——最直接，不依赖任何框架：

```tsx
<div style={{
  background: "linear-gradient(135deg, #1a1a2e, #16213e)",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
}}>
```

**Tailwind CSS 类**——Yumina 自带 Tailwind 4，大部分类名直接可用：

```tsx
<div className="rounded-xl bg-slate-900 p-4 border border-slate-700">
```

提醒：Tailwind 的任意值语法（比如 `bg-[#1a1a2e]`）在自定义组件里也可以用，引擎会在运行时自动处理。

**动画效果**——用 CSS @keyframes。在 `useEffect` 里注入全局样式：

```tsx
React.useEffect(() => {
  if (!document.querySelector("style[data-my-renderer]")) {
    const s = document.createElement("style");
    s.setAttribute("data-my-renderer", "1");
    s.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .my-fade-in { animation: fadeIn 0.4s ease-out; }
    `;
    document.head.appendChild(s);
  }
}, []);
```

**Google Fonts**——同理，在 `useEffect` 里动态加载：

```tsx
React.useEffect(() => {
  if (!document.querySelector("link[data-my-font]")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap";
    link.setAttribute("data-my-font", "1");
    document.head.appendChild(link);
  }
}, []);
```

---

### 调试方法

**编辑器实时编译**：每次修改代码后，编辑器底部会显示编译状态。看到绿色 "OK" 就说明语法没问题。

**常见错误和解决方案**：

| 症状 | 原因 | 解决 |
|---|---|---|
| "No component exported" | 忘了写 `export default` | 函数前加 `export default` |
| "Unexpected token" | JSX 语法错误，比如标签没闭合 | 检查每个 `<div>` 是否有对应的 `</div>` |
| 渲染器白屏 | 运行时报错（比如访问了 undefined 属性） | 加安全检查：`variables?.health ?? 0` |
| 样式不生效 | Tailwind 任意值写法有误 | 换成内联 style 试试 |
| `import` 报错 | 沙盒环境不支持 import | 用全局变量 `React`、`Icons`、`YUI` |

**在浏览器控制台调试**：打开浏览器开发者工具（F12），在 Console 面板里可以看到运行时错误。错误会带上 `Component Error` 前缀。

---

## 实用例子

### 例 1：简单气泡渲染器

把 AI 回复包在一个带圆角、带角色名的气泡里。最基础的起步模板。

```tsx
export default function BubbleRenderer({ content, role, renderMarkdown }) {
  const isUser = role === "user";

  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "8px",
    }}>
      <div style={{
        maxWidth: "80%",
        background: isUser
          ? "linear-gradient(135deg, #2563eb, #1d4ed8)"
          : "linear-gradient(135deg, #1e293b, #0f172a)",
        borderRadius: "16px",
        borderTopLeftRadius: isUser ? "16px" : "4px",
        borderTopRightRadius: isUser ? "4px" : "16px",
        padding: "12px 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      }}>
        {/* 角色名 */}
        <div style={{
          fontSize: "12px",
          fontWeight: "bold",
          color: isUser ? "#93c5fd" : "#fbbf24",
          marginBottom: "6px",
        }}>
          {isUser ? "你" : "叙述者"}
        </div>

        {/* 消息内容 */}
        <div
          style={{ color: "#e2e8f0", lineHeight: "1.7", fontSize: "14px" }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      </div>
    </div>
  );
}
```

---

### 例 2：视觉小说风格

背景图 + 角色名 + 对话文字，营造 Galgame 的感觉。

```tsx
export default function VNRenderer({ content, variables, renderMarkdown }) {
  const api = useYumina();
  const speaker = variables["current-speaker"] || "???";
  const bg = variables["current-bg"] || "";

  // 注入动画样式
  React.useEffect(() => {
    if (!document.querySelector("style[data-vn-renderer]")) {
      const s = document.createElement("style");
      s.setAttribute("data-vn-renderer", "1");
      s.textContent = `
        @keyframes vn-text-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .vn-text-fade { animation: vn-text-in 0.3s ease-out; }
      `;
      document.head.appendChild(s);
    }
  }, []);

  return (
    <div style={{
      position: "relative",
      borderRadius: "12px",
      overflow: "hidden",
      minHeight: "200px",
      background: "#0a0a0f",
    }}>
      {/* 背景图 */}
      {bg && (
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
          filter: "blur(1px)",
        }} />
      )}

      {/* 对话区域 */}
      <div style={{
        position: "relative",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        minHeight: "200px",
      }}>
        {/* 说话者名字 */}
        <div style={{
          display: "inline-block",
          background: "rgba(212, 168, 72, 0.15)",
          border: "1px solid rgba(212, 168, 72, 0.3)",
          borderRadius: "4px",
          padding: "2px 12px",
          marginBottom: "8px",
          alignSelf: "flex-start",
        }}>
          <span style={{
            color: "#d4a848",
            fontSize: "13px",
            fontWeight: "bold",
            letterSpacing: "2px",
          }}>
            {speaker}
          </span>
        </div>

        {/* 对话文字 */}
        <div style={{
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
          borderRadius: "8px",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "16px 20px",
        }}>
          <div
            className="vn-text-fade"
            style={{
              color: "#e8e0d0",
              fontSize: "15px",
              lineHeight: "2.0",
              fontFamily: '"Noto Serif SC", "Source Han Serif SC", Georgia, serif',
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </div>
      </div>
    </div>
  );
}
```

使用提示：让 AI 在回复中用 `[current-speaker: set "角色名"]` 指令来切换说话者，用 `[current-bg: set "图片URL"]` 来切换背景。

---

### 例 3：战斗日志风格

带时间戳和颜色标记的日志条目，适合战斗/探索类游戏。

```tsx
export default function BattleLogRenderer({ content, variables, renderMarkdown }) {
  const hp = Number(variables["health"] ?? 100);
  const maxHp = Number(variables["max-health"] ?? 100);
  const hpPercent = maxHp > 0 ? Math.min(100, (hp / maxHp) * 100) : 0;
  const hpColor = hp < 30 ? "#ef4444" : hp < 60 ? "#f59e0b" : "#22c55e";

  // 把回复内容按换行拆成日志条目
  const lines = (content || "").split("\n").filter(function(l) {
    return l.trim().length > 0;
  });

  // 根据内容猜测日志条目类型
  function getLineType(line) {
    if (/伤害|攻击|击中/.test(line)) return "damage";
    if (/治愈|回复|恢复/.test(line)) return "heal";
    if (/闪避|格挡|防御/.test(line)) return "defense";
    if (/获得|掉落|拾取/.test(line)) return "loot";
    return "narration";
  }

  var typeColors = {
    damage:    { dot: "#ef4444", text: "#fca5a5" },
    heal:      { dot: "#22c55e", text: "#86efac" },
    defense:   { dot: "#3b82f6", text: "#93c5fd" },
    loot:      { dot: "#f59e0b", text: "#fcd34d" },
    narration: { dot: "#6b7280", text: "#d1d5db" },
  };

  return (
    <div style={{
      background: "#0c0c0c",
      border: "1px solid #1f2937",
      borderRadius: "8px",
      padding: "12px",
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
    }}>
      {/* HP 状态条 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
        padding: "8px 10px",
        background: "#111",
        borderRadius: "6px",
      }}>
        <Icons.Heart size={14} style={{ color: hpColor }} />
        <div style={{ flex: 1, height: "6px", background: "#1f2937", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{
            width: hpPercent + "%",
            height: "100%",
            background: hpColor,
            borderRadius: "3px",
            transition: "width 0.5s ease",
          }} />
        </div>
        <span style={{ color: hpColor, fontSize: "12px", fontWeight: "bold" }}>
          {hp}/{maxHp}
        </span>
      </div>

      {/* 日志条目 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {lines.map(function(line, i) {
          var type = getLineType(line);
          var colors = typeColors[type];
          return (
            <div key={i} style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              padding: "4px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}>
              {/* 时间戳 */}
              <span style={{ color: "#4b5563", fontSize: "11px", whiteSpace: "nowrap", marginTop: "2px" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {/* 类型标记点 */}
              <span style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: colors.dot,
                marginTop: "6px",
                flexShrink: 0,
              }} />
              {/* 内容 */}
              <span style={{ color: colors.text, fontSize: "13px", lineHeight: "1.6" }}>
                {line}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 下一步

- 想做独立 UI 面板（侧边栏、角色创建界面）？请看 **07-components.md**
- 想让 AI 的回复自动改变游戏状态？请看 **06-rules-engine.md** 和 **04-variables.md**
- 想加背景音乐和音效？请看 **09-audio.md**

</div>
