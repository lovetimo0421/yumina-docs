<div v-pre>

# 自定义消息渲染器

> 深入篇。如果你看完了 [自定义 UI 指南](./07-components.md)，想搞懂渲染器底层是怎么运作的——架构、TSX 语法、样式技巧、调试方法——这就是你要找的页面。

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

但说实话，这是一个**深入篇**。如果你完全没接触过 HTML 或 React，建议先看 [自定义 UI 指南](./07-components.md)——那里不需要你写代码也能搞定。

---

### 在动手之前：搞清楚三层架构

在深入渲染器代码之前，先花两分钟搞懂整个系统是怎么运转的。理解了这个大图，后面看代码就不会迷路。

这个系统分三层：

```
用户发消息
    ↓
AI（大模型）生成回复文字
    ↓
消息渲染器把文字"包装"成带状态栏的 UI
```

#### 第一层：AI 回复内容

AI（大语言模型）就是普通地生成一段文字回复，但同时它会在回复里偷偷夹带"指令"，比如：

```
今天天气真好呢～

[affection: add 5]
[mood: set 开心]
```

这些 `[...]` 括号里的东西叫**指令（Directive）**，玩家看不到，但系统能读懂。指令的详细用法见 [指令与宏](./05-directives-and-macros.md)。

#### 第二层：变量系统

系统读取到 `[affection: add 5]` 之后，就会把 `affection`（好感度）这个变量从 50 改成 55。

变量就像游戏里的存档数据，存在服务器上，随时可以读取。变量的详细用法见 [变量](./04-variables.md)。

#### 第三层：消息渲染器（前端 UI）

这是最关键的部分，也是本章的主角。

默认情况下，AI 的回复就是一段普通的 Markdown 文字。但你开启了消息渲染器之后，每条消息在显示之前都会经过一个 TSX 函数（可以理解成一个"模板"），这个函数接收：

| 输入 | 含义 |
|------|------|
| `content` | AI 说的话（文字） |
| `variables` | 当前所有变量的值（好感度=55, 心情=开心） |

然后输出带状态栏的 UI：

```
┌─────────────────────────────┐
│ 今天天气真好呢～              │
│                             │
│ ❤️ 好感度 ████████░░  55    │
│ 😊 心情：开心               │
└─────────────────────────────┘
```

#### 完整流程

把三层串起来：

```
① 你发消息："你好！"
        ↓
② AI 生成回复文字 + [affection: add 2] 指令
        ↓
③ 系统解析指令，更新变量（好感度 → 52）
        ↓
④ 消息渲染器函数被调用
   输入：{ content: "你好呀～", variables: { affection: 52, mood: "开心" } }
        ↓
⑤ 函数输出带状态栏的 HTML，显示在屏幕上
```

> **一句话总结**：AI 负责生成文字和改变数据，渲染器负责把数据变成好看的 UI，两者通过"变量"连接在一起。

---

### 读懂一个真实的渲染器

理解了三层架构之后，来看一个真实的渲染器代码是怎么写的。下面是一个最简单的"好感度 + 心情状态栏"渲染器：

```tsx
export default function ChatRenderer({ content, role, variables, renderMarkdown }) {
  // 用户消息直接显示，不加状态栏
  if (role === "user") {
    return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />;
  }

  // 从变量里读数据，给默认值
  var affection = variables.affection !== undefined ? Number(variables.affection) : 50;
  var mood = variables.mood || "开心";

  // 心情 → emoji 和颜色的映射
  var moodEmoji = { "开心": "😊", "平静": "😌", "害羞": "😳", "生气": "😠" };
  var moodColor = { "开心": "text-yellow-400", "平静": "text-blue-400", "害羞": "text-pink-400", "生气": "text-red-400" };

  // 好感度 → 进度条颜色
  var barColor = affection >= 70 ? "bg-pink-500" : affection >= 40 ? "bg-yellow-500" : "bg-gray-500";

  return (
    <div className="space-y-2">
      {/* AI 说的话 */}
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />

      {/* 状态栏 */}
      <div className="mt-3 px-3 py-2 rounded-lg bg-muted border border-border text-sm flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Icons.Heart size={14} className="text-pink-400" />
          <span>好感度</span>
          <div className="flex-1 bg-background rounded-full h-2">
            <div className={"h-2 rounded-full " + barColor} style={{ width: affection + "%" }} />
          </div>
          <span>{affection}</span>
        </div>
        <div className={"flex items-center gap-1 " + (moodColor[mood] || "text-gray-400")}>
          <span>{moodEmoji[mood] || "😐"}</span>
          <span>{mood}</span>
        </div>
      </div>
    </div>
  );
}
```

逐块拆解：

| 代码 | 作用 |
|------|------|
| `if (role === "user")` | 用户消息直接渲染文字，不加状态栏 |
| `variables.affection` | 从变量系统读取好感度的当前值 |
| `moodEmoji` / `moodColor` | 数据→样式的映射表，心情不同，显示不同的 emoji 和颜色 |
| `barColor` | 好感度高低决定进度条颜色（粉/黄/灰） |
| `dangerouslySetInnerHTML` | React 渲染 HTML 字符串的标准方式 |
| `style={{ width: affection + "%" }}` | 进度条宽度直接绑定变量值，变量变了进度条自动变 |
| `className="rounded-lg bg-muted ..."` | Tailwind CSS 样式类，`rounded-lg` = 圆角，`bg-muted` = 跟随主题的灰色背景 |

> 变量是数据，TSX 是模板。每次消息显示时把数据填进模板里，生成最终的 HTML——就像 Excel 里的公式，单元格的值变了，显示结果自动更新。

---

## 详细版

::: info 想看总览？
三种自定义级别（默认聊天、消息模板、应用模板）、完整的 useYumina() SDK 参考、YUI 组件库 → [自定义 UI 指南](./07-components.md)
:::

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

快速参考表 → [自定义 UI 指南：消息模板 Props](./07-components.md#message-template-props)

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

### useYumina() —— 和游戏引擎交互

除了 Props，`useYumina()` 还可以让你发消息、改变量、触发规则、播放音频等等。

```tsx
export default function MyRenderer({ content, renderMarkdown }) {
  var api = useYumina();

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      <button onClick={function() { api.sendMessage("攻击") }}>攻击</button>
      <button onClick={function() { api.setVariable("health", 100) }}>回满血</button>
      <button onClick={function() { api.executeAction("flee") }}>触发逃跑规则</button>
    </div>
  );
}
```

完整的 SDK 参考（8 大类 30+ 方法）→ [自定义 UI 指南：useYumina() SDK](./07-components.md#the-useyumina-sdk)

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

**编辑器实时编译**：每次修改代码后，编辑器底部会显示编译状态。看到绿色"正常"就说明语法没问题。

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
  var isUser = role === "user";

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
  var api = useYumina();
  var speaker = variables["current-speaker"] || "???";
  var bg = variables["current-bg"] || "";

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
  var hp = Number(variables["health"] ?? 100);
  var maxHp = Number(variables["max-health"] ?? 100);
  var hpPercent = maxHp > 0 ? Math.min(100, (hp / maxHp) * 100) : 0;
  var hpColor = hp < 30 ? "#ef4444" : hp < 60 ? "#f59e0b" : "#22c55e";

  // 把回复内容按换行拆成日志条目
  var lines = (content || "").split("\n").filter(function(l) {
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

- 完整的 SDK 参考、YUI 组件库、实用 AI prompt → [自定义 UI 指南](./07-components.md)
- 想让 AI 的回复自动改变游戏状态？请看 **06-rules-engine.md** 和 **04-variables.md**
- 想加背景音乐和音效？请看 **09-audio.md**

</div>
