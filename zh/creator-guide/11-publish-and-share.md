# 发布、导出与Bundle

> 世界做好了不分享出去，就像做了一桌好菜只给自己吃——也不是不行，但总觉得少点什么。

---

## 简单版

世界做好了，怎么让别人玩到？其实很简单：**去发现页面点发布就行。**

在你点"发布"之前，先在编辑器的 **概览（Overview）** 里把这几样东西准备好：

- **名字和描述** — 名字最多200字，描述最多10000字。好名字是门面，好描述是引路牌。
- **封面图片（Cover Image）** — 就是玩家在社区列表里第一眼看到的那张图。没封面的世界就像没贴海报的电影院，路过的人不知道里面放什么。
- **标签（Tags）** — 最多 10 个。标签帮助玩家发现你的世界，比如"奇幻""恋爱""大逃杀""多人"之类的。
- **年龄分级** — 全年龄（all）、R18、R18G，三选一。选了R18或R18G会自动打上NSFW标记。
- **可见性** — 公开（所有人可见）或仅关注者可见。

准备好之后，保存世界，回到 **发现（Discover）** 页面，点顶部的 **发布（Publish）** 按钮。在弹出的发布弹窗里选择你的世界、设好年龄分级和可见性、勾选同意条款，点发布。你的世界就会出现在 **发现（Discover）** 里，其他玩家可以搜索、浏览、直接玩或者复制一份去改造。

不想用平台的发布系统？也可以把世界导出为JSON文件，直接发给朋友。或者，只导出你世界里的一部分内容——比如一套战斗系统——打成一个Bundle分享给其他创作者。

---

## 详细版

### 发布状态（Status）

一个世界有三种状态，像红绿灯一样控制它的可见性：

| 状态 | 含义 | 别人能看到吗？ |
|------|------|----------------|
| `draft`（草稿） | 还在做，只有你自己能看到 | 不能 |
| `published`（已发布） | 上线了，出现在发现（Discover）页面 | 能 |
| `unpublished`（已下架） | 曾经发布过，但你收回来了 | 不能 |

状态之间的切换是有规则的，不是随便跳的：

```
draft ---------> published
published -----> unpublished
unpublished ---> published（重新上架）
unpublished ---> draft（退回草稿重新打磨）
```

注意几个不能走的路：草稿不能直接变成"已下架"——你都没上架过，怎么下架呢？已发布也不能直接退回草稿——需要先下架再退回。

当你下架一个世界时，系统会自动通知所有把它加入收藏库的玩家："这个世界下架了。"重新上架时也会通知他们："它又回来了。"挺贴心的。

### 发布时的各项设置

以下设置都在 **发现（Discover）** 页面的 **发布弹窗** 里配置，不是在编辑器里。

**年龄分级（ageRating）**

三个档位：

| 分级 | 含义 |
|------|------|
| `all` | 全年龄，谁都能看 |
| `r18` | 限制级，未成年不宜 |
| `r18g` | 重口限制级（猎奇内容） |

设了 `r18` 或 `r18g`，`isNsfw` 会自动变成 `true`——你不用手动去勾。反过来也一样：如果你只设了 `isNsfw: true` 但没指定分级，系统会默认给你设成 `r18`。如果你什么都没设，发布时默认就是 `all` + 非NSFW。总之系统会帮你兜底，不会出现"分级和NSFW标记对不上"的尴尬局面。

**可见性（visibility）**

```
public     — 公开，所有人都能在发现（Discover）页面看到
followers  — 仅关注者可见，适合小范围测试或给熟人圈子
```

发布时如果没指定，默认是 `public`。

**是否允许编辑（allowEdit）**

默认 `true`。开着的话，其他创作者可以复制（fork）你的世界去改造。关了的话，只有你自己能复制自己的世界。

这就像开源和闭源的区别：开了allowEdit，你的世界可能会被别人拿去做出各种有趣的变体；关了的话，你的内容就只能被玩、不能被改。看你自己的态度了。

**是否支持多人（allowMultiplayer）**

默认 `false`。这个标记告诉平台这个世界是否设计了多人游玩功能。如果你在世界定义的schema里把 `multiplayerSettings.availability` 设为 `enabled`，系统在创建世界时也会自动推断这个值。具体的多人行为配置在下面的"多人模式设置"里讲。

**标签（tags）**

最多 10 个标签。标签在 **发现（Discover）** 页面的搜索和筛选里非常有用——平台会统计所有已发布世界的标签使用频率，玩家可以按标签浏览和搜索。输入标签时还有自动补全，会基于已有的热门标签给你建议。

**封面图片（thumbnailUrl）**

在编辑器的 **概览（Overview）** 区域上传。**发现（Discover）** 页面的卡片、搜索结果、**我的库（Library）** 列表都会用到这张图。没封面的世界几乎不会被点开，强烈建议加一张。

### 复制与Fork

当一个世界处于已发布状态且 `allowEdit` 为 `true` 时，其他用户可以"复制"它。复制的过程是这样的：

1. 创建一份完整的副本，归复制者所有
2. 名字自动加编号——如果原名叫"黑暗森林"，你的副本就叫"黑暗森林 (1)"；再复制一份就是"黑暗森林 (2)"，以此类推
3. 副本默认是草稿状态，不会自动发布
4. 保留原始的标签、描述、封面、Schema等所有内容
5. 原世界的 `downloadCount`（下载计数）+1
6. 副本的 `sourceWorldId` 会指向原世界，方便追溯来源
7. 如果原世界有关联的资源引用（比如图片），也会一并复制过来

### Bundle系统

Bundle是什么？打个比方：你花了两周做了一套精密的战斗系统——变量、规则、UI组件、音效全套。你的朋友也在做世界，需要一套战斗系统。你不用把整个世界给他，只需要把战斗系统相关的部分**打包**成一个Bundle，发给他就行了。

Bundle就是一个"零件包"，包含你世界中选定的部分内容。

**YuminaBundle 结构：**

```typescript
interface YuminaBundle {
  bundleVersion: "2.0.0";       // 当前版本（旧的 1.0.0 仍然能导入，自动迁移）
  name: string;                  // Bundle名称，比如"回合制战斗系统"
  description: string;           // 描述这个Bundle是干什么的
  tags: string[];                // 标签
  createdAt: string;             // 创建时间（ISO格式）

  // ── 内容 ──
  entries: WorldEntry[];         // 条目（角色设定、剧情、风格指令等）
  variables: Variable[];         // 变量（血量、金币、好感度等）
  rules: Rule[];                 // 规则（当血量归零时触发死亡等）
  customUI: CustomUIComponent[]; // 自定义 UI TSX 组件（必填，始终是数组）
  audioTracks: AudioTrack[];     // 音频（BGM、音效、环境音）

  // ── 应用模板 ──
  rootComponent?: RootComponent; // 根组件——多文件 TSX 虚拟文件系统，
                                 // 定义整个世界的 UI 入口（index.tsx）
                                 // 带上就是"完整模板"，不带就是"零件包"

  // ── 整理 ──
  customTags?: string[];         // 自定义标签定义（可选）
  entryFolders?: EntryFolder[];  // 条目的文件夹结构（可选）

  // ── 已废弃字段（仅为导入兼容保留，新导出不应写入） ──
  components?: unknown;          // @deprecated —— 旧版声明式 GameComponent 数组
  customComponents?: unknown;    // @deprecated —— 更早期的自定义组件结构
  messageRenderer?: unknown;     // @deprecated —— 已被 rootComponent 的 index.tsx 取代
}
```

::: tip Bundle 的两种用法
- **零件包（partial bundle）** — 只带 entries / variables / rules / audioTracks 的 Bundle，**合并**进已有世界。比如分享一套战斗系统、一个角色卡。
- **完整模板（full template）** — 同时带 `rootComponent` 的 Bundle，可以**派生**为一个全新世界。比如"视觉小说骨架"、"卡牌对战壳"——别人导入后等于在你的模板基础上从零开始做。

七大官方资源模板（Resource Templates）就是这样实现的。
:::

你可以把它理解成一个"模块"——拿来就用，插到别人的世界里就能跑。

**创建Bundle**

在编辑器顶部菜单点 **导出 Bundle（Export Bundle）**，会看到四个可勾选的板块：

1. **Entries** — 条目（角色设定、剧情、风格指令等）
2. **Variables** — 变量（血量、金币、好感度等）
3. **Rules** — 行为（触发条件 + 动作）
4. **Custom UI** — 自定义 UI TSX 组件数组

有个贴心的设计：当你勾选了某条规则，系统会自动高亮提示它依赖的变量，标个"suggested"让你不会漏选。

有两样东西会**自动包含**（没有勾选框）：

- **音频轨道**（`audioTracks`）——整套音频总是自动打包。
- **根组件**（`rootComponent`）——如果你的世界有根组件，就会自动附加上去。带上根组件后，Bundle 会升级为一个"完整模板"——别人导入后可以直接派生成一个新世界，而不只是往已有世界里合并内容。

**导入时的冲突处理**

当你往一个已有的世界里导入Bundle时，内容是**合并**进去的，不是覆盖。具体的冲突处理逻辑：

- **变量ID相同**：跳过，直接用现有的
- **变量名相同但ID不同**：创建新变量，名字自动加后缀（比如 `HP (1)`）
- **条目**：总是生成新UUID，追加到现有条目列表末尾
- **规则和组件**：同理，新建ID后追加

规则和组件里引用的变量ID会自动重映射，保证导入后引用关系不会断。这个细节很重要——否则导入一套战斗系统，规则里引用的"HP"变量对不上号，那就白导入了。

**发布Bundle到Hub**

Bundle 保存后默认是私有的。发布后可以在 **发现（Discover）** 页面被其他创作者搜索、预览、安装。

也可以把Bundle下载为 `.bundle.json` 文件，直接发给朋友手动导入。

### 完整世界导出

除了Bundle这种"部分导出"，你也可以导出完整的世界JSON。在编辑器的 **概览（Overview）** 区域可以导出，也可以在 **我的库（Library）** → **我的项目（My Projects）** 里操作。导出的文件包含整个 `WorldDefinition` 里的所有内容：

- 所有条目（entries）和条目文件夹结构（entryFolders）
- 所有变量（variables）
- 所有行为（rules）和编译后的事件反应（reactions）
- 根组件（rootComponent）——整个世界的 UI 入口，包含 `index.tsx` 及其所有兄弟文件
- 自定义 UI TSX 组件（customUI）
- 音频轨道（audioTracks）和BGM播放列表（bgmPlaylist）、条件BGM（conditionalBGM）
- 空间系统（systems）与场景（scenes）
- 编辑器模式（editorMode: "simple" | "advanced"）
- UI蓝图（uiBlueprint）
- 世界设置（settings）——温度、token上限、布局模式、扫描深度等等
- 多人模式设置（multiplayerSettings）

注：作品变体分组键（`languageGroupId`）存在世界记录本身（用于 Hub 匹配），不在 `WorldDefinition` 里，所以不会出现在导出 JSON 中。

完整导出的用途：

- **备份** — 定期导出一份，万一手滑删了什么还能恢复。数据在云端是安全的，但多一份本地备份心里更踏实。
- **版本控制** — 扔进Git仓库追踪变更。每次大改之前导出一份，相当于手动存档。
- **与合作者分享** — 把JSON发给合作者，他们导入后就能在自己账号下继续工作。
- **跨平台迁移** — 未来Tauri离线版也用同一格式，到时候无缝切换。

导入时系统能自动识别Yumina世界JSON、SillyTavern角色卡（包括PNG嵌入的V2卡）和Bundle JSON，分别走不同的处理流程。你不需要手动选格式，拖进去就行。

### 多语言支持：两种系统

Yumina 提供两套多语言机制，**目标完全不同，根据需要选用**：

| 机制 | 翻译什么 | 适用场景 |
|------|---------|---------|
| **商店翻译（Hub Translations）** | 只翻译世界在 Discover / 个人主页里的"展示信息"——标题、描述、封面图、图库、标签 | 你的游戏内容是单语言的，但希望全球玩家在浏览时能看到本地化的标题描述 |
| **变体（Variants）** | 完整复制一份世界，翻译**全部游戏内容**（条目、规则、组件文案……） | 你想让玩家用任意一种语言玩你的世界，AI 也用对应语言回复 |

#### 商店翻译（Hub Translations）

入口在编辑器左侧导航栏的 **商店翻译（Hub Translations）** 区域。

操作流程：

1. 进入 **商店翻译** 区域
2. 点 **添加语言（Add Language）**
3. 从下拉菜单选目标语言（支持 10 种）
4. 当前世界的名称、描述、封面、图库、标签会被复制一份作为起始内容
5. 在 UI 里直接改每个字段——把它们翻译成目标语言
6. 需要的话可以为该语言上传不同的封面图
7. 保存就行——翻译内容作为世界的一部分存储，不会生成额外的世界

玩家在 Discover 页面浏览时，Yumina 根据玩家的界面语言自动展示最匹配的翻译版本。**玩家进游戏后看到的内容仍然是世界的原语言**——商店翻译不影响游戏内容。

#### 变体（Variants）

如果你想让游戏内容也跟着翻译，需要用 **变体（Variant）** 系统——在编辑器顶部的变体标签栏里新建一个变体并选目标语言。详细操作流程见 [新手指南 → 多语言版本（Variants）](./01-beginner-guide.md#多语言版本-variants)。

变体之间会被引擎自动识别为"同一个世界的不同语言版本"，玩家在世界详情页可以一键切换。社区列表里这一组变体只算一个世界，浏览数据合并统计。

#### 支持的语言

两套机制都支持以下 10 种语言：

| 代码 | 语言 |
|------|------|
| `en` | English |
| `zh` | 中文 |
| `ja` | 日本語 |
| `ko` | 한국어 |
| `es` | Español |
| `fr` | Français |
| `de` | Deutsch |
| `pt` | Português |
| `ru` | Русский |
| `ar` | العربية |

::: tip 用哪个？
- 只想给海外玩家一个**像样的封面和介绍**就用 → 商店翻译
- 想做**完全本地化的游戏体验**就用 → 变体
- 两个**可以同时用**：变体 A（中文版）下设中文 + 英文商店翻译，变体 B（英文版）下设英文 + 日文商店翻译——总共覆盖三国玩家
:::

---

## 多人模式设置（MultiplayerSettings）

如果你的世界支持多人游玩，可以在世界定义的 `multiplayerSettings` 里配置具体行为。这个设置是可选的——不配置就默认禁用多人。

```typescript
multiplayerSettings: {
  availability: "disabled" | "enabled";       // 默认 disabled
  defaultChatPolicy: "free" | "active_speaker_only";  // 默认 free
  defaultAiTriggerMode: "instant" | "timer" | "round" | "manual";  // 默认 manual
  defaultRoundTimerSeconds: number;           // 5~120秒，默认15秒
  authorNotes?: string;                       // 给房主看的提示
}
```

逐个说明：

**availability** — 总开关。`disabled` 就是纯单人世界，`enabled` 才能开房间多人玩。记得同时在世界的数据库层面把 `allowMultiplayer` 设为 `true`——编辑器里有个独立的开关。

**defaultChatPolicy** — 聊天策略。
- `free`：自由聊天，所有人随时可以发言，像群聊一样热闹。适合休闲互动类世界。
- `active_speaker_only`：轮流发言，一次只有一个人能说话，像桌游回合制。适合TRPG跑团。

**defaultAiTriggerMode** — AI什么时候回复。这四个模式适合不同的游戏节奏：
- `instant`：有人说话AI就立刻回复。节奏最快，适合对话驱动的世界。
- `timer`：等计时器倒计时结束后AI才回复（配合 `defaultRoundTimerSeconds`）。给其他人留出"插嘴"的时间窗口。
- `round`：等所有人都发了言AI才回复。像TRPG那样一轮结束后DM才说话，保证每个人的行动都被考虑到。
- `manual`：房主手动触发AI回复。最灵活，完全由房主控制节奏。

**defaultRoundTimerSeconds** — 计时器秒数，最小5秒、最大120秒，默认15秒。主要在 `timer` 模式下生效。

**authorNotes** — 给开房间的人看的提示文字。比如"建议2-4人游玩""房主请先读完规则""每人选一个职业再开始"。这段话不会发给AI，纯粹是给真人看的使用说明。

这些都是**默认值**——房主开房间后可以根据实际情况调整。你设的是"推荐配置"。

---

## 实用例子

### 例子1：发布检查清单

你的世界做好了，准备上线。别急着按按钮，先按这个清单一项一项过：

```
[ ] 名字 — 有吸引力吗？能让人一眼知道这是什么类型的世界？
[ ] 描述 — 写了吗？别留空。至少写两句话告诉玩家能在这里体验什么。
[ ] 封面图片（Cover Image）— 上传了吗？在发现（Discover）页面缩小后还能看清吗？
[ ] 标签（Tags）— 加了 3-10 个相关标签？想想玩家会搜什么词。
[ ] 年龄分级 — 有成人内容就选r18，有极端内容就选r18g，没有就选all。别搞错。
[ ] 可见性 — 想让所有人看到就选public。想先让小范围测试就选followers。
[ ] allowEdit — 想让别人能fork改造就开着。想保护原创就关了。
[ ] Greeting — 玩家进来第一条消息是什么？设好了吗？第一印象很重要。
[ ] 自测 — 自己从头到尾玩一遍了吗？变量正常吗？规则触发正常吗？
```

确认无误后，点编辑器顶部的 **保存（Save）**，然后回到 **发现（Discover）** 页面，点顶部的 **发布（Publish）** 按钮，在弹窗中选择你的世界并完成发布流程。

世界上线了。去 **发现（Discover）** 页面看看它的样子吧。

### 例子2：创建一个战斗系统Bundle分享给社区

假设你在自己的RPG世界里做了一套回合制战斗系统，包含：

- 变量：`HP`（数值，0~100，stat类别）、`MP`（数值，0~50，resource类别）、`ATK`、`DEF`、`battlePhase`（字符串，flag类别）
- 规则：`HP归零时触发死亡结算`、`回合开始时MP自然回复5点`
- 组件：一个stat-bar显示HP、一个stat-bar显示MP
- 音频：战斗BGM（loop）、受击音效（sfx）

打包步骤：

1. 编辑器顶部菜单点 **导出 Bundle（Export Bundle）**
2. 名字填"回合制战斗系统 v1.0"，描述写清楚用法
3. 勾选 5 个变量——注意勾行为的时候系统会提示相关变量，跟着点就行
4. 勾选 2 条行为和 2 个组件
5. 勾选音频轨道
6. 标签写 `combat`、`rpg`、`turn-based`
7. 导出并保存

导出的Bundle JSON长这样（简化版）：

```json
{
  "bundleVersion": "2.0.0",
  "name": "回合制战斗系统 v1.0",
  "description": "一套开箱即用的回合制战斗系统，包含HP/MP管理、死亡判定和战斗UI",
  "tags": ["combat", "rpg", "turn-based"],
  "createdAt": "2026-03-23T10:00:00Z",
  "entries": [
    {
      "id": "entry-battle-rules",
      "name": "战斗系统指令",
      "content": "当战斗开始时，按照回合顺序行动...",
      "role": "system",
      "section": "system-presets",
      "alwaysSend": true,
      "enabled": true,
      "keywords": [],
      "conditions": [],
      "conditionLogic": "all",
      "position": 0
    }
  ],
  "variables": [
    { "id": "hp", "name": "HP", "type": "number", "defaultValue": 100,
      "min": 0, "max": 100, "category": "stat" },
    { "id": "mp", "name": "MP", "type": "number", "defaultValue": 50,
      "min": 0, "max": 50, "category": "resource" }
  ],
  "rules": [],
  "audioTracks": [
    { "id": "bgm-battle", "name": "战斗BGM", "type": "bgm",
      "url": "https://example.com/battle.mp3", "loop": true, "volume": 0.6 }
  ]
}
```

别人拿到 Bundle 文件后，在编辑器顶部菜单点 **导入 Bundle（Import Bundle）**，选择要装进哪个世界，战斗系统就到位了。变量名冲突的话系统会自动处理，不用担心。

### 例子3：多人模式设置 — 4人合作RPG

你做了一个4人合作的地下城探险世界。每个人扮演一个职业（战士、法师、盗贼、牧师），轮流行动，所有人都行动完毕后AI作为DM来推进剧情。

多人设置应该这样配：

```json
{
  "multiplayerSettings": {
    "availability": "enabled",
    "defaultChatPolicy": "active_speaker_only",
    "defaultAiTriggerMode": "round",
    "defaultRoundTimerSeconds": 60,
    "authorNotes": "建议4名玩家，每人选择一个职业：战士、法师、盗贼、牧师。每轮每人描述自己的行动，所有人行动完毕后AI会推进剧情。计时器60秒——如果有人挂机太久，到时间AI照样往下走。"
  }
}
```

为什么选这些配置？

- `active_speaker_only` — 轮流发言，避免四个人同时打字、AI不知道该回应谁的混乱局面。跑团嘛，就该一个一个来。
- `round` — 等所有人都说完AI才回复，保证每个人的行动都被考虑到。不会出现"我还没说话DM就跳过我了"的情况。
- `60秒计时器` — 给每个人足够时间想策略，但也不会等太久。如果有人去倒水了，60秒后AI照样推进，不至于卡住所有人。
- `authorNotes` — 给开房间的人一份"说明书"，让他知道怎么组织这场游戏、该提醒玩家什么。

同时别忘了在世界层面把 `allowMultiplayer` 设为 `true`，否则就算multiplayerSettings配好了，平台也不会把它当成多人世界来展示。
