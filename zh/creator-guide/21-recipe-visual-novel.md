<div v-pre>

# 视觉小说模式

> 把聊天界面变成一个完整的视觉小说——场景背景、角色立绘、对话框、选项按钮，全都由 AI 通过指令驱动。用 YUI.Scene、YUI.Sprite、YUI.DialogueBox、YUI.ChoiceButtons 和 YUI.Fullscreen 组合出沉浸式 VN 体验。

---

## 你要做的东西

一个全屏视觉小说界面：

- **场景背景**——AI 通过指令切换背景图片（教室、街道、夜空……），消息渲染器用 `YUI.Scene` 全屏显示
- **角色立绘**——AI 通过指令设定当前说话的角色和情绪，`YUI.Sprite` 在画面上显示对应的立绘
- **对话框**——画面底部的半透明对话框，显示角色名和台词。*斜体文字*自动识别为旁白/内心独白，普通文字是角色对话
- **选项按钮**——AI 给出选项时，`YUI.ChoiceButtons` 在画面上叠加可点击的按钮
- **全屏模式**——用 `fullScreenComponent: true` 把整个聊天区变成 VN 画面，没有普通聊天气泡

### 原理

AI 在每段回复里用指令控制画面：

```
AI 的回复内容：
[current_bg: set "classroom_morning.jpg"]
[current_speaker: set "小雪"]
[speaker_emotion: set "happy"]

*教室里阳光正好，窗外的樱花瓣偶尔飘进来。*

小雪转过头来，笑着说：

"早上好！今天来得好早啊。"
```

引擎解析这些指令后：
1. `current_bg` 变成 `"classroom_morning.jpg"` → 消息渲染器用 `YUI.Scene` 把背景换成教室
2. `current_speaker` 变成 `"小雪"` → 对话框显示角色名「小雪」
3. `speaker_emotion` 变成 `"happy"` → `YUI.Sprite` 显示小雪的开心立绘
4. 消息渲染器解析文本——*斜体*部分作为旁白显示，普通引号对话作为角色台词显示

```
引擎处理流程：
  AI 回复 → 引擎提取指令 → 更新变量 → 消息渲染器读取变量
    → YUI.Scene 渲染背景
    → YUI.Sprite 渲染立绘
    → YUI.DialogueBox 渲染对话框（区分旁白/台词）
    → YUI.ChoiceButtons 渲染选项（如果 show_choices = true）
```

---

## 一步步来

### 第 1 步：创建变量

我们需要 4 个变量来控制视觉小说的画面。

编辑器 → 左侧边栏 → **变量** 标签页 → 逐个点击「添加变量」

#### 变量 1：当前背景

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 当前背景 | 给你自己看的，方便识别 |
| ID | `current_bg` | AI 用 `[current_bg: set "xxx"]` 来切换背景 |
| 类型 | 字符串 | 因为值是图片 URL 或文件名 |
| 默认值 | `default_bg.jpg` | 新会话开始时的默认背景。换成你自己的图片 URL |
| 分类 | 自定义 | VN 系统专用分类 |
| 行为规则 | `用 [current_bg: set "图片URL"] 来切换场景背景。每当场景发生变化时都要更新这个变量。` | 告诉 AI 什么时候、怎么改这个变量 |

#### 变量 2：当前说话者

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 当前说话者 | 给你自己看的 |
| ID | `current_speaker` | AI 用 `[current_speaker: set "角色名"]` 来切换 |
| 类型 | 字符串 | 值是角色名字 |
| 默认值 | `旁白` | 默认是旁白模式，没有特定角色在说话 |
| 分类 | 自定义 | VN 系统专用分类 |
| 行为规则 | `用 [current_speaker: set "角色名"] 来设置当前说话的角色。旁白/内心描写时设为 "旁白"。` | 告诉 AI 使用规则 |

#### 变量 3：角色情绪

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 角色情绪 | 给你自己看的 |
| ID | `speaker_emotion` | AI 用 `[speaker_emotion: set "happy"]` 来切换表情 |
| 类型 | 字符串 | 值是情绪关键词 |
| 默认值 | `neutral` | 默认是中性表情 |
| 分类 | 自定义 | VN 系统专用分类 |
| 行为规则 | `用 [speaker_emotion: set "情绪"] 来改变角色的表情。可用的情绪有：neutral, happy, sad, angry, surprised, shy。每次角色情绪变化时都要更新。` | 列出可用的情绪，AI 就不会编造不存在的表情 |

#### 变量 4：显示选项

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 显示选项 | 给你自己看的 |
| ID | `show_choices` | AI 用 `[show_choices: set true]` 来显示选项按钮 |
| 类型 | 布尔 | 只有两种状态：显示/隐藏 |
| 默认值 | `false` | 默认不显示选项按钮 |
| 分类 | 自定义 | VN 系统专用分类 |
| 行为规则 | `当你要给玩家提供选择时，用 [show_choices: set true]。平时保持 false。` | 告诉 AI 只在需要玩家选择的时候才打开 |

::: info 为什么让 AI 用指令控制画面？
这是 Yumina 的核心设计——AI 不执行代码，而是通过结构化指令告诉引擎要做什么。引擎解析指令、更新变量、渲染器读取变量来更新画面。整个链条是：AI 写指令 → 引擎解析 → 变量更新 → 渲染器刷新。
:::

---

### 第 2 步：创建知识条目——VN 系统指令

AI 需要知道它在一个视觉小说环境里，以及怎么使用指令来控制画面。

编辑器 → **知识库** 标签页 → 新建条目

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 名称 | 视觉小说系统指令 | 给你自己看的 |
| 区域 | 预设 | 预设区的条目每次都会发给 AI |
| 启用 | **是**（打开开关） | 始终启用 |

内容：

```
[视觉小说模式]
你正在为一个视觉小说引擎生成内容。每段回复必须包含指令来控制画面。

格式规则：
1. 在回复开头用指令设置场景：
   [current_bg: set "背景图片URL"]
   [current_speaker: set "角色名"]
   [speaker_emotion: set "情绪"]

2. 文本格式：
   - *斜体文字* = 旁白或内心独白。用来描写环境、角色动作、内心想法。
   - 普通文字（不加格式）= 角色说的台词/对话。
   - 不要用引号包裹台词，直接写普通文字即可。

3. 当你想让玩家做选择时：
   - 用 [show_choices: set true]
   - 在文本末尾列出选项，格式为：
     A) 选项内容
     B) 选项内容
     C) 选项内容

4. 每段回复只写一个场景片段（3-5 句话），保持节奏紧凑，像真正的视觉小说一样。

5. 可用的情绪：neutral, happy, sad, angry, surprised, shy

6. 切换场景时一定要更新 current_bg。角色说话时一定要更新 current_speaker 和 speaker_emotion。
```

> **为什么要写得这么详细？** 因为 AI 不知道你的渲染器怎么工作。你必须明确告诉它"斜体 = 旁白、普通文字 = 对话"，否则 AI 可能用随机的格式写，渲染器就无法正确区分旁白和台词。

---

### 第 3 步：准备素材

视觉小说需要背景图和角色立绘。你可以用任意图片 URL。

**背景图：**

准备几张场景背景图，记下它们的 URL 或文件名。例如：

| 场景 | 文件名 / URL | 用途 |
|------|-------------|------|
| 教室（白天） | `classroom_morning.jpg` | 上课、聊天场景 |
| 校园走廊 | `hallway.jpg` | 过渡场景 |
| 街道（傍晚） | `street_evening.jpg` | 放学场景 |
| 房间（夜晚） | `room_night.jpg` | 睡前场景 |

**角色立绘：**

每个角色准备多个表情的立绘。文件名建议用统一格式：`角色名_情绪.png`。

| 角色 | 文件名格式 | 示例 |
|------|-----------|------|
| 小雪 | `xiaoxue_情绪.png` | `xiaoxue_happy.png`, `xiaoxue_sad.png` |
| 老师 | `teacher_情绪.png` | `teacher_neutral.png`, `teacher_angry.png` |

> **没有素材也能测试。** 渲染器代码可以在图片加载失败时显示纯色背景和文字占位符。先把逻辑跑通，素材以后慢慢补。

---

### 第 4 步：写首条消息

首条消息是视觉小说的开场。它需要包含指令来设置初始画面。

编辑器 → **首条消息** 标签页 → 创建首条消息

```
[current_bg: set "classroom_morning.jpg"]
[current_speaker: set "旁白"]
[speaker_emotion: set "neutral"]

*四月的第一天，樱花季的尾巴。*

*你推开教室的门，熟悉的粉笔灰和木头的气味扑面而来。大部分座位还空着——离上课还有十分钟。*

*靠窗的位置上，一个你没见过的女生正安静地看着窗外。*

[current_speaker: set "旁白"]
*她是转学生吗？你不记得班上有这个人。*
```

> **为什么首条消息也要写指令？** 因为消息渲染器靠变量来决定显示什么。首条消息的指令会被引擎解析，设好初始的背景和角色状态。如果不写指令，默认值会生效（`default_bg.jpg` + `旁白` + `neutral`），但画面可能不够贴合开场。

---

### 第 5 步：做视觉小说消息渲染器

这是核心步骤。消息渲染器把普通的聊天消息变成视觉小说画面。

编辑器 → **消息渲染器** 标签页 → 选「自定义 TSX」→ 粘贴以下代码：

```tsx
export default function Renderer({ content, renderMarkdown, messageIndex }) {
  const api = useYumina();

  // ---- 读取变量 ----
  const bgUrl = String(api.variables.current_bg || "default_bg.jpg");
  const speaker = String(api.variables.current_speaker || "旁白");
  const emotion = String(api.variables.speaker_emotion || "neutral");
  const showChoices = Boolean(api.variables.show_choices);

  // ---- 清理内容：去掉指令行，只保留叙事文本 ----
  const cleanContent = content
    .split("\n")
    .filter((line) => !line.trim().match(/^\[.+:\s*(set|add|subtract|multiply|toggle|append|merge|push|delete)\s+.+\]$/) && !line.trim().match(/^\[.+:\s*[+-]?\d+\]$/))
    .join("\n")
    .trim();

  // ---- 解析文本：区分旁白（斜体）和对话（普通文字） ----
  // 把文本拆成段落，每段判断是旁白还是台词
  const paragraphs = cleanContent
    .split("\n\n")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const parsed = paragraphs.map((p) => {
    // 如果整段被 * 包裹，或者段落里的每一行都是 *斜体*，就是旁白
    const isNarration = /^\*[^*].*[^*]\*$/.test(p.trim())
      || p.trim().startsWith("*");
    // 检查是否是选项行（A) B) C) 格式）
    const isChoice = /^[A-Z]\)\s/.test(p.trim());
    return { text: p, isNarration, isChoice };
  });

  // ---- 立绘 URL（根据角色名和情绪拼接） ----
  const spriteUrl = speaker !== "旁白"
    ? `/sprites/${speaker.toLowerCase()}_${emotion}.png`
    : null;

  // ---- 选项提取 ----
  const choices = parsed
    .filter((p) => p.isChoice)
    .map((p) => p.text.replace(/^[A-Z]\)\s*/, ""));

  // ---- 渲染 ----
  return (
    <div style={{
      position: "relative",
      width: "100%",
      minHeight: "500px",
      borderRadius: "12px",
      overflow: "hidden",
      background: "#000",
    }}>
      {/* ===== 背景层 (YUI.Scene) ===== */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "brightness(0.7)",
        transition: "background-image 0.8s ease",
      }} />

      {/* ===== 角色立绘层 (YUI.Sprite) ===== */}
      {spriteUrl && (
        <div style={{
          position: "absolute",
          bottom: "120px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          transition: "opacity 0.5s ease",
        }}>
          <img
            src={spriteUrl}
            alt={`${speaker} - ${emotion}`}
            style={{
              maxHeight: "350px",
              objectFit: "contain",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))",
            }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        </div>
      )}

      {/* ===== 对话框层 (YUI.DialogueBox) ===== */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 3,
        background: "linear-gradient(transparent, rgba(0,0,0,0.85) 30%)",
        padding: "60px 24px 24px",
      }}>
        {/* 角色名标签 */}
        {speaker !== "旁白" && (
          <div style={{
            display: "inline-block",
            padding: "4px 16px",
            marginBottom: "8px",
            background: "rgba(99,102,241,0.8)",
            borderRadius: "6px 6px 0 0",
            color: "#e0e7ff",
            fontSize: "14px",
            fontWeight: "bold",
            letterSpacing: "0.05em",
          }}>
            {speaker}
          </div>
        )}

        {/* 文本内容 */}
        <div style={{
          background: "rgba(15,23,42,0.9)",
          borderRadius: speaker !== "旁白" ? "0 12px 12px 12px" : "12px",
          padding: "16px 20px",
          border: "1px solid rgba(148,163,184,0.2)",
          minHeight: "80px",
        }}>
          {parsed
            .filter((p) => !p.isChoice)
            .map((p, i) => (
              <p key={i} style={{
                margin: i > 0 ? "10px 0 0" : "0",
                color: p.isNarration ? "#94a3b8" : "#e2e8f0",
                fontStyle: p.isNarration ? "italic" : "normal",
                fontSize: "15px",
                lineHeight: 1.8,
              }}
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(
                  p.isNarration
                    ? p.text.replace(/^\*|\*$/g, "")
                    : p.text
                ),
              }}
              />
            ))
          }
        </div>
      </div>

      {/* ===== 选项按钮层 (YUI.ChoiceButtons) ===== */}
      {showChoices && choices.length > 0 && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 4,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "80%",
          maxWidth: "400px",
        }}>
          {choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => {
                api.setVariable("show_choices", false);
                api.sendMessage(choice);
              }}
              style={{
                padding: "14px 20px",
                background: "rgba(30,27,75,0.9)",
                border: "1px solid rgba(99,102,241,0.6)",
                borderRadius: "10px",
                color: "#c7d2fe",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease",
                backdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(67,56,202,0.8)";
                e.target.style.borderColor = "#818cf8";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(30,27,75,0.9)";
                e.target.style.borderColor = "rgba(99,102,241,0.6)";
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**代码逐块解释：**

- **清理内容** — `cleanContent` 把 `[current_bg: set "xxx"]` 这类指令行过滤掉（匹配所有操作类型：set/add/subtract/multiply/toggle/append/merge/push/delete，以及 `[hp: -10]` 这样的简写指令）。指令已经被引擎解析过了，渲染器不需要再显示它们
- **解析段落** — 把文本按空行拆成段落，逐段判断是旁白（以 `*` 开头）还是对话（普通文字），或者是选项（以 `A)` 格式开头）
- **背景层** — 用 `backgroundImage` 显示当前场景背景。`filter: brightness(0.7)` 让背景略暗，确保前景文字可读。`transition` 让背景切换有渐变动画
- **立绘层** — 根据 `speaker` 和 `emotion` 拼出立绘文件路径。`onError` 处理图片不存在的情况（静默隐藏）。旁白模式时不显示立绘
- **对话框层** — 底部的半透明对话框。如果 `speaker` 不是「旁白」，会在对话框上方显示角色名标签。旁白文字用灰色斜体，对话文字用白色正体
- **选项按钮层** — 当 `show_choices` 为 `true` 且文本中有 `A)` `B)` `C)` 格式的选项时，在画面中央显示按钮。点击后自动隐藏选项（`show_choices` 设为 `false`）并发送玩家的选择

::: tip 自定义立绘路径
代码里用 `/sprites/${speaker.toLowerCase()}_${emotion}.png` 拼立绘路径。你可以改成任何 URL 格式——CDN 链接、本地文件路径、或者一个映射表。如果你的角色名是中文，记得 URL 编码或者用英文 ID。
:::

---

### 第 6 步：开启全屏模式

视觉小说应该占满整个屏幕，而不是像普通聊天那样显示气泡。

编辑器 → **设置** 标签页 → 找到「全屏组件」选项 → 打开

这个设置对应 `fullScreenComponent: true`。开启后：
- 聊天区域不再显示普通的消息气泡
- 消息渲染器的输出会占满整个可视区域
- 玩家的输入框仍然在底部，但可以用选项按钮替代手动输入

> **什么时候该开全屏？** 如果你想要纯正的 VN 体验——全屏背景、立绘、对话框，没有聊天界面的痕迹——就开。如果你想保留普通聊天功能、只是在某些消息上用 VN 样式，就不开。

---

### 第 7 步：AI 怎么驱动画面——指令示例

让我们看看 AI 在实际对话中如何自然地控制视觉小说画面。

**场景 1：开场（旁白模式）**

AI 的回复：
```
[current_bg: set "classroom_morning.jpg"]
[current_speaker: set "旁白"]
[speaker_emotion: set "neutral"]

*四月的清晨，空气里飘着樱花的甜香。*

*你走进教室，发现靠窗的座位上坐着一个陌生的女生。她正托着腮，望着窗外出神。*
```

渲染效果：教室背景 + 无立绘 + 灰色斜体旁白文字。

**场景 2：角色对话**

AI 的回复：
```
[current_speaker: set "小雪"]
[speaker_emotion: set "surprised"]

*她似乎注意到了你的视线，转过头来。*

啊，你好。你也是这个班的吗？

[speaker_emotion: set "shy"]

抱歉，我是今天刚转来的……还不太认识人。
```

渲染效果：背景不变（没有 `current_bg` 指令就保持上一个值） + 小雪立绘先显示 surprised 表情再切换到 shy + 对话框显示角色名「小雪」+ 斜体旁白和正体台词交替。

**场景 3：给玩家选择**

AI 的回复：
```
[current_speaker: set "旁白"]
[show_choices: set true]

*小雪看着你，眼神里带着一丝期待。*

*你要怎么做？*

A) 自我介绍，主动和她聊天
B) 微微点头，回到自己的座位
C) 帮她介绍教室和学校的情况
```

渲染效果：旁白文字 + 画面中央出现三个可点击按钮。玩家点击后，选项消失，选中的文字作为玩家回复发送给 AI。

**场景 4：场景切换**

AI 的回复：
```
[current_bg: set "hallway.jpg"]
[current_speaker: set "旁白"]

*下课铃响了。走廊里瞬间热闹起来，同学们三三两两地往外走。*

[current_speaker: set "小雪"]
[speaker_emotion: set "happy"]

一起去天台吃午饭吧？我发现了一个很好的地方。
```

渲染效果：背景切换到走廊（有渐变动画） + 旁白描写 + 小雪开心立绘 + 台词。

---

### 第 8 步：斜体旁白 vs 普通对话——解析规则

消息渲染器区分两种文本的规则很简单：

| 格式 | 被识别为 | 显示效果 | 用途 |
|------|---------|---------|------|
| `*这是斜体文字*` | 旁白 | 灰色 (#94a3b8)，斜体 | 环境描写、角色动作、内心独白 |
| `这是普通文字` | 对话 | 白色 (#e2e8f0)，正体 | 角色说的话 |
| `A) 选项文字` | 选项 | 按钮 | 玩家可点击的选择 |

AI 在知识条目里已经被告知了这个规则。但如果 AI 偶尔格式不对（比如对话用了斜体），渲染器的 fallback 逻辑会把不确定的文本当作对话处理——这样至少不会出错。

> **为什么不用 Markdown 的 `>` 引用或 `**粗体**` 来区分？** 因为 `*斜体*` 是最自然的标记方式——大多数 AI 在角色扮演场景里已经习惯用斜体写旁白/动作描写，不需要额外训练。选一个 AI 最容易遵守的格式，省得和 AI 较劲。

---

### 第 9 步：保存并测试

1. 点击编辑器顶部的「保存」
2. 点击「开始游戏」或回到首页开一个新会话
3. 你应该看到全屏的 VN 画面——背景 + 对话框 + 开场旁白
4. 在输入框里发一条消息（比如"向她打招呼"）
5. AI 的回复应该包含指令——背景可能切换，角色出现，对话框里有台词
6. 如果 AI 给出了选项，画面中央会出现按钮。点击一个试试
7. 继续对话，观察 AI 是否自然地在场景切换时更新 `current_bg`，在角色说话时更新 `current_speaker` 和 `speaker_emotion`

**如果遇到问题：**

| 现象 | 可能的原因 | 解决方法 |
|------|-----------|---------|
| 背景是黑色的 | 图片 URL 不正确或图片不存在 | 检查 `current_bg` 的值是否是有效的图片 URL。先用浏览器直接打开 URL 确认图片能加载 |
| 看不到立绘 | 立绘文件路径不匹配 | 检查 `/sprites/角色名_情绪.png` 路径是否正确。`onError` 会静默隐藏加载失败的图片 |
| 指令行显示在画面上 | 指令格式不标准，正则没匹配到 | 确认指令格式是 `[变量名: set "值"]`，注意冒号后面有空格 |
| 所有文字都是旁白/都是对话 | AI 没遵守格式规则 | 检查知识条目里的格式说明是否清晰。可以在行为规则里再强调一次 |
| 选项按钮不出现 | `show_choices` 没被设为 `true`，或者没有 `A)` 格式的选项 | 检查 AI 回复里是否包含 `[show_choices: set true]` 和 `A)` 格式的选项 |
| 画面不是全屏 | 没开启全屏组件 | 回到编辑器 → 设置 → 打开「全屏组件」 |

---

## 进阶技巧

### 多角色对话

同一段回复里可以切换多个角色：

```
[current_speaker: set "小雪"]
[speaker_emotion: set "happy"]
今天天气真好啊！

[current_speaker: set "老师"]
[speaker_emotion: set "neutral"]
好了同学们，上课了。请回到座位上。

[current_speaker: set "旁白"]
*教室里瞬间安静下来。*
```

消息渲染器会按顺序渲染，最终画面显示的是最后一个 `current_speaker` 的立绘。如果你想让每段对话都显示对应角色的立绘，可以在渲染器里对每个段落单独解析前面最近的 `[current_speaker: set ...]` 指令。

### 转场效果

在背景层的 CSS 里加 `transition: background-image 0.8s ease`，切换背景时会有渐变效果。你还可以根据场景类型用不同的转场：

- 普通切换：渐变（已实现）
- 闪回/回忆：可以加白色闪光叠加层
- 紧张场景：可以加屏幕震动动画

### 配合音效和 BGM

结合配方 #9（日夜循环）的音频系统，你可以为不同场景配 BGM。在行为规则里添加：当 `current_bg` 变化时，播放对应场景的 BGM。

---

## 速查表

| 你想做的事 | 怎么做 |
|-----------|--------|
| 切换背景 | AI 发 `[current_bg: set "图片URL"]` |
| 切换说话者 | AI 发 `[current_speaker: set "角色名"]` |
| 切换表情 | AI 发 `[speaker_emotion: set "情绪"]` |
| 显示选项按钮 | AI 发 `[show_choices: set true]` + `A) B) C)` 格式选项 |
| 区分旁白和对话 | `*斜体*` = 旁白，普通文字 = 对话 |
| 全屏 VN 体验 | 编辑器 → 设置 → 打开「全屏组件」(`fullScreenComponent: true`) |
| 角色立绘 | 准备 `角色名_情绪.png` 文件，放在 `/sprites/` 目录 |
| 玩家点选项后发消息 | 按钮 `onClick` 里调用 `api.sendMessage(选项文字)` |

---

## 直接试试——可导入的示例世界

下载这个 JSON 文件，导入即可体验完整效果：

<a href="/recipe-10-demo-zh.json" download>recipe-10-demo-zh.json</a>

**导入方法：**
1. 进入 Yumina → 我的世界 → 创建新世界
2. 在编辑器顶部点「更多操作」→「导入包」
3. 选择下载的 `.json` 文件
4. 世界会被创建，所有变量、条目、行为和渲染器都已预配置好
5. 开一个新会话试试看

**包含内容：**
- 4 个变量（`current_bg` 背景、`current_speaker` 说话者、`speaker_emotion` 情绪、`show_choices` 选项开关）
- 1 个知识条目（视觉小说系统指令，告诉 AI 如何使用指令和文本格式）
- 1 个首条消息（包含初始指令的 VN 开场白）
- 一个消息渲染器（完整的 VN 界面：背景 + 立绘 + 对话框 + 选项按钮）
- `fullScreenComponent: true` 全屏模式已开启

---

::: tip 这是实战配方 #10
视觉小说模式展示了 Yumina 最强大的一面——AI 不只是聊天对象，它是一个叙事引擎。通过指令驱动画面、格式约定区分文本类型、全屏渲染器重塑界面，你可以把普通的聊天框变成任何你想要的交互体验。同样的思路可以用来做冒险游戏、互动漫画、甚至模拟经营。
:::

</div>
