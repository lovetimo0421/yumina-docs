# API 参考

> 这是沙箱里**所有**你能用的东西的完整清单——全局变量、组件、`useYumina()` SDK 的每一个字段和方法、类型定义、以及被禁用的浏览器 API 的替代方案。

这是**参考文档**，不是教程。先读[自定义 UI 指南](./07-components.md)理解整体思路，这里用来查具体接口。

所有数据都来自 `packages/app/sandbox/` 的真实实现，与编辑器中运行的沙箱版本保持一致。

---

## 沙箱全局

这些名字在你的根组件和任何 `.tsx` 文件里**直接可用，不用 import**：

| 名字 | 类型 | 说明 |
|------|------|------|
| `React` | module | 完整的 React（`useState`、`useEffect`、`useRef`、`useMemo`、`useCallback`、`useLayoutEffect`、`Fragment` 等） |
| `useYumina` | hook | 平台 SDK，见下方[`useYumina()` SDK](#useyumina-sdk) |
| `useAssetFont` | hook | 从素材库加载字体，见[`useAssetFont()`](#useassetfont) |
| `Icons` | object | 1400+ Lucide 图标组件：`<Icons.Heart />`、`<Icons.Sword />`。完整列表：<https://lucide.dev/icons> |
| `Chat` | component | 完整聊天积木，见[`<Chat>`](#chat) |
| `MessageList` | component | 只有消息流，见[`<MessageList>`](#messagelist) |
| `MessageInput` | component | 只有输入框，见[`<MessageInput>`](#messageinput) |
| `ChatCanvas` | component | `<Chat />` 的旧别名，见[`<ChatCanvas>`](#chatcanvas) |
| `exports`、`module` | object | CJS 风格的 export 兜底，一般你不用管 |

**不要 import React 或任何上面的名字**——它们由沙箱注入。写 `import React from "react"` 在编译期会被静默剥掉，但多余。

**可以 import 自己的文件**——多文件根组件用 ES module 语法：`import StatBar from "./stat-bar"`。扩展名 `.tsx`、`.ts`、`.jsx`、`.js` 可省略。

---

## `useYumina()` SDK

在组件函数内部调用：

```tsx
function MyWorld() {
  const api = useYumina()
  // api.variables, api.sendMessage(...), ...
}
```

SDK 完整接口（按功能分类）：

### 状态读取（同步）

读取最新的游戏状态。这些值每次发生变化都会触发组件重渲染。

| 字段 | 类型 | 含义 |
|------|------|------|
| `variables` | `Record<string, unknown>` | 所有游戏变量（会话作用域）。示例：`{ health: 80, gold: 150 }` |
| `globalVariables` | `Record<string, unknown>` | 全局变量，所有会话共享 |
| `personalVariables` | `Record<string, unknown>` | 当前玩家的个人变量，跨会话 |
| `roomPersonalVariables` | `Record<string, unknown>` | 当前房间内当前玩家的个人变量（多人游戏） |
| `worldName` | `string` | 当前世界的名字 |
| `worldId` | `string` | 当前世界的 UUID |
| `sessionId` | `string` | 当前游玩会话的 UUID |
| `currentUser` | `{ id, name?, image? } \| null` | 当前登录玩家，未登录时为 `null` |
| `room` | `Record<string, unknown> \| null` | 当前多人房间数据，单人游戏为 `null` |
| `messages` | `Array<Record<string, unknown>>` | 完整消息历史，类型见[`SandboxMessage`](#sandboxmessage) |
| `permissions` | `Record<string, unknown> \| null` | 当前玩家对当前世界的权限（编辑、分享等） |
| `isStreaming` | `boolean` | AI 正在生成回复时为 `true` |
| `streamingContent` | `string` | AI 当前流式输出的文本（实时更新，会频繁变化） |
| `streamingReasoning` | `string` | AI 当前流式输出的"思考"内容（支持思考的模型才有） |
| `pendingChoices` | `string[]` | 规则引擎产生的待选按钮文本 |
| `error` | `string \| null` | 当前错误消息（API 失败、生成错误），没有则 `null` |
| `readOnly` | `boolean` | 观看别人的会话时为 `true`，`<Chat />` 会自动隐藏输入框 |
| `checkpoints` | `Array<Checkpoint>` | 已保存的存档点，见[`Checkpoint`](#checkpoint) |
| `greetingContent` | `string \| null` | 从世界条目计算出的开场白文本（空状态时 `<Chat />` 自动用它） |
| `canvasMode` | `"chat" \| "custom" \| "fullscreen"` | 当前画布模式 |
| `selectedModel` | `string` | 当前选中的 AI 模型 ID |
| `userPlan` | `string` | 用户订阅计划（`"free"`、`"go"`、`"plus"`、`"pro"`、`"ultra"`、`"internal"`） |
| `preferredProvider` | `"official" \| "private"` | 官方 API 或用户自有密钥 |

### 游戏动作（即发即忘）

这些方法不返回值，只是把意图发给主应用。

| 方法 | 作用 |
|------|------|
| `sendMessage(text)` | 以玩家身份发送一条消息，触发 AI 回复 |
| `setVariable(id, value, options?)` | 设置变量。`options`: `{ scope?: string; targetUserId?: string }`。`scope` 指定作用域（用于全局/个人变量），`targetUserId` 用于多人游戏中给别人设置变量 |
| `executeAction(actionId)` | 触发一条规则引擎定义的命名动作（例如 `"attackBoss"`） |
| `switchGreeting(index)` | 切换到指定索引的开场白变体 |
| `clearPendingChoices()` | 清空待选按钮（不选任何一个直接关掉） |

### 聊天控制

让自定义 UI 能做默认聊天栏里的所有事。

| 方法 | 作用 |
|------|------|
| `editMessage(messageId, content)` | 编辑已有消息。返回 `Promise<boolean>`，`true` 表示成功 |
| `deleteMessage(messageId)` | 删除一条消息。返回 `Promise<boolean>` |
| `regenerateMessage(messageId)` | 让 AI 重写指定的回复（即发即忘） |
| `continueLastMessage()` | 从上一条 AI 回复继续生成（即发即忘） |
| `stopGeneration()` | 打断当前正在流式输出的回复（即发即忘） |
| `restartChat()` | 清空所有消息，重置变量，开始新会话 |
| `swipeMessage(messageId, "left" \| "right")` | 在 AI 的多个备选回复（swipe）之间切换。返回 `Promise<Record<string, unknown>>` |

### 会话与分支

| 方法 | 作用 |
|------|------|
| `revertToMessage(messageId)` | 把对话回退到指定消息之前。返回 `Promise<void>` |
| `branchFromMessage(messageId)` | 从指定消息分叉出一个新会话（复制到该消息为止的所有消息和状态快照）。返回 `Promise<string \| null>`——新会话 ID，失败则 `null`（流式中、多人房间、消息不存在等情况都会失败） |
| `getBranchContext()` | 获取当前分支树的切片（自己、父分支、同级分支、子分支）。返回 `Promise<BranchContext>`，每次调用都重新拉取、无缓存。见[`BranchContext`](#branchcontext) |
| `createSession(worldId)` | 为指定世界开新会话。返回 `Promise<string>`——新会话 ID |
| `deleteSession(sessionId)` | 删除指定会话。返回 `Promise<void>` |
| `listSessions(worldId)` | 列出指定世界下所有会话。返回 `Promise<Array<Record<string, unknown>>>` |

### 存档点（Checkpoints）

存档点是当前会话内的命名快照，可以把会话状态回退到之前。

| 方法 | 作用 |
|------|------|
| `saveCheckpoint()` | 保存当前会话状态为新存档点。返回 `Promise<void>`（保存完成后 `checkpoints` 字段会被推送更新） |
| `loadCheckpoints()` | 向主应用请求刷新 `checkpoints` 列表。返回 `Promise<void>` |
| `restoreCheckpoint(checkpointId)` | 把会话还原到指定存档点。返回 `Promise<void>` |
| `deleteCheckpoint(checkpointId)` | 删除存档点。返回 `Promise<void>` |

### 音频

| 方法 | 作用 |
|------|------|
| `playAudio(trackId, opts?)` | 播放条目里定义的音频。`opts`: `{ volume?, fadeDuration?, chainTo?, maxDuration?, duckBgm? }`，其中 `fadeDuration` 秒，`chainTo` 指定下一段 trackId，`duckBgm` 让 BGM 在这段音频期间自动降低音量 |
| `stopAudio(trackId?, fadeDuration?)` | 停止指定音轨（不传 `trackId` 则停止所有音频） |
| `setAudioVolume(type, volume)` | `type` 为 `"bgm"` 或 `"sfx"`，`volume` 为 0–1 |
| `getAudioVolume(type)` | 同步返回当前音量（0–1） |

### UI / 导航

| 方法 | 作用 |
|------|------|
| `toggleImmersive()` | 切换沉浸（全屏）模式 |
| `copyToClipboard(text)` | 复制文本到剪贴板（取代 `navigator.clipboard.writeText`） |
| `navigate(path)` | 让主应用导航到指定路径，如 `"/app/hub"`（取代 `window.location = ...`） |
| `showToast(message, type?)` | 在主应用显示 toast 通知。`type`: `"success"`、`"error"`、`"info"`（默认） |

### 持久化存储（按世界隔离）

localStorage 的替代品。存储按 `worldId` 隔离，不同世界互不可见。

| 方法 | 作用 |
|------|------|
| `storage.get(key)` | 读值。返回 `Promise<string \| null>` |
| `storage.set(key, value)` | 写值（只能是字符串）。返回 `Promise<void>` |
| `storage.remove(key)` | 删值。返回 `Promise<void>` |

存复杂数据？自己 `JSON.stringify` / `JSON.parse`。

### AI 原始补全

**跳过**主聊天管线的 LLM 调用。用来做"NPC 在旁路里自言自语"、"用 AI 生成物品描述"之类的场景。**不会**写入消息历史、不会触发状态变更、不会消耗开场白。

```tsx
const api = useYumina()
const text = await api.ai.complete({
  messages: [
    { role: "system", content: "你是一个暴躁的商人。" },
    { role: "user", content: "报一下铁剑的价格。" },
  ],
  onDelta: (chunk) => setStreaming((s) => s + chunk),  // 可选，逐 token 回调
  model: "claude-sonnet-4-6",                           // 可选，默认用 selectedModel
  maxTokens: 500,                                       // 可选
  temperature: 0.7,                                     // 可选
})
```

返回 `Promise<string>`——完整响应文本。120 秒超时。

### 上下文注入

向**下一轮**主聊天 AI 调用注入一次性上下文消息。用完即清、只消费一次，**不会**产生可见的聊天消息。适合"手机消息、NPC 旁白、环境变化"这种主线 AI 需要知道但玩家不该直接看到的信息。

```tsx
api.injectContext("你刚收到一条神秘短信：『今晚 9 点，老地方。』", { role: "system" })
// 玩家下次发消息时，主线 AI 会看到这条 system 消息
```

`options`: `{ role?: "system" \| "user" }`（默认 `"system"`）。

### 模型选择

| 字段 / 方法 | 作用 |
|-------------|------|
| `selectedModel` | 当前模型 ID |
| `userPlan` | 用户订阅计划 |
| `preferredProvider` | `"official"` 或 `"private"` |
| `setModel(modelId)` | 切换模型（即发即忘） |
| `getModels()` | 返回 `Promise<{ models, pinnedModels, recentlyUsed }>`，`models` 是 `Array<{ id, name, provider, contextLength }>` |
| `pinModel(modelId)` / `unpinModel(modelId)` | 收藏 / 取消收藏模型 |

### 素材

| 方法 | 作用 |
|------|------|
| `resolveAssetUrl(ref)` | 把 `@asset:xxx` 引用转成 CDN URL。纯字符串变换，不发起网络请求。HTTP/HTTPS 直通 |

### Markdown

| 方法 | 作用 |
|------|------|
| `renderMarkdown(text)` | 把 markdown 文本转成**安全 HTML**（转义 HTML 实体、移除危险标签、保留格式）。在自定义气泡里配合 `dangerouslySetInnerHTML` 就能安全渲染——例子见下方 |

```tsx
<div dangerouslySetInnerHTML={{ __html: api.renderMarkdown(msg.rawContent) }} />
```

---

## 组件

### `<Chat>`

平台维护的完整聊天体验。**这是最常用的积木——不加参数就是默认聊天。**

内置：消息列表渲染、自动滚动、流式光标、swipe 切换、消息操作（编辑/删除/重生成）、输入框、选择按钮、模型选择器、只读模式、开场白占位。

```tsx
<Chat renderBubble={(msg) => <MyBubble {...msg} />} />
```

#### Props

| 属性 | 类型 | 说明 |
|------|------|------|
| `renderBubble?` | `(props: BubbleProps) => ReactNode` | 自定义每个消息气泡的样子。不传就用默认 markdown 渲染 |
| `className?` | `string` | 追加给外层容器的 CSS class |
| `children?` | `ReactNode` | 渲染在消息列表**上方**的内容（例如固定的 HUD 头部） |

#### BubbleProps

`renderBubble` 回调拿到的 `msg` 对象：

| 字段 | 类型 | 含义 |
|------|------|------|
| `contentHtml` | `string` | **预渲染的安全 HTML**（markdown 已转换）。通常用 `dangerouslySetInnerHTML` 输出 |
| `rawContent` | `string` | 渲染前的原始 markdown 文本（含指令原文） |
| `role` | `"user" \| "assistant" \| "system"` | 消息来源 |
| `messageIndex` | `number` | 消息在列表中的索引（0 = 首条，通常是开场白） |
| `isStreaming` | `boolean` | 这条消息正在流式输出时为 `true` |
| `stateSnapshot` | `Record<string, unknown> \| null` | 生成这条消息**时**的游戏状态快照（用来展示"那一刻"的 HP、地点等） |
| `variables` | `Record<string, unknown>` | 当前（最新）的游戏变量 |
| `renderMarkdown` | `(text) => string` | 工具函数：把任意 markdown 文本转成安全 HTML |

### `<MessageList>`

只渲染消息流（带滚动、流式光标、swipe 控制），**没有**输入框。

```tsx
<MessageList />
```

不接受 `renderBubble` 参数——要自定义气泡请用 `<Chat renderBubble={...} />`，或者像视觉小说那样彻底不用 `<MessageList>`、直接 `api.messages` 自己读。

### `<MessageInput>`

只渲染输入框（含模型选择器、选项按钮、继续/重启菜单、流式状态）。

```tsx
<MessageInput />
```

`api.readOnly` 为 `true` 时自动隐藏。

### `<ChatCanvas>`

**旧别名**，等同于 `<Chat />`。老世界里仍可用，新代码请用 `<Chat />`。

---

## `useAssetFont()`

从已上传的字体素材加载 `@font-face`，返回一个可直接用于 `font-family` CSS 值的字符串。

```tsx
const fontFamily = useAssetFont("@asset:my-font-id", {
  family: "Cinzel",
  fallback: "serif",
})
return <div style={{ fontFamily }}>古老的文字</div>
```

### 签名

```ts
useAssetFont(
  assetRef: string | null | undefined,
  options?: AssetFontOptions
): string
```

字体在后台异步加载。加载期间返回 `options.fallback`（未提供则为 `"serif"`），加载完成会触发重渲染，返回完整 family 字符串（带作用域后缀以避免冲突）。

### `AssetFontOptions`

| 字段 | 类型 | 说明 |
|------|------|------|
| `family?` | `string` | 字体家族名。不传会从文件名或 `assetRef` 推断 |
| `fallback?` | `string` | 未加载时使用的后备字体。默认 `"serif"` |
| `filename?` | `string \| null` | 原文件名，用于格式推断 |
| `mimeType?` | `string \| null` | MIME 类型，用于格式推断 |
| `format?` | `"opentype" \| "truetype" \| "woff" \| "woff2" \| null` | 显式指定格式 |
| `weight?` | `string \| number` | `font-weight` |
| `style?` | `string` | `font-style`（如 `"italic"`） |
| `stretch?` | `string` | `font-stretch` |
| `display?` | `FontDisplay` | `font-display`（默认 `"swap"`） |

---

## 类型

### `SandboxMessage`

`api.messages` 数组里每一项的形状：

```ts
interface SandboxMessage {
  id: string
  sessionId: string
  role: "user" | "assistant" | "system"
  content: string
  status?: "complete" | "streaming" | "failed"
  errorMessage?: string | null
  authorUserId?: string | null          // 多人游戏里消息的作者
  authorNameSnapshot?: string | null    // 发送时的作者显示名
  stateChanges?: Record<string, unknown> | null   // 本消息造成的变量改动 diff
  stateSnapshot?: Record<string, unknown> | null  // 生成本消息时的完整状态快照
  swipes?: Array<{ content, stateSnapshot }>      // AI 备选回复
  activeSwipeIndex?: number
  model?: string | null
  tokenCount?: number | null
  generationTimeMs?: number | null
  compacted?: boolean                   // 是否已被压缩到历史里
  attachments?: Array<{ type, mimeType, name, url }> | null
  createdAt: string                     // ISO-8601
}
```

### `Checkpoint`

```ts
interface Checkpoint {
  id: string
  name: string
  messageCount: number
  createdAt: string   // ISO-8601
}
```

### `BranchContext`

```ts
interface BranchNode {
  id: string
  name: string | null
  parentSessionId: string | null
  branchedFromMessageId: string | null
  messageCount: number
  updatedAt: string   // ISO-8601
  createdAt: string   // ISO-8601
}

interface BranchContext {
  current: BranchNode          // 当前会话
  parent: BranchNode | null    // 父分支（从哪里分叉出来），顶层会话为 null
  siblings: BranchNode[]       // 同父的其他分支，按时间升序
  children: BranchNode[]       // 直接子分支，按时间升序
}
```

---

## 被禁的浏览器 API

你的代码跑在一个 `sandbox="allow-scripts"` 的跨域 iframe 里，**没有** `allow-same-origin`。这意味着：

- 不能访问主应用的 cookie / localStorage
- 不能发带凭证的网络请求
- 不能直接操纵 `window.parent`

以下 API 要么被**完全禁用**，要么被**透明重定向**到 SDK。

### 重定向（老代码能继续跑）

| 你写的代码 | 实际发生 |
|-----------|---------|
| `fetch('/api/...')` | 通过桥接调用主应用的已认证 fetch |
| `fetch('/cdn/...')` | 放行（CSP 允许） |
| `fetch('其他 URL')` | **拒绝**（抛错） |
| `localStorage.getItem/setItem/removeItem/clear` | 通过 `api.storage` 按世界隔离 |
| `sessionStorage.*` | 同上 |
| `navigator.clipboard.writeText()` | 等价于 `api.copyToClipboard()` |
| `navigator.clipboard.readText() / read() / write()` | **拒绝**（抛错） |
| `window.location.pathname / href / assign / replace` | 合成对象，`pathname` 始终是 `/app/chat/{sessionId}`；赋值/`assign`/`replace` 会触发导航 |
| `window.location.reload()` | 通过桥接重载会话 |
| `window.__yuminaToggleImmersive()` | 等价于 `api.toggleImmersive()` |

### 推荐的用法

写新代码的时候**直接用 SDK**——重定向只是给老世界兜底，SDK 更清晰也更稳定：

| 不要写这个 | 写这个 |
|-----------|-------|
| `fetch('/api/sessions', { method: 'POST' })` | `api.createSession(worldId)` |
| `fetch('/api/sessions/' + sid, { method: 'DELETE' })` | `api.deleteSession(sid)` |
| `localStorage.getItem("k")` | `await api.storage.get("k")` |
| `window.location = "/app/hub"` | `api.navigate("/app/hub")` |
| `navigator.clipboard.writeText(t)` | `api.copyToClipboard(t)` |

---

## 速查：API 全貌

一张表，全部扫一眼。

```
useYumina()
├── 状态读取
│   ├── variables, globalVariables, personalVariables, roomPersonalVariables
│   ├── worldName, worldId, sessionId, currentUser, room
│   ├── messages, permissions
│   ├── isStreaming, streamingContent, streamingReasoning
│   ├── pendingChoices, error, readOnly, greetingContent, canvasMode
│   ├── checkpoints
│   └── selectedModel, userPlan, preferredProvider
├── 游戏动作
│   ├── sendMessage(text)
│   ├── setVariable(id, value, options?)
│   ├── executeAction(actionId)
│   ├── switchGreeting(index)
│   └── clearPendingChoices()
├── 聊天控制
│   ├── editMessage(id, content) → Promise<boolean>
│   ├── deleteMessage(id) → Promise<boolean>
│   ├── regenerateMessage(id)
│   ├── continueLastMessage()
│   ├── stopGeneration()
│   ├── restartChat()
│   └── swipeMessage(id, direction) → Promise
├── 会话 / 分支
│   ├── revertToMessage(id) → Promise<void>
│   ├── branchFromMessage(id) → Promise<string | null>
│   ├── getBranchContext() → Promise<BranchContext>
│   ├── createSession(worldId) → Promise<string>
│   ├── deleteSession(id) → Promise<void>
│   └── listSessions(worldId) → Promise<Array>
├── 存档点
│   ├── saveCheckpoint() → Promise<void>
│   ├── loadCheckpoints() → Promise<void>
│   ├── restoreCheckpoint(id) → Promise<void>
│   └── deleteCheckpoint(id) → Promise<void>
├── 音频
│   ├── playAudio(trackId, opts?)
│   ├── stopAudio(trackId?, fadeDuration?)
│   ├── setAudioVolume(type, volume)
│   └── getAudioVolume(type) → number
├── UI / 导航
│   ├── toggleImmersive()
│   ├── copyToClipboard(text)
│   ├── navigate(path)
│   └── showToast(message, type?)
├── 存储
│   ├── storage.get(key) → Promise<string | null>
│   ├── storage.set(key, value) → Promise<void>
│   └── storage.remove(key) → Promise<void>
├── AI
│   └── ai.complete({ messages, onDelta?, model?, maxTokens?, temperature? }) → Promise<string>
├── 上下文注入
│   └── injectContext(message, { role? })
├── 模型选择
│   ├── setModel(modelId)
│   ├── getModels() → Promise<{ models, pinnedModels, recentlyUsed }>
│   ├── pinModel(id), unpinModel(id)
├── 素材
│   └── resolveAssetUrl(ref) → string
└── Markdown
    └── renderMarkdown(text) → string   // 安全 HTML

沙箱全局（不用 import）
├── React
├── useYumina, useAssetFont
├── Icons  (1400+ Lucide)
├── Chat, MessageList, MessageInput, ChatCanvas (旧别名)
└── Tailwind 工具类（CSS 级）

被禁 / 重定向
├── fetch('/api/...') → 代理
├── localStorage / sessionStorage → api.storage
├── window.location → 合成对象 + navigate
└── navigator.clipboard → copyToClipboard
```

---

**下一步**：回到[自定义 UI 指南](./07-components.md)看完整示例，或翻[实战配方](./14-recipe-scene-jumping.md)找最接近你需求的模板。
