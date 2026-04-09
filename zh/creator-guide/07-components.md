# 自定义 UI 指南

> 你的世界不需要长得像一个聊天窗口。这篇教你怎么把它变成任何你想要的样子——而且你不用自己写代码。

---

## 什么是自定义 UI？

Yumina 上每个世界默认都有一个聊天界面。消息显示成文字气泡，底下有输入框，自动滚动——大多数世界用这个就够了，不用写一行代码。

但如果你想让世界**看起来不一样**——自定义字体、主题化背景、血条、角色立绘，甚至做一个完整的视觉小说引擎——你就可以加自定义 UI。

自定义 UI 是 React 代码（TSX），改变你世界的外观和体验。你可以自己写，也可以让 Studio AI 帮你生成。

---

## 三个自定义层级

把 Yumina 想象成一个剧场。舞台自带一切：墙壁、灯光、座椅、幕布。每场演出默认都用这个舞台。

### 第一层：不写代码（默认聊天）

你什么都不用做。Yumina 直接把消息显示成带 Markdown 支持的格式化文字（加粗、斜体、代码块、图片）。滚动、流式输出、编辑……所有聊天功能自动搞定。

**适合：** 角色卡、简单角色扮演、以对话为主的世界。

### 第二层：消息模板（Message Template）——自定义消息样式

你写一个小组件来控制每条消息长什么样。Yumina 照常处理消息列表、滚动、输入框、流式输出、编辑等所有聊天功能。你的组件只负责改变每条消息气泡的视觉表现。

这就像给剧场重新画背景布。舞台还在，座位还在，灯光照常亮。你只是换了观众在每个场景看到的画面。

用消息模板（Message Template）你可以：
- 改变字体、颜色、背景
- 把对话和旁白解析成不同风格的区块
- 在每条消息下面加血条、能量计、资源计数器
- 做交互式开场白（角色创建、阵营选择）
- 在文字旁边显示角色头像
- 给整个聊天体验换个主题

**适合：** 主题化角色扮演、带数值的游戏、有 HUD 元素的互动小说、聊天体验的视觉升级。

**在哪设置：** 编辑器 → **消息渲染器（Message Renderer）** 区域 → 选 **自定义 TSX（Custom TSX）** → 粘贴代码

### 第三层：应用模板（App Template）——完全自定义 UI

你写一个组件替换**整个屏幕**。Yumina 的默认聊天彻底消失——没有消息列表、没有输入框、没有滚动。你的组件就是全部体验，一切从头来。

这就像把剧场拆掉自己盖一个新场馆。每一个像素都由你控制。

用应用模板（App Template），你需要自己处理：
- 显示消息（从 `api.messages` 读取）
- 提供输入方式（调用 `api.sendMessage()`）
- 流式显示（检查 `api.isStreaming` 和 `api.streamingContent`）
- 滚动行为
- 你想要的任何交互

**适合：** 视觉小说引擎、复杂游戏 UI、完全不像聊天的自定义体验。

**在哪设置：** 编辑器 → **组件** 区块 → 点击"添加组件" → 选择 **App** 表面

#### ChatCanvas 快捷方式

如果你既需要自定义消息样式**又**需要浮动组件，不必从零重建整个聊天界面。在应用组件中使用 `<ChatCanvas />` 即可嵌入内置聊天 UI：

```tsx
export default function MyWorld() {
  var api = useYumina();
  var [showPanel, setShowPanel] = React.useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      <ChatCanvas />
      {/* 你的浮动组件放在这里 */}
    </div>
  );
}
```

ChatCanvas 会处理一切：消息、输入框、流式输出、编辑、滑动、存档点。你只需在它周围添加自己的组件。

**自定义消息样式：** 给 ChatCanvas 传入 `messageRenderer` 属性：

```tsx
<ChatCanvas messageRenderer={({ content, role, renderMarkdown }) => (
  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
)} />
```

### 怎么选

| | 消息模板（Message Template） | 应用模板（App Template） |
|--|-----------------|-------------|
| 数量 | 只能有一个 | 只能有一个 |
| 替换什么 | 只替换消息渲染 | 替换整个屏幕 |
| 聊天功能 | Yumina 自动处理 | 你自己来 |
| 适合 | 重新设计消息样式、加 HUD | 全屏游戏、视觉小说 |
| 难度 | 简单 | 较难 |

大多数世界只需要消息模板就够了。需要全屏体验的时候才用应用模板。

::: info 显示模式说明
内置组件（stat-bar、text-display 等）在普通聊天模式下显示在 header 横栏中。自定义 TSX 组件根据其表面类型（`surface: "app"`）决定显示方式——App 表面替换整个屏幕，Overlay 表面显示在聊天旁边。如果你想在普通聊天模式下添加交互元素（按钮、输入框等），请使用 messageRenderer。
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

打开编辑器，找到 **组件（Components）** 区域。点"添加组件（Add Component）"，选模板类型：

- **Message** — 自定义每条聊天消息的样式（第二层）
- **Overlay** — 聊天旁边的小部件
- **App** — 替换整个 UI（第三层）

然后在编辑器里写 TSX 代码。编译检查器会告诉你有没有错误。

### 用外部 AI

如果你更习惯用 Claude、ChatGPT 或其他 AI，也完全没问题。关键是告诉它 Yumina 的环境信息。先用大白话描述你想要的效果，末尾附上技术信息：

```
我在用一个叫 Yumina 的 AI 互动平台做世界，帮我写一段代码改变消息显示方式。

我想要的效果：
[用大白话描述你想要什么——颜色、布局、风格、读哪些变量]

我的变量：
[列出你的变量，写明每个是什么、存什么值]

Yumina 技术信息（写代码时请遵守）：
- 代码格式 TSX，用 export default function Renderer({ content, renderMarkdown }) { ... } 导出
- useYumina() 可以读变量，比如 useYumina().variables.health
- 内置 YUI 组件库（不用 import 直接用）：
  YUI.Scene（背景）、YUI.Sprite（角色立绘）、YUI.DialogueBox（对话框）、
  YUI.StatBar（血条）、YUI.StatCard（属性卡）、YUI.Panel（面板容器）、
  YUI.Tabs（标签页）、YUI.ItemGrid（物品格子）、YUI.ChoiceButtons（选择按钮）、
  YUI.ActionButton（动作按钮）、YUI.Badge（标签）、YUI.Fullscreen（全屏）
- 内置 Icons 图标库（不用 import），比如 Icons.Heart, Icons.Sword, Icons.Coins
- renderMarkdown(content) 把文字变成 HTML
- 用 var 声明变量，不要用 const/let；用 function() 不要用箭头函数
- 不要写 import 语句，不要用 TypeScript 语法
- 支持 Tailwind CSS 和 React hooks（通过 React.useState, React.useEffect 等调用）
```

拿到代码后：
1. 如果是**消息模板** → 编辑器 → 消息渲染器（Message Renderer） → 自定义 TSX（Custom TSX） → 粘贴
2. 如果是**自定义组件** → Studio → Code View → 点 + → 粘贴

底部显示 **编译状态：正常（Compile Status: OK）** 就成功了。报错就把错误信息发回给 AI 让它修。

---

## 写 TSX 代码

### 规则

1. 用 `export default function 你的组件名` 开头——这是必须的
2. 不要写 `import` 语句——React、useYumina、Icons、Tailwind 都已经在作用域里了
3. 用 `React.useState()` 而不是 `useState()`——React 在作用域里，但单个 hook 不在
4. 用 `var` 声明变量——避免沙箱里的作用域问题
5. 不要用 TypeScript 语法——不要写泛型、接口、类型注解
6. 所有代码放一个文件——辅助函数也定义在同一个文件里

### 消息模板的 Props

写消息模板时，你的组件会收到这些 props（每条消息都会传一次）：

| Prop | 是什么 | 示例 |
|------|--------|------|
| `content` | 消息文本（指令已被移除） | `"你走进了黑暗的森林……"` |
| `role` | 谁发的消息 | `"user"` 或 `"assistant"` |
| `messageIndex` | 在对话中的位置 | `0` 代表第一条消息（开场白） |
| `variables` | 所有游戏变量的当前值 | `{ health: 80, gold: 150 }` |
| `renderMarkdown` | 把 Markdown 转成 HTML 的函数 | `renderMarkdown("**加粗**")` → `"<strong>加粗</strong>"` |
| `isStreaming` | 这条消息是否还在生成中 | `true` 或 `false` |

### 基础消息模板示例

```tsx
export default function MyRenderer({ content, role, messageIndex, variables, renderMarkdown }) {
  // User messages: simple text
  if (role === "user") {
    return <div className="text-blue-300">{content}</div>
  }

  // AI messages: styled with custom background
  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />

      {/* Show health bar below each message */}
      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
        <span>HP {variables.health}/100</span>
        <span>Gold {variables.gold}</span>
      </div>
    </div>
  )
}
```

### 交互式开场白示例

用 `messageIndex === 0` 检测第一条消息，显示角色创建界面：

```tsx
export default function MyRenderer({ content, role, messageIndex, variables, renderMarkdown }) {
  var api = useYumina()

  // First message: show character creation
  if (messageIndex === 0 && role === "assistant") {
    return (
      <div className="space-y-4">
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />

        <div className="flex gap-3 mt-4">
          <button
            onClick={function() {
              api.setVariable("class", "Warrior")
              api.sendMessage("I choose Warrior")
            }}
            className="px-4 py-3 rounded-lg border border-zinc-600 hover:bg-zinc-800"
          >
            Warrior
          </button>
          <button
            onClick={function() {
              api.setVariable("class", "Mage")
              api.sendMessage("I choose Mage")
            }}
            className="px-4 py-3 rounded-lg border border-zinc-600 hover:bg-zinc-800"
          >
            Mage
          </button>
        </div>
      </div>
    )
  }

  // Regular messages: styled text
  return <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
}
```

### 应用模板示例

一个基础的全屏聊天外壳。消息、输入、流式输出都得你自己处理：

```tsx
export default function MyGame() {
  var api = useYumina()
  var scrollRef = React.useRef(null)
  var inputState = React.useState("")
  var input = inputState[0]
  var setInput = inputState[1]

  var msgs = api.messages || []

  // Auto-scroll when new messages arrive
  React.useEffect(function() {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [msgs.length, api.streamingContent])

  function handleSend() {
    var text = input.trim()
    if (!text || api.isStreaming) return
    api.sendMessage(text)
    setInput("")
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map(function(m, i) {
          return (
            <div key={m.id || i} className={m.role === "user" ? "text-right" : ""}>
              <div className={"inline-block max-w-[80%] px-3 py-2 rounded-lg " +
                (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {m.content}
              </div>
            </div>
          )
        })}

        {/* Show streaming text while AI is generating */}
        {api.isStreaming && api.streamingContent && (
          <div className="inline-block max-w-[80%] px-3 py-2 rounded-lg bg-muted animate-pulse">
            {api.streamingContent}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={function(e) { setInput(e.target.value) }}
          onKeyDown={function(e) { if (e.key === "Enter") handleSend() }}
          placeholder="Type a message..."
          disabled={api.isStreaming}
          className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={handleSend}
          disabled={api.isStreaming}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

---

## useYumina() SDK

SDK 是你跟平台沟通的桥梁。在组件里调用 `useYumina()` 就能访问游戏状态和执行操作。

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
- **Icons** — 1400+ 个 Lucide 图标：`Icons.Heart`、`Icons.Sword`、`Icons.Shield` 等等。完整列表看 https://lucide.dev/icons
- **YUI** — 预制游戏 UI 组件（见下面）
- **Tailwind CSS** — 全套工具类，用来写样式
- **useAssetFont()** — 从上传的素材加载自定义字体

---

## YUI：预制游戏组件库

不用什么都从头造，直接用 YUI 组件库。所有组件默认暗色主题，有平滑动画，开箱即用。

### 速查表

| 组件 | 用途 | 常用 props |
|------|------|-----------|
| `YUI.Scene` | 背景场景 | `bg`（背景图 URL）、`transition` |
| `YUI.Sprite` | 角色立绘 | `src`（图片 URL）、`position`（left/center/right）、`size` |
| `YUI.DialogueBox` | 对话框 | `speaker`、`speakerColor`、`variant`（default/thought/narration） |
| `YUI.ChoiceButtons` | 选择按钮 | `choices`（选项数组）、`onSelect`、`layout`（vertical/horizontal/grid） |
| `YUI.StatBar` | 状态条 | `label`、`value`、`max`、`color`、`animated` |
| `YUI.StatCard` | 属性卡片 | `label`、`value`、`icon`、`color` |
| `YUI.Panel` | 容器面板 | `title`、`icon`、`children` |
| `YUI.Tabs` | 标签页切换 | `tabs`（标签数组）、`activeTab`、`onTabChange` |
| `YUI.ItemGrid` | 物品格子 | `items`（物品数组）、`columns`、`emptySlots` |
| `YUI.ActionButton` | 动作按钮 | `label`、`icon`、`onClick` |
| `YUI.Badge` | 小标签 | `children`、`variant` |
| `YUI.Fullscreen` | 全屏切换 | `children` |

### 用法示例

**场景与角色：**

```tsx
// Background scene with character sprite
<YUI.Scene bg={variables.sceneBg}>
  <YUI.Sprite src={variables.charSprite} position="center" size="lg" />
  <YUI.DialogueBox speaker="Sakura" speakerColor="#ff69b4">
    {content}
  </YUI.DialogueBox>
</YUI.Scene>
```

**状态条与属性卡：**

```tsx
// Animated health bar
<YUI.StatBar value={variables.health} max={100} label="HP" color="red" animated />

// Stat display card
<YUI.StatCard label="Gold" value={variables.gold} icon={Icons.Coins} color="yellow" />
```

**选择按钮：**

```tsx
// Action choices
<YUI.ChoiceButtons
  choices={[
    { label: "Attack", value: "attack", icon: Icons.Sword },
    { label: "Defend", value: "defend", icon: Icons.Shield },
    { label: "Flee", value: "flee", icon: Icons.Wind },
  ]}
  onSelect={function(choice) { api.sendMessage("I choose to " + choice.value) }}
/>
```

**面板与标签页：**

```tsx
// Content panel with title
<YUI.Panel title="Inventory" icon={Icons.Backpack}>
  <YUI.ItemGrid items={inventoryItems} columns={4} />
</YUI.Panel>

// Tab container
<YUI.Tabs
  tabs={["Stats", "Inventory", "Map"]}
  activeTab={currentTab}
  onTabChange={setCurrentTab}
>
  {/* Tab content here */}
</YUI.Tabs>
```

你（或者帮你写代码的 AI）可以通过 `className` prop 用 Tailwind CSS 进一步自定义任何组件的样式。

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
| 全屏应用白屏 | 你需要自己读 `api.messages` 并渲染出来 |
| 全屏应用没有输入框 | 加一个输入框并调用 `api.sendMessage()` |
| `renderMarkdown` 未定义 | 只有消息模板才有这个 prop。应用模板需要自己处理文本。 |
| 变量不更新 | 确认 AI 的 prompt 里告诉它要输出 `[variableName: set value]` 指令 |

---

## 小贴士

1. **从 Studio AI 开始。** 描述你想要什么，让它生成代码。之后随时可以手动改。

2. **从简单开始。** 先写一个只改颜色和字体的消息模板。再慢慢加功能。

3. **用 YUI 组件。** 别从头造血条和对话框。YUI 有预制版本，好看又好用，开箱即用。

4. **用预览面板测试。** 编辑器的预览面板会用示例数据实时展示你的组件效果。

5. **用 `messageIndex === 0` 处理开场白。** 第一条 assistant 消息就是开场白。用这个来做角色创建界面、开场动画、教程显示。

6. **别忘了流式输出。** 当 `isStreaming` 为 true 时，消息内容还在生成中。你的组件要能优雅地处理不完整的文本。

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

### 例子 3：游戏侧边栏（应用模板）

**效果**：聊天旁边的侧边栏，显示角色信息 + 属性 + 背包。

**复制这段发给 Studio AI 或外部 AI：**

```
帮我做一个游戏侧边栏（作为自定义组件，不是消息模板）。

效果：
1. 深灰色背景面板，圆角
2. 顶部是角色信息：
   - 左边圆形头像（从 playerAvatar 变量读图片链接），紫色边框
   - 右边是角色名（playerName 变量）和等级"Lv.X"（level 变量），等级用紫色
3. 中间是属性区域，标题"属性"：
   - 红色 HP 血条，读 hp 和 max_hp 变量
   - 蓝色 MP 条，读 mp 和 max_mp 变量
   - 三个属性卡片横排：力量（strength，剑图标）、防御（defense，盾图标）、速度（speed，闪电图标）
4. 底部是背包区域，标题"背包"：
   - 3 列的物品格子，从 inventory 变量读（数组，每个物品有 name、icon、count）
   - 空格子显示灰色虚线框，总共 9 个格位

变量：playerAvatar（头像链接），playerName（角色名），level（等级），hp/max_hp（当前/最大生命），mp/max_mp（当前/最大魔力），strength/defense/speed（属性数字），inventory（背包数组）
```

::: tip 这些 prompt 可以直接用
上面三个 prompt 可以直接复制发给 Studio AI 或外部 AI。拿到代码后粘贴进去就行。觉得效果不对就继续跟 AI 聊——调颜色、大小、布局，来回几轮就能搞定 (๑•̀ㅂ•́)و✧
:::

::: info 消息模板 vs 应用模板：详细对比
想深入了解 message-surface 和 app-surface 组件的技术区别？查看 [消息渲染器 vs 自定义组件](./07b-renderer-vs-components.md)。
:::

::: info 想深入了解？
想搞懂渲染器底层怎么工作的？TSX 速成、样式技巧、动画、调试 → [消息渲染器深入指南](./08-message-renderer.md)
:::
