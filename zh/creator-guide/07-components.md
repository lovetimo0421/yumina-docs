# 自定义 UI 指南

> 你的世界不需要长得像一个聊天窗口。这篇教你怎么把它变成任何你想要的样子——而且你不用自己写代码。

---

## 什么是自定义 UI？

Yumina 上每个世界默认都有一个聊天界面。消息显示成文字气泡，底下有输入框，自动滚动——大多数世界用这个就够了，不用写一行代码。

但如果你想让世界**看起来不一样**——自定义字体、主题化背景、血条、角色立绘，甚至做一个完整的视觉小说引擎——你就可以加自定义 UI。

自定义 UI 是 React 代码（TSX），改变你世界的外观和体验。你可以自己写，也可以让 Studio AI 帮你生成。

---

## 根组件（Root Component）

每个新世界都自带一个**根组件**——一棵 TSX 文件树，默认入口是 `index.tsx`。这个文件 export 的 React 组件就是玩家打开世界后看到的全部 UI。

### 默认长这样

新世界的 `index.tsx` 默认就一行：

```tsx
export default function MyWorld() {
  return <Chat />;
}
```

`<Chat />` 是平台维护的"完整聊天体验"积木——消息列表、输入框、流式光标、滑动切换、存档点、模型选择、只读模式、开场白展示，全部内置。**不改代码，玩家看到的就是默认聊天。**

### 三种自定义路径

把 Yumina 想象成一个舞台。`<Chat />` 就是默认舞台——可以原样用，也可以装修，也可以拆了自己盖。

| 你想要 | 怎么改 | 难度 |
|--------|--------|------|
| **只换消息气泡的样子** | `<Chat renderBubble={(msg) => <MyBubble {...msg} />} />` | 简单 |
| **聊天 + 旁边浮一块面板** | 根组件里 `<Chat />` 和你的面板放进同一个 flex 布局 | 中等 |
| **完全自定义全屏 UI** | 不要 `<Chat />`，自己用 `<MessageList />` 和 `<MessageInput />` 拼，或干脆从 `useYumina().messages` 自己读 | 较难 |

#### 路径一：自定义气泡

最常见的需求。`<Chat />` 接管所有聊天功能，你只负责画每条消息的样子：

```tsx
export default function MyWorld() {
  return (
    <Chat renderBubble={function(msg) {
      return (
        <div className={msg.role === "user"
          ? "rounded-xl bg-primary/20 px-4 py-3 ml-auto max-w-[80%]"
          : "rounded-xl bg-card px-4 py-3 mr-auto max-w-[80%]"
        }>
          <div dangerouslySetInnerHTML={{ __html: msg.contentHtml }} />
        </div>
      )
    }} />
  )
}
```

`renderBubble` 拿到的 `msg` 对象详见下面的 [`<Chat>` API](#chat-api)。

#### 路径二：聊天 + 浮动面板

`<Chat />` 占主体，旁边塞一个状态条或侧边栏：

```tsx
export default function MyWorld() {
  var api = useYumina()
  return (
    <div className="flex h-full">
      <div className="flex-1 min-w-0">
        <Chat />
      </div>
      <aside className="w-72 shrink-0 border-l border-border p-4">
        <div className="text-sm">HP: {api.variables.health}/100</div>
        <div className="text-sm">金币: {api.variables.gold}</div>
      </aside>
    </div>
  )
}
```

#### 路径三：完全自定义全屏

不要 `<Chat />`，自己用更细粒度的积木拼，或者从 `api.messages` 自己读消息渲染。视觉小说、地图导航、回合制战斗界面都是这种。例子见下面的[完全自定义全屏示例](#路径三-完全自定义全屏-完整示例)。

### 多文件

根组件不止一个文件。你可以在编辑器里点 `+` 加 `stat-bar.tsx`、`dialogue-box.tsx` 等等，然后在 `index.tsx` 里用 ES module 语法 import：

```tsx
// index.tsx
import StatBar from "./stat-bar"
import DialogueBox from "./dialogue-box"

export default function MyWorld() {
  return (
    <div className="flex flex-col h-full">
      <StatBar />
      <Chat renderBubble={function(msg) {
        return <DialogueBox content={msg.contentHtml} />
      }} />
    </div>
  )
}
```

入口文件名是固定的（默认 `index.tsx`），其他文件名随意。

::: tip 旧世界的"消息渲染器 / 应用组件"
v18 之前的世界用的是 `customUI[]` + `surface: "message" / "app"` 这套老模型，编辑器现在会给老世界打上 **旧版（Legacy）** 标签兼容显示。新建世界统一用根组件。导入旧 Bundle 时引擎会自动把 `messageRenderer` 字段迁移到根组件里——不用手动改。

老世界沙箱里 `<ChatCanvas />` 也仍然可用（行为等同于 `<Chat />`），新代码请用 `<Chat />`。
:::

---

## 怎么添加自定义 UI

### 用 Studio AI（推荐）

最省事的方式。不用写代码——跟 AI 聊天就行。

打开编辑器，点顶部的 **进入工作室**。Studio 有几个面板：

| 面板 | 干什么 |
|------|-------|
| **AI Assistant** | 跟 AI 聊天，让它帮你生成/修改代码 |
| **Canvas** | 实时预览你的界面效果 |
| **Code View** | 查看和编辑代码（消息模板 + 自定义组件） |
| **Playtest** | 内嵌聊天，测试游戏 |

直接用中文描述你想要的效果就行。越具体越好：

- "把消息做成恐怖游戏风格，暗色背景加恐怖字体"
- "每条消息下面加一个血条和背包"
- "做一个视觉小说引擎，有角色立绘和场景背景"
- "把开场白做成一个交互式角色创建界面"

Studio AI 会生成代码并弹出审核卡片。看一眼 Canvas 预览效果，满意就点 **Approve**，不满意就继续提修改要求——"血条再大一点"、"加一个地点显示"。

### 用编辑器

打开编辑器，找到 **自定义 UI** 区块（侧边栏"自定义 UI"标签）。新世界一进来就有一个根组件，文件 tab 默认显示 `index.tsx`。

- 在 tab 编辑区直接改 `index.tsx`
- 想拆成多个文件 → 点 tab 旁边的 **+** 加新文件（比如 `stat-bar.tsx`），然后在 `index.tsx` 里用 `import StatBar from "./stat-bar"` 引入
- 底部的编译检查器会告诉你有没有语法错误

### 用外部 AI

如果你更习惯用 Claude、ChatGPT 或其他 AI，也完全没问题。关键是告诉它 Yumina 的环境信息。先用大白话描述你想要的效果，末尾附上技术信息：

```
我在用一个叫 Yumina 的 AI 互动平台做世界，帮我写一个根组件（root component）。

我想要的效果：
[用大白话描述你想要什么——颜色、布局、风格、读哪些变量]

我的变量：
[列出你的变量，写明每个是什么、存什么值]

Yumina 技术信息（写代码时请遵守）：
- 代码是 TSX，根组件入口文件 index.tsx，用 export default function MyWorld() { ... } 导出
- 沙箱里直接可用（不用 import）：React、useYumina、Icons（Lucide）、Tailwind、useAssetFont、Chat、MessageList、MessageInput
- 用 useYumina() 读取游戏状态，比如 useYumina().variables.health
- 想要默认聊天界面：直接 return <Chat />
- 只想换消息气泡样式：<Chat renderBubble={(msg) => <MyBubble {...msg} />} />
  msg 字段：contentHtml（已渲染 HTML）、rawContent、role（"user" | "assistant" | "system"）、
  messageIndex、isStreaming、variables、stateSnapshot、renderMarkdown(text)
- 想要完全自定义 UI：自己用 <MessageList /> 和 <MessageInput />，或从 useYumina().messages 读取
- 内置 Icons：比如 Icons.Heart、Icons.Sword、Icons.Coins（完整列表 https://lucide.dev/icons）
- 用 var 声明变量、function() 不要用箭头函数（更稳）
- 多文件之间可以用 import "./other-file"（同根组件目录内）
- 不要用 TypeScript 语法（泛型、接口、as 断言）
- 支持 Tailwind CSS 和 React hooks（用 React.useState/React.useEffect 调用）
```

拿到代码后粘贴进编辑器 → 自定义 UI → `index.tsx`。底部显示 **编译状态：正常（Compile Status: OK）** 就成功了。报错就把错误信息发回给 AI 让它修。

---

## 写代码：基本规则

1. 入口文件用 `export default function 你的组件名` 开头——这是必须的
2. 沙箱里这些是全局可用的，**不要 import**：`React`、`useYumina`、`Icons`、`Chat`、`MessageList`、`MessageInput`、`useAssetFont`、Tailwind class
3. 但同根组件目录内的其他文件可以 import，例如 `import StatBar from "./stat-bar"`
4. 用 `React.useState()` 而不是 `useState()`——React 在作用域里，但单个 hook 不在
5. 用 `var` 声明变量、`function() { ... }` 而不是箭头函数——避免沙箱里偶发的作用域问题
6. 不要用 TypeScript 语法——不要写泛型、接口、`as` 断言

## `<Chat>` API

`<Chat />` 是平台维护的完整聊天积木。零参数就是默认聊天，加上 `renderBubble` 就接管气泡样式。

### Props

| Prop | 类型 | 说明 |
|------|------|------|
| `renderBubble?` | `(msg: BubbleProps) => ReactNode` | 自定义每条消息气泡的渲染。不传就用默认 Markdown 渲染 |
| `className?` | `string` | 容器的额外 CSS class |
| `children?` | `ReactNode` | 渲染在消息列表上方的内容（比如自定义 header） |

### `renderBubble` 收到的 `msg` 字段

| 字段 | 是什么 | 示例 |
|------|--------|------|
| `contentHtml` | 已经渲染好的安全 HTML（Markdown → HTML），可以直接 `dangerouslySetInnerHTML` 用 | `"<p>你走进了……</p>"` |
| `rawContent` | 未渲染的原始 Markdown 文本 | `"你走进了 **森林**……"` |
| `role` | 谁发的消息 | `"user"` / `"assistant"` / `"system"` |
| `messageIndex` | 在对话中的位置（0 = 第一条 / 开场白） | `0` |
| `isStreaming` | 这条消息是否还在生成中 | `true` / `false` |
| `variables` | 当前游戏变量的最新值 | `{ health: 80, gold: 150 }` |
| `stateSnapshot` | 这条消息生成时的状态快照（可能为 `null`） | `{ ... }` |
| `renderMarkdown(text)` | 把任意 Markdown 文本转成 HTML 的函数 | `renderMarkdown("**加粗**")` → `"<strong>加粗</strong>"` |

### 例子 1：自定义气泡 + HUD

```tsx
export default function MyWorld() {
  var api = useYumina()

  return (
    <Chat renderBubble={function(msg) {
      // 用户消息：右对齐蓝色气泡
      if (msg.role === "user") {
        return (
          <div className="ml-auto max-w-[80%] rounded-xl bg-blue-500/20 px-4 py-3 text-blue-100">
            {msg.rawContent}
          </div>
        )
      }

      // AI 消息：卡片 + 底部 HUD
      return (
        <div className="mr-auto max-w-[85%] rounded-xl border border-zinc-700 bg-zinc-900 p-4">
          <div dangerouslySetInnerHTML={{ __html: msg.contentHtml }} />
          <div className="mt-3 flex gap-4 text-xs text-zinc-400">
            <span>HP {api.variables.health}/100</span>
            <span>Gold {api.variables.gold}</span>
          </div>
        </div>
      )
    }} />
  )
}
```

### 例子 2：开场白做成角色创建

用 `messageIndex === 0` 识别开场白，渲染成按钮选择界面：

```tsx
export default function MyWorld() {
  var api = useYumina()

  return (
    <Chat renderBubble={function(msg) {
      // 开场白：显示角色创建按钮
      if (msg.messageIndex === 0 && msg.role === "assistant") {
        return (
          <div className="space-y-4">
            <div dangerouslySetInnerHTML={{ __html: msg.contentHtml }} />
            <div className="flex gap-3">
              <button
                onClick={function() {
                  api.setVariable("class", "Warrior")
                  api.sendMessage("我选战士")
                }}
                className="px-4 py-3 rounded-lg border border-zinc-600 hover:bg-zinc-800"
              >
                战士
              </button>
              <button
                onClick={function() {
                  api.setVariable("class", "Mage")
                  api.sendMessage("我选法师")
                }}
                className="px-4 py-3 rounded-lg border border-zinc-600 hover:bg-zinc-800"
              >
                法师
              </button>
            </div>
          </div>
        )
      }

      // 其他消息：默认渲染
      return <div dangerouslySetInnerHTML={{ __html: msg.contentHtml }} />
    }} />
  )
}
```

### 路径三：完全自定义全屏（完整示例）

不用 `<Chat />`，自己拼。下面这个用平台提供的 `<MessageList />` 和 `<MessageInput />` 积木，省掉手动管理滚动 / 流式 / 输入框的麻烦：

```tsx
export default function MyGame() {
  var api = useYumina()

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundImage: api.variables.bg ? "url(" + api.variables.bg + ")" : undefined,
        backgroundSize: "cover",
      }}
    >
      {/* 顶部状态条 */}
      <div className="shrink-0 px-4 py-2 bg-black/50 backdrop-blur text-white flex gap-4 text-xs">
        <span>HP {api.variables.health}/100</span>
        <span>Gold {api.variables.gold}</span>
        <span className="ml-auto">{api.variables.location || "未知地点"}</span>
      </div>

      {/* 消息流 */}
      <div className="flex-1 min-h-0">
        <MessageList />
      </div>

      {/* 输入框 */}
      <MessageInput />
    </div>
  )
}
```

如果你需要更彻底的控制（比如视觉小说不要消息流而是只显示当前一条），就直接从 `api.messages` 读：

```tsx
var lastMsg = (api.messages || []).slice(-1)[0]
return <DialogueBox content={lastMsg ? lastMsg.content : ""} />
```

完整的视觉小说外壳示例见 [视觉小说模式](./21-recipe-visual-novel.md) 配方。

---

## useYumina() SDK

SDK 是你跟平台沟通的桥梁。在组件里调用 `useYumina()` 就能访问游戏状态和执行操作。

::: tip 需要每个字段 / 方法的完整清单？
本节是**讲解版**——覆盖 95% 世界会用到的东西，分类讲解。需要完整、精确、按字母排布的参考——包括分支管理、存档点、`ai.complete`、`injectContext` 等进阶接口——请看 **[API 参考](./08-api-reference.md)**。
:::

::: tip 大多数创作者只需要看「基础」部分
基础部分涵盖了读取变量、发送消息、播放音频、显示通知——95% 的世界用这些就够了。进阶部分是给多人游戏、模型切换等高级场景用的。
:::

### 基础

#### 读取状态

| 属性 | 给你什么 |
|------|---------|
| `api.variables` | 所有游戏变量：`{ health: 80, gold: 150, ... }` |
| `api.messages` | 所有聊天消息：`[{ id, role, content, ... }, ...]` |
| `api.isStreaming` | AI 正在生成回复时为 `true` |
| `api.streamingContent` | AI 正在生成的文本（实时更新） |
| `api.currentUser` | 当前登录的玩家：`{ id, name, image }` |
| `api.worldName` | 当前世界的名称 |
| `api.sessionId` | 当前游玩会话 ID |
| `api.worldId` | 当前世界 ID |

#### 发送操作

| 方法 | 干什么 |
|------|-------|
| `api.sendMessage("text")` | 以玩家身份发送消息 |
| `api.setVariable("health", 50)` | 设置一个游戏变量 |
| `api.executeAction("attackBoss")` | 触发一个命名动作 |

#### 聊天控制

| 方法 | 干什么 |
|------|-------|
| `api.editMessage(id, "new text")` | 编辑一条已有消息 |
| `api.deleteMessage(id)` | 删除一条消息 |
| `api.regenerateMessage(id)` | 让 AI 重新生成一条回复 |
| `api.continueLastMessage()` | 从最后一条消息继续生成 |
| `api.stopGeneration()` | 中途停止 AI 生成 |
| `api.restartChat()` | 清空所有消息，重新开始 |

#### 音频

| 方法 | 干什么 |
|------|-------|
| `api.playAudio("bgm-battle", { volume, fadeDuration, chainTo, maxDuration, duckBgm })` | 播放音效/音乐，支持多种选项 |
| `api.stopAudio("bgm-battle", 2.0)` | 停止指定音轨（可选淡出时间，单位秒） |
| `api.stopAudio()` | 停止所有音频 |
| `api.setAudioVolume("bgm", 0.8)` | 设置 BGM 或音效音量 |
| `api.getAudioVolume("bgm")` | 获取当前 BGM 或音效的音量（返回 0–1） |

#### 导航与 UI

| 方法 | 干什么 |
|------|-------|
| `api.toggleImmersive()` | 切换全屏模式 |
| `api.copyToClipboard("text")` | 复制文本到剪贴板 |
| `api.navigate("/app/hub")` | 导航到其他页面 |
| `api.showToast("已保存！", "success")` | 显示通知弹窗 |
| `api.switchGreeting(2)` | 切换到另一个开场白变体 |

#### 持久化存储（跨会话保留）

| 方法 | 干什么 |
|------|-------|
| `api.storage.get("highScore")` | 读取保存的值（异步） |
| `api.storage.set("highScore", "9999")` | 保存一个值（异步） |
| `api.storage.remove("highScore")` | 删除一个保存的值（异步） |

### 进阶

#### 扩展状态

| 属性 | 给你什么 |
|------|---------|
| `api.globalVariables` | 全局作用域变量（所有会话共享） |
| `api.personalVariables` | 每用户个人变量 |
| `api.roomPersonalVariables` | 当前房间内的每用户变量 |
| `api.room` | 当前房间数据（多人世界用）：`{ id, name, ... }` 或 `null` |
| `api.permissions` | 当前用户在该世界的权限：`{ canEdit, ... }` 或 `null` |
| `api.pendingChoices` | 等待玩家输入的选项按钮：`["选项1", "选项2"]` |
| `api.error` | 当前错误消息（API 失败、生成错误）或 `null` |
| `api.streamingReasoning` | AI 正在流式输出的推理/思考内容 |
| `api.readOnly` | 查看别人的会话时为 `true`（不允许输入） |
| `api.greetingContent` | 从世界条目提取的开场白文本，或 `null` |
| `api.canvasMode` | 当前显示模式：`"chat"`、`"custom"` 或 `"fullscreen"` |

#### 扩展操作

| 方法 | 干什么 |
|------|-------|
| `api.setVariable("health", 50, { scope, targetUserId })` | 带选项设置变量。`scope` 指定变量作用域，`targetUserId` 指定目标玩家（多人游戏用） |
| `api.clearPendingChoices()` | 清除待选择的选项按钮 |
| `api.swipeMessage(id, "left"/"right")` | 在消息的不同版本之间切换（AI 的备选回复） |

#### 资源

| 方法 | 干什么 |
|------|-------|
| `api.resolveAssetUrl("@asset:abc123")` | 将资源引用解析为 CDN URL |

#### 会话管理

| 方法 | 干什么 |
|------|-------|
| `api.revertToMessage(messageId)` | 把对话倒回到指定位置 |
| `api.createSession(worldId)` | 开始一个新的游玩会话 |
| `api.deleteSession(sessionId)` | 删除一个游玩会话 |
| `api.listSessions(worldId)` | 列出所有保存的会话 |

#### 模型管理

| 方法 | 干什么 |
|------|-------|
| `api.selectedModel` | 当前选择的 AI 模型 ID |
| `api.userPlan` | 用户的订阅计划（`"free"`、`"go"`、`"plus"`、`"pro"`、`"ultra"`） |
| `api.preferredProvider` | `"official"`（平台 API）或 `"private"`（用户自有密钥） |
| `api.setModel("claude-sonnet-4-6")` | 切换到其他 AI 模型 |
| `api.getModels()` | 获取可用模型、收藏模型和最近使用的模型（异步） |
| `api.pinModel("model-id")` | 收藏一个模型 |
| `api.unpinModel("model-id")` | 取消收藏一个模型 |

---

## 代码里可用的工具

这些都是自动可用的——不需要 import：

- **React** — `React.useState()`、`React.useEffect()`、`React.useMemo()`、`React.useRef()`
- **useYumina()** — SDK（见上面的说明）
- **`<Chat />`** — 完整聊天积木。零参数即默认聊天；可选 `renderBubble`、`className`、`children`。详见上面 [`<Chat>` API](#chat-api)
- **`<MessageList />`** — 只渲染消息流（带滚动 / 流式 / 滑动），不带输入框。可选 `rendererComponent` 接管气泡
- **`<MessageInput />`** — 只渲染输入框（带禁用状态 / 选项按钮 / 模型选择）
- **Icons** — 1400+ 个 Lucide 图标：`Icons.Heart`、`Icons.Sword`、`Icons.Shield` 等等。完整列表看 https://lucide.dev/icons
- **Tailwind CSS** — 全套工具类，用来写样式
- **useAssetFont()** — 从上传的素材加载自定义字体
- **`<ChatCanvas />`** _(legacy)_ — 老世界沙箱里仍可用，行为等同于 `<Chat />`，新代码请用 `<Chat />`

---

## 用 Tailwind + `<style>` 写游戏 UI 组件

Yumina 不再提供预制的 YUI 组件库——因为 Tailwind 已经足够表达几乎所有你想要的视觉效果，再加一点点 `<style>` 标签就能处理 inline style 做不到的部分（伪元素、hover、keyframe 动画、clip-path）。下面是几个常见场景的直接写法，**照着改就能用**。

### 状态条（血条、体力、好感度）

```tsx
function StatBar({ value, max, label, color = "#ef4444" }) {
  var pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-200">
      <span className="w-10 font-medium">{label}</span>
      <div className="relative flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-300"
          style={{ width: pct + "%", background: color }}
        />
      </div>
      <span className="w-14 text-right tabular-nums">{value}/{max}</span>
    </div>
  )
}
```

### 对话框（VN 风格）

```tsx
function DialogueBox({ speaker, speakerColor = "#f472b6", children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/70 p-4 backdrop-blur-sm shadow-lg">
      {speaker && (
        <div className="mb-1 text-sm font-bold" style={{ color: speakerColor }}>
          {speaker}
        </div>
      )}
      <div className="leading-relaxed text-zinc-100">{children}</div>
    </div>
  )
}
```

### 选项按钮

```tsx
function ChoiceButtons({ choices, onSelect }) {
  return (
    <div className="flex flex-col gap-2">
      {choices.map(function(c, i) {
        return (
          <button
            key={i}
            onClick={function() { onSelect(c) }}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-left text-sm hover:bg-white/10 hover:border-white/20 transition"
          >
            {c.label}
          </button>
        )
      })}
    </div>
  )
}
```

### 背景场景 + 立绘

```tsx
function VNScene({ bg, sprite, children }) {
  return (
    <div
      className="relative w-full h-full bg-cover bg-center"
      style={{ backgroundImage: bg ? "url(" + bg + ")" : "linear-gradient(135deg,#1e293b,#0f172a)" }}
    >
      {sprite && (
        <img
          src={sprite}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 max-h-[80%]"
        />
      )}
      <div className="absolute inset-x-4 bottom-4">{children}</div>
    </div>
  )
}
```

### 让 Studio AI 帮你写

这些骨架都很短，你完全可以直接让 Studio AI 帮你加血条、对话框、属性卡——它知道 Tailwind，知道暗色主题。描述效果就行：

> "每条消息上面加一个血条，读 `health` 变量（0-100），红色，带动画，右边显示数字"

如果你在应用模板里做，还可以直接点 TSX 编辑框右上角的"插入片段"，里面有现成的基础聊天、侧边栏、VN 外壳骨架。

---

## 禁用的 API

你的代码在安全沙箱里运行。以下浏览器 API 是**被屏蔽的**——请用 SDK 的替代方案：

| 不要用这个 | 用这个替代 |
|-----------|-----------|
| `fetch('/api/...')` | `api.listSessions()`、`api.createSession()` 等 |
| `localStorage.getItem()` | `api.storage.get()` |
| `localStorage.setItem()` | `api.storage.set()` |
| `window.location` | `api.sessionId`、`api.worldId`、`api.navigate()` |
| `navigator.clipboard` | `api.copyToClipboard()` |

---

## 主题安全的颜色

用这些 Tailwind class 可以自动适配 Yumina 的暗色主题：

| 你想要什么 | 用这个 class |
|-----------|-------------|
| 卡片背景 | `bg-card` |
| 页面背景 | `bg-background` |
| 柔和/低调背景 | `bg-muted` |
| 主要文字 | `text-foreground` |
| 次要/暗淡文字 | `text-muted-foreground` |
| 边框 | `border-border` |
| 强调/品牌色 | `text-primary`、`bg-primary` |

---

## 常见错误

| 问题 | 怎么修 |
|------|-------|
| `useState is not defined` | 用 `React.useState()` |
| `import ... from` | 删掉所有 import——一切都已经在作用域里了 |
| 组件不显示 | 确认你写了 `export default function` |
| TypeScript 错误 | 删掉泛型 `<T>`、接口、`as` 类型转换 |
| 全屏白屏 | 没渲染任何聊天积木——加一个 `<Chat />`、或自己用 `<MessageList />` + `<MessageInput />` 拼 |
| 没有输入框 | 自己布局时漏了 `<MessageInput />`，或者要自己写 input 调用 `api.sendMessage()` |
| `renderMarkdown` 未定义 | 在 `renderBubble` 里从 `msg.renderMarkdown` 取，不要从外层作用域取 |
| 变量不更新 | 确认 AI 的 prompt 里告诉它要输出 `[variableName: set value]` 指令 |

---

## 小贴士

1. **从 Studio AI 开始。** 描述你想要什么，让它生成代码。之后随时可以手动改。

2. **从简单开始。** 先写一个只改颜色和字体的消息模板。再慢慢加功能。

3. **复用本文档的骨架。** 上面的 StatBar / DialogueBox / ChoiceButtons 都是可以直接拷的。写一次就能在整个世界里重复用，不用每次都让 AI 重新造轮子。

4. **用预览面板测试。** 编辑器的预览面板会用示例数据实时展示你的组件效果。

5. **用 `msg.messageIndex === 0` 处理开场白。** 在 `renderBubble` 里检查这个就能识别第一条 assistant 消息——很适合做角色创建界面、开场动画、教程显示。

6. **别忘了流式输出。** 当 `msg.isStreaming` 为 true 时，消息内容还在生成中。你的气泡要能优雅地处理不完整的文本（比如标签可能没闭合）。

7. **能用 `<Chat />` 就用 `<Chat />`。** 平台一直在改进它（滑动、存档点、模型选择都是后加的）。从头自己拼意味着以后这些新功能你享受不到。

---

## 实用 AI Prompt

每个例子都给出完整的 prompt，你可以直接复制发给 Studio AI 或外部 AI 使用。

### 例子 1：恐怖游戏状态栏（消息模板）

**效果**：每条消息上方显示暗色恐怖风格的 HP/体力/天数面板。

**复制这段发给 Studio AI 或外部 AI：**

```
帮我改消息显示方式，做一个恐怖生存游戏的状态面板。

效果：
1. 每条消息上面有一个暗色状态栏——深灰偏黑背景，暗红色细边框，圆角
2. 状态栏里从左到右显示：
   - 红色的 HP 血条（读 health 变量，满血 100）
   - 绿色的体力条（读 energy 变量，满体力 100）
   - 右边用琥珀色文字显示"第X天 · 夜晚"（读 day 和 phase 变量）
   - 如果 is_armed 是 true，最右边加一个白色小剑图标
3. 状态栏下面正常显示消息文字
4. 风格要压抑、低饱和度，末日恐怖的感觉

变量：health（生命值，0-100），energy（体力，0-100），day（天数），phase（"night"或"day"），is_armed（是否武装，true/false）
```

如果用外部 AI，在末尾加上[技术信息块](#用外部-ai)。

### 例子 2：视觉小说风格（消息模板）

**效果**：全屏场景背景 + 角色立绘 + 底部半透明对话框。

**复制这段发给 Studio AI 或外部 AI：**

```
帮我做一个视觉小说/galgame 风格的消息显示。

效果：
1. 整个区域像一个游戏场景画面，16:9 比例
   - 背景图从 currentScene 变量读（图片链接），没图的时候深蓝色渐变
2. 画面中间显示角色立绘，从 characterPortrait 变量读，大图居中
3. 底部半透明黑色对话框：
   - 说话人名字从 characterName 变量读，名字用樱花粉色
   - 对话内容就是 AI 的回复文字
4. *星号包裹的文字* 是动作描述，灰色斜体显示在对话框上面
5. 右上角小字显示好感度（读 affection 变量），低好感红色、中间白色、高好感粉色

变量：currentScene（背景图链接），characterPortrait（角色立绘链接），characterName（角色名），affection（好感度，0-100）
```

### 例子 3：游戏侧边栏（根组件 + 浮动面板）

**效果**：`<Chat />` 占主体，右边固定 320px 侧边栏显示角色信息 + 属性 + 背包。

**复制这段发给 Studio AI 或外部 AI：**

```
帮我做一个带侧边栏的根组件：根 div 是 flex 横向布局，左边 <Chat /> 占满剩余宽度，右边 320px 固定宽度侧边栏。

侧边栏效果：
1. 深灰色背景面板，圆角
2. 顶部是角色信息：
   - 左边圆形头像（从 playerAvatar 变量读图片链接），紫色边框
   - 右边是角色名（playerName 变量）和等级 "Lv.X"（level 变量），等级用紫色
3. 中间是属性区域，标题 "属性"：
   - 红色 HP 血条，读 hp 和 max_hp 变量
   - 蓝色 MP 条，读 mp 和 max_mp 变量
   - 三个属性卡片横排：力量（strength，剑图标）、防御（defense，盾图标）、速度（speed，闪电图标）
4. 底部是背包区域，标题 "背包"：
   - 3 列的物品格子，从 inventory 变量读（数组，每个物品有 name、icon、count）
   - 空格子显示灰色虚线框，总共 9 个格位

变量：playerAvatar（头像链接），playerName（角色名），level（等级），hp/max_hp（当前/最大生命），mp/max_mp（当前/最大魔力），strength/defense/speed（属性数字），inventory（背包数组）
```

::: tip 这些 prompt 可以直接用
上面三个 prompt 可以直接复制发给 Studio AI 或外部 AI。拿到代码后粘贴进 `index.tsx` 就行。觉得效果不对就继续跟 AI 聊——调颜色、大小、布局，来回几轮就能搞定 (๑•̀ㅂ•́)و✧
:::
