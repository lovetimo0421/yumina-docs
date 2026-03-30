# 自定义前端指南

> 你的世界不需要看起来像一个聊天窗口。这篇教你怎么把它变成任何你想要的样子——而且不用自己写代码。

---

## 简单版

Yumina 默认用普通文字显示 AI 的回复。但你可以自定义两样东西：

- **消息渲染器（messageRenderer）**：改变每条 AI 消息的外观。让纯文字变成气泡对话、视觉小说、战斗日志……
- **自定义组件（customComponents）**：额外的 UI 面板。可以做角色创建界面、游戏侧边栏、全屏地图……

这两个都需要 TSX 代码，但**你不需要自己写**。用 AI 来生成就好了：

- **内置方法**：编辑器里点 **进入工作室** → 打开 **AI Assistant** 面板 → 用中文告诉它你想要什么
- **外部方法**：把需求描述发给 Claude / ChatGPT / DeepSeek，让它写好代码，复制粘贴进来

就这么简单。下面是详细说明 ᕕ( ᐛ )ᕗ

---

## 详细版

### 三种渲染模式

Yumina 的前端渲染分三个层级，从简单到复杂：

#### 1. 默认模式：什么都不做

AI 的回复显示为普通 Markdown 文字。够用但不好看。适合刚开始搭建世界的时候先跑通逻辑。

#### 2. messageRenderer：改造消息外观

一段 TSX 代码，替换默认的文字渲染。每条 AI 回复都会经过它。

适合做：
- 带角色头像和名字的气泡对话
- 视觉小说风格（背景图 + 立绘 + 对话框）
- 带颜色标记的战斗日志
- 在消息上方/下方显示状态面板

在哪设置：编辑器 → **消息渲染器（Message Renderer）** 区域 → 选 **自定义 TSX（Custom TSX）** → 粘贴代码

#### 3. customComponents：独立的 UI 面板

一个或多个 TSX 组件，作为额外的面板显示。不替换消息，而是在消息旁边或上方出现。

适合做：
- 角色创建界面
- 游戏侧边栏（状态、背包、地图）
- 全屏接管（设置 `fullScreenComponent: true` 后，customComponents 占据整个屏幕，聊天隐藏）

在哪设置：**Studio** → **Code View** 面板 → 点 **+** 添加组件 → 写代码或让 AI 写（需要先点 **进入工作室**）

#### messageRenderer vs customComponents 怎么选

| | messageRenderer | customComponents |
|---|---|---|
| 数量 | 只能有一个 | 可以有多个 |
| 位置 | 替换消息渲染 | 消息旁边/上方，或全屏 |
| 适合 | 改消息的外观 | 做独立的游戏 UI |
| 编辑 | 编辑器或 Studio | 只能在 Studio |

大多数世界只用 messageRenderer 就够了。需要全屏游戏界面的时候才用 customComponents。

::: info 显示模式说明
内置组件（stat-bar、text-display 等）在普通聊天模式下显示在 header 横栏中。customComponents（TSX 面板）只在全屏模式下显示（`fullScreenComponent: true`）。如果你想在普通聊天模式下添加交互元素（按钮、输入框等），请使用 messageRenderer。
:::

---

### 用 Studio AI 生成界面

这是最推荐的方式。不用写代码，跟 AI 聊天就行。

#### 进入 Studio

编辑器顶部 → 点 **进入工作室**


Studio 有几个面板：

| 面板 | 干什么 |
|------|-------|
| **AI Assistant** | 跟 AI 聊天，让它帮你生成/修改代码 |
| **Canvas** | 实时预览你的界面效果 |
| **Code View** | 查看和编辑代码（messageRenderer + customComponents） |
| **Playtest** | 内嵌聊天，测试游戏 |

#### 怎么跟 Studio AI 说

直接用中文描述你想要的效果就行。越具体越好。

**示例 1 — RPG 状态面板：**

```
帮我改一下消息显示方式，给我的奇幻RPG世界加一个状态面板。

我想要的效果：
1. 每条消息上方有一个暗紫色的面板，带淡紫色发光边框，圆角
2. 面板里横排显示三样东西：
   - 红色血条，显示当前HP（hp变量）和最大HP（max_hp变量）
   - 蓝色魔力条，显示当前MP（mp变量）和最大MP（max_mp变量）
   - 金色的金币数量，读 gold 变量，旁边带个金币图标
3. 面板下面正常显示消息文字
4. 整体暗色奇幻风格，面板不要太高

我的变量：
- hp — 当前生命值，数字
- max_hp — 最大生命值，数字
- mp — 当前魔力，数字
- max_mp — 最大魔力，数字
- gold — 金币，数字
- location — 当前位置，文字
```

Studio AI 会生成代码并弹出审核卡片。看一眼 Canvas 预览效果，满意就点 **Approve**，不满意就继续说具体的修改要求。

**示例 2 — 视觉小说风格：**

```
帮我做一个视觉小说/galgame风格的消息显示。

我想要的效果：
1. 整个区域像一个游戏场景画面，宽高比大概 16:9
   - 背景图从 currentScene 变量读（存的是图片链接）
   - 没有背景图的时候显示深蓝色渐变
2. 画面中央显示角色的立绘图片
   - 图片从 characterPortrait 变量读（也是图片链接）
   - 大一点，居中显示
3. 底部是一个半透明的黑色对话框
   - 说话人名字从 characterName 变量读，名字用樱花粉色
   - 对话内容就是AI回复的文字
4. 如果文字里有 *星号包裹的内容*，那是动作描述，用灰色斜体显示在对话框上面
5. 右上角小字显示好感度（affection变量），低好感红色，高好感粉色

我的变量：
- currentScene — 背景图链接，文字
- characterPortrait — 角色立绘链接，文字
- characterName — 角色名字，文字
- affection — 好感度，数字，0到100
```


---

### 用外部 AI 生成界面

如果你更习惯用 Claude、ChatGPT 或其他 AI，也完全没问题。关键是告诉它 Yumina 的环境信息。

#### 给外部 AI 怎么说

外部 AI（Claude、ChatGPT、DeepSeek 等）不了解 Yumina，所以除了描述你想要的效果，还需要告诉它一些技术信息。格式很简单——先用大白话描述效果，末尾附上技术信息：

```
我在用一个叫 Yumina 的AI互动平台做世界，帮我写一段代码改变消息显示方式。

我想要的效果：
[用大白话描述你想要什么，颜色、布局、风格、读哪些变量]

我的变量：
[列出你的变量，写明每个是什么、存什么值]

Yumina 技术信息（写代码时请遵守）：
- 代码格式 TSX，用 export default function Renderer({ content, renderMarkdown }) { ... } 导出
- useYumina() 可以读变量，比如 useYumina().variables.health
- 内置 YUI 组件库（不用 import 直接用）：
  YUI.Scene（背景）、YUI.Sprite（立绘）、YUI.DialogueBox（对话框）、
  YUI.StatBar（血条）、YUI.StatCard（属性卡）、YUI.Panel（面板容器）、
  YUI.Tabs（标签页）、YUI.ItemGrid（物品格子）、YUI.ChoiceButtons（选择按钮）、
  YUI.ActionButton（动作按钮）、YUI.Badge（标签）、YUI.Fullscreen（全屏）
- 内置 Icons 图标库（不用 import），比如 Icons.Heart, Icons.Sword, Icons.Coins
- renderMarkdown(content) 把文字变成 HTML
- 支持 Tailwind CSS 和 React hooks
```

AI 给你代码后：
1. 如果是 **messageRenderer** → 编辑器 → Message Renderer → Custom TSX → 粘贴
2. 如果是 **customComponent** → Studio → Code View → 点 + → 粘贴

底部显示 **编译状态：正常（Compile Status: OK）** 就成功了。报错就把错误信息发回给 AI 让它修。

---

### YUI 组件库速览

TSX 代码里可以直接用这些预制组件，不需要 import：

| 组件 | 用途 | 常用 props |
|------|------|-----------|
| `YUI.Scene` | 背景场景 | `bg`(背景图URL), `transition` |
| `YUI.Sprite` | 角色立绘 | `src`(图片URL), `position`(left/center/right), `size` |
| `YUI.DialogueBox` | 对话框 | `speaker`(说话人), `speakerColor`, `variant`(default/thought/narration) |
| `YUI.ChoiceButtons` | 选择按钮 | `choices`(选项数组), `onChoice`, `layout`(vertical/horizontal/grid) |
| `YUI.StatBar` | 状态条 | `label`, `value`, `max`, `color` |
| `YUI.StatCard` | 属性卡片 | `label`, `value`, `icon` |
| `YUI.Panel` | 容器面板 | `title`, `children` |
| `YUI.Tabs` | 标签页切换 | `tabs`(标签数组), `activeTab`, `onTabChange` |
| `YUI.ItemGrid` | 物品格子 | `items`(物品数组), `columns`, `emptySlots` |
| `YUI.ActionButton` | 动作按钮 | `label`, `icon`, `onClick` |
| `YUI.Badge` | 小标签 | `children`, `variant` |
| `YUI.Fullscreen` | 全屏切换 | `children` |

这些组件默认暗色主题，有平滑动画，开箱即用。你（或者帮你写代码的 AI）可以通过 `className` prop 用 Tailwind CSS 进一步自定义样式。

---

### useYumina() — 读写游戏状态

TSX 代码里用 `useYumina()` hook 可以访问游戏的一切：

```
const api = useYumina();

api.variables          // 所有变量的当前值，比如 api.variables.health
api.sendMessage(text)  // 以玩家身份发送一条消息
api.setVariable(id, value)  // 直接设置一个变量的值
api.executeAction(id)  // 触发一个规则动作
api.isStreaming        // AI 是否正在生成中
api.streamingContent   // AI 正在生成的内容（实时）
api.resolveAssetUrl(ref)  // 把素材引用转成真实 URL
api.playAudio(trackId)    // 播放音频
api.stopAudio(trackId)    // 停止音频
```

你不需要记住这些——让 AI 帮你写代码的时候它会自动用上。这里只是列出来做参考。

---

## 实用例子

每个例子都给出完整的 prompt，你可以直接复制发给 Studio AI 或外部 AI 使用。

---

### 例子 1：恐怖游戏状态栏（messageRenderer）

**效果**：每条消息上方显示暗色恐怖风格的 HP/体力/天数面板。

**复制这段发给 Studio AI 或外部 AI：**

```
帮我改消息显示方式，做一个恐怖生存游戏的状态面板。

效果：
1. 每条消息上面有一个暗色状态栏，深灰偏黑背景，带暗红色细边框，圆角
2. 状态栏里从左到右显示：
   - 红色的HP血条（读 health 变量，满血 100）
   - 绿色的体力条（读 energy 变量，满体力 100）
   - 右边用琥珀色文字显示"第X天 · 夜晚"（读 day 和 phase 变量）
   - 如果 is_armed 是 true，最右边加一个白色小剑图标
3. 状态栏下面正常显示消息文字
4. 风格要压抑、低饱和度，末日恐怖的感觉

变量：health（生命值，0-100），energy（体力，0-100），day（天数），phase（"night"或"day"），is_armed（是否武装，是/否）
```

如果用外部 AI，在末尾加上这段技术信息：
> Yumina 平台，TSX 格式，export default function Renderer({ content, renderMarkdown })，useYumina().variables 读变量，YUI.StatBar 做血条，Icons.Sword 做图标，renderMarkdown(content) 渲染文字，支持 Tailwind CSS。



---

### 例子 2：视觉小说风格（messageRenderer）

**效果**：全屏场景背景 + 角色立绘 + 底部半透明对话框。

**复制这段发给 Studio AI 或外部 AI：**

```
帮我做一个视觉小说/galgame风格的消息显示。

效果：
1. 整个区域像游戏场景画面，16:9比例
   - 背景图从 currentScene 变量读（图片链接），没图的时候深蓝渐变
2. 画面中间显示角色立绘，从 characterPortrait 变量读，大图居中
3. 底部半透明黑色对话框：
   - 说话人名字从 characterName 变量读，名字用樱花粉色
   - 对话内容就是AI的回复文字
4. *星号包裹的文字* 是动作描述，灰色斜体显示在对话框上面
5. 右上角小字显示好感度 ♥（读 affection 变量），低好感红色、中间白色、高好感粉色

变量：currentScene（背景图链接），characterPortrait（角色立绘链接），characterName（角色名），affection（好感度，0-100）
```

如果用外部 AI，在末尾加上这段技术信息：
> Yumina 平台，TSX 格式，export default function Renderer({ content, renderMarkdown })，useYumina().variables 读变量，YUI.Scene 做背景、YUI.Sprite 做立绘、YUI.DialogueBox 做对话框，renderMarkdown(content) 渲染文字，支持 Tailwind CSS。


---

### 例子 3：游戏侧边栏（customComponent）

**效果**：聊天旁边的侧边栏，显示角色信息 + 属性 + 背包。

**复制这段发给 Studio AI 或外部 AI：**

```
帮我做一个游戏侧边栏（作为 customComponent，不是 messageRenderer）。

效果：
1. 深灰色背景面板，圆角
2. 顶部是角色信息：
   - 左边圆形头像（从 playerAvatar 变量读图片链接），紫色边框
   - 右边是角色名（playerName 变量）和等级"Lv.X"（level 变量），等级用紫色
3. 中间是属性区域，标题"属性"：
   - 红色HP血条，读 hp 和 max_hp 变量
   - 蓝色MP条，读 mp 和 max_mp 变量
   - 三个属性卡片横排：力量（strength，剑图标）、防御（defense，盾图标）、速度（speed，闪电图标）
4. 底部是背包区域，标题"背包"：
   - 3列的物品格子，从 inventory 变量读（数组，每个物品有 name、icon、count）
   - 空格子显示灰色虚线框，总共9个格位

变量：playerAvatar（头像链接），playerName（角色名），level（等级），hp/max_hp（当前/最大生命），mp/max_mp（当前/最大魔力），strength/defense/speed（属性数字），inventory（背包数组）
```

如果用外部 AI，在末尾加上这段技术信息：
> Yumina 平台，TSX 格式，export default function Component()，useYumina().variables 读变量，YUI.StatBar 做血条、YUI.StatCard 做属性卡、YUI.ItemGrid 做背包、YUI.Panel 做面板容器，Icons.Sword/Shield/Zap 等图标可用，支持 Tailwind CSS。


::: tip 这些 prompt 可以直接用
上面三个 prompt 可以直接复制发给 Studio AI 或外部 AI。拿到代码后粘贴进去就行。觉得效果不对就继续跟 AI 聊，让它调整颜色、大小、布局。
:::

::: info 技术细节
想深入了解 TSX 语法、Props 接口、编译环境等技术细节 → [自定义消息渲染器](./08-message-renderer.md)
:::
