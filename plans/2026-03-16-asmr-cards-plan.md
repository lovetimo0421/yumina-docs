# ASMR Cards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate 4 Yumina WorldDefinition v13 cards from popular asmr.one works (2 SFW + 2 NSFW), each with custom messageRenderer.

**Architecture:** Each card is a standalone JSON file in `output/`. Cards follow the rich-char or scenario template structure with ASMR-specific writing style instructions. TSX renderers are written to temp files then injected via `inject-renderer.js`.

**Tech Stack:** WorldDefinition v13 JSON, TSX (React + Tailwind), Node.js for renderer injection

---

## Reference Materials (read before each task)

- **Schema**: `scripts/card-gen/schemas/world-schema-reference.md`
- **Knowledge base**: `scripts/card-gen/card-writing-knowledge.md`
- **Rich-char template**: `scripts/card-gen/templates/rich-char.json`
- **Scenario template**: `scripts/card-gen/templates/scenario.json`
- **Sample renderers**: `sample card/huihui.json` (KonoSuba adventurer card renderer), `output/steins-gate/牧瀬紅莉栖-simple.json` (BBS forum renderer)
- **Renderer injector**: `scripts/card-gen/inject-renderer.js`
- **Cover images**: `https://api.asmr.one/api/cover/{id}.jpg?type=main`

## ASMR Writing Style (apply to ALL cards)

All 4 cards share an ASMR-specific style guide entry. Key instructions for AI:

- **环绕音效描写**: 声音有方向性 —— 从左耳到右耳的气息流动、耳边的低语、指尖在耳廓上的轻触
- **距离感叙事**: 不同距离对应不同感官优先级 —— 远(视觉>听觉)、近(听觉>触觉)、贴耳(触觉>呼吸>耳语)
- **微触觉细节**: 头发扫过脸颊、指尖在太阳穴画圈、呼出的温热气息
- **节奏呼吸**: 文字节奏模拟呼吸 —— 长句=缓慢呼气、短句=吸气停顿、省略号=屏息
- **安静场景渲染**: 越安静越要写声音 —— 时钟嘀嗒、衣料摩擦、睫毛扇动的微风

## 全部中文硬性要求

- 角色名用中文（不用日文原名）
- entry 的 name 字段用中文
- 变量 name/description 用中文
- 规则 name/description 用中文
- messageRenderer 显示给用户的所有文字必须中文
- messageRenderer 中用于内容匹配的角色名可保留日文（同时匹配中日文）

---

### Task 1: SFW-1 — 青梅竹马的心跳押入之夜 (RJ243448)

**Source**: asmr.one RJ243448, 374K DL, CV: 加藤英美里
**Card level**: rich-char
**Files:**
- Create: `output/asmr-osananajimi.json` (card JSON)
- Create: `output/asmr-osananajimi-renderer.tsx` (temp, deleted after injection)

**Step 1: Fetch source details**

Fetch from asmr.one API:
- `https://api.asmr.one/api/work/243448` — metadata, cover URL
- `https://www.dlsite.com/maniax/work/=/product_id/RJ243448.html` — synopsis

Key facts from research:
- Title: 幼馴染とドキドキ押し入れナイト!?in修学旅行
- Setting: 修学旅行の旅館, childhood friend, closet (押入れ) scene
- CV: 加藤英美里 (Katou Emiri)
- 3 tracks: Happening! → 心跳押入时間 → 教師室
- SFW, All Ages
- Cover: `https://api.asmr.one/api/cover/243448.jpg?type=main`

**Step 2: Write the card JSON**

Structure (rich-char template):

```
entries:
  1. worldview (system, before_char, priority 100, alwaysSend)
     — 修学旅行旅馆设定 + ASMR 写作风格指南 + 核心规则
  2. asmr-style (style, before_char, priority 95, alwaysSend)
     — ASMR 专用写作风格（环绕音效、距离感、微触觉等）
  3. char-osananajimi (character, character, priority 90, alwaysSend)
     — 青梅竹马角色卡：
       外貌、性格调色盘（主色=活泼开朗、底色=害羞紧张、点缀=偷偷的喜欢）
       微叙事衍生、语言模式（日常/紧张/认真/害羞）
       与{{user}}的关系（从小一起长大的青梅竹马）
       AI 扮演原则 + 反模式警告
  4. example-dialogue (example, after_char, priority 80, alwaysSend)
     — 2-3 段对话示例，展示角色声音
  5. lore-ryokan (lore, before_char, keyword-triggered: 旅馆,旅行,修学旅行)
     — 旅馆环境描写（走廊、浴衣、蒲团、押入）
  6. lore-oshiire (lore, before_char, keyword-triggered: 押入,壁橱,closet)
     — 押入空间描写（狭小、黑暗、蒲团味道、两人身体的距离）
  7. output-control (system, post_history, priority 98, alwaysSend)
     — 决策点停止、禁止事项、ASMR 描写质量要求
  8. greeting-1 (greeting, greeting, order 0)
     — 修学旅行旅馆走廊偶遇，被老师发现后一起躲进押入
  9. greeting-2 (greeting, greeting, order 1)
     — 已经在押入里了，外面老师在巡逻

variables:
  - heartbeat (number, 0-100, stat): 心跳度，AI 根据距离和互动调整
    behaviorRules: "贴近时+5~10, 对视+3~5, 身体接触+8~15, 尴尬沉默+2~3, 主动拉开距离-5~10"
  - affinity (number, 0-100, relationship): 好感度
    behaviorRules: "温柔互动+2~3, 保护她+3~5, 提起小时候的回忆+2~4, 过于冒失-2~3, 让她安心+3~5"
  - distance (string, custom): 距离感 — "远","近","贴耳"
    behaviorRules: "根据场景自然变化。在押入中默认为'近'。身体靠近时变为'贴耳'。离开押入后变为'远'"
    description: "控制 ASMR 描写精度。'远'时以视觉为主，'近'时加入呼吸和体温描写，'贴耳'时全面 ASMR 细节"

rules:
  - heartbeat-high: variable-crossed, heartbeat rises-above 70 → notify "心跳快得好像要被她听到了……"
  - affinity-milestone: variable-crossed, affinity rises-above 50 → notify + inject-directive (角色开始正视自己的感情)

components:
  - heartbeat-bar (stat-bar, pink #f472b6)
  - affinity-bar (stat-bar, rose #fb7185)
  - distance-display (text-display, icon: ruler)

settings:
  structuredOutput: false
  temperature: 0.85
  playerName: "你"
  lorebookScanDepth: 2
```

Write the complete JSON to `output/asmr-osananajimi.json`.

**Step 3: Write the messageRenderer TSX**

Theme: 日式旅馆暖色调 — 和纸质感背景、蒲团色调、心跳动画效果

Renderer features:
- **messageIndex === 0**: 旅馆窗户风格开场卡 — 封面图 + 角色名 + "修学旅行之夜" 标题 + 心跳度/好感度面板 + 内容
- **role === 'user'**: 简洁气泡，暗蓝色调
- **role === 'system'**: 居中小字提示
- **assistant messages**:
  - 顶部: 角色名 + 距离指示器（远🔵/近🟡/贴耳❤️）
  - 内容解析: 对话「」用暖色高亮, *动作* 用斜体淡色, 内心独白用特殊格式
  - 心跳可视化: 当 heartbeat > 60 时右下角显示心跳动画

Write TSX to `output/asmr-osananajimi-renderer.tsx`.

**Step 4: Inject renderer**

```bash
cd C:/Users/chenp/Downloads/yumina && node scripts/card-gen/inject-renderer.js output/asmr-osananajimi.json output/asmr-osananajimi-renderer.tsx
```

**Step 5: Verify**

Read the output JSON and verify:
- All entry IDs are unique
- All variable IDs referenced in conditions/rules/components exist
- All text visible to users is in Chinese
- messageRenderer.tsxCode is present and valid
- Cover image URL is included somewhere (e.g., in renderer or as asset)

---

### Task 2: SFW-2 — 梦巫女的治愈 (RJ401391)

**Source**: asmr.one RJ401391, 116K DL, CV: 鬼頭明里, 免费
**Card level**: rich-char + 治愈仪式机制
**Files:**
- Create: `output/asmr-miko.json`
- Create: `output/asmr-miko-renderer.tsx`

**Step 1: Fetch source details**

Key facts from research:
- Title: 【快眠導入】まどろみ誘う夢巫女の癒し～かくり世の神社で心身ともに祓われる～
- Setting: 梦中的幽世神社
- Character: 咲夜 (Sakuya), dream shrine maiden
- 6 tracks: 梦中相遇 → 净水清洗 → 款待 → 仪式准备 → 仪式 → 膝枕送别
- Has LRC subtitle files with script content
- Cover: `https://api.asmr.one/api/cover/401391.jpg?type=main`

Fetch LRC files for script reference:
- `https://api.asmr.one/api/media/401391/SE有り/Track01_夢の中で出会い.lrc` (or similar path pattern — try fetching to get actual dialogue content)

**Step 2: Write the card JSON**

Structure:

```
entries:
  1. worldview (system, before_char, priority 100)
     — 幽世神社设定 + 梦境规则（这里的时间不是现实的时间、离开时不会记得细节但身心会被净化）
  2. asmr-style (style, before_char, priority 95)
     — ASMR 写作风格 + 和风美学词典（铃声、清水、薄雾、月光、蛙鸣、虫声）
  3. char-sakuya (character, character, priority 90)
     — 咲夜角色卡：
       外貌：巫女装束（白衣+绯袴）、长黑发、铃铛饰物
       性格调色盘（主色=温柔宁静、底色=顽皮戏谑、点缀=神秘悠远）
       微叙事：她的温柔是一种仪式性的温柔——每个动作都像在执行某种古老的祈祷
       语言模式：缓慢、优雅、偶尔用古语、会突然说出俏皮话打破庄重氛围
       对角色的理解：咲夜不是人类意义上的"女孩"，她是梦与现实的边界本身
  4. example-dialogue (example, after_char, priority 80)
  5. lore-shrine (lore, keyword: 神社,鸟居,参道)
  6. lore-ritual (lore, keyword: 仪式,净化,祓)
  7. output-control (system, post_history, priority 98)
     — 仪式阶段推进控制 + ASMR 描写要求
  8. greeting-1 — 铃声中醒来，发现自己躺在神社的缘侧，咲夜微笑着看着你
  9. greeting-2 — 已经在净水仪式中，咲夜正温柔地用水清洗你的手

variables:
  - purification (number, 0-100, stat): 净化度
    behaviorRules: "接受仪式环节+10~20, 安静配合+5~10, 与咲夜交流+3~5, 抗拒仪式-5~10, 完全放松+15~25"
  - ritual-phase (string, custom): 仪式阶段 — "相遇","净水","款待","准备","仪式","送别"
    behaviorRules: "随剧情自然推进。不要跳跃阶段。每个阶段至少持续2-3个回合"
    description: "当前仪式进行到哪个阶段。影响咲夜的行为和环境描写"
  - dream-depth (number, 0-100, stat): 梦境深度
    behaviorRules: "放松时+3~5, 沉浸仪式+5~8, 质疑梦境真实性-10~15, 恐惧-5~8"
    description: "梦境深度越高，感官描写越细腻，但也越难醒来"
  - affinity (number, 0-100, relationship): 与咲夜的羁绊
    behaviorRules: "温柔回应+2~3, 认真对待仪式+2~4, 感谢她+3~5, 不耐烦-2~3, 触碰铃铛+5"

rules:
  - ritual-progress: variable-crossed, purification rises-above 30/60/90 → inject-directive advancing ritual phase descriptions
  - deep-dream: variable-crossed, dream-depth rises-above 70 → notify "世界的边界开始模糊……"
  - affinity-50: variable-crossed, affinity rises-above 50 → notify "咲夜看你的眼神里多了一丝不舍……"

components:
  - purification-bar (stat-bar, cyan #67e8f9)
  - dream-depth-bar (stat-bar, indigo #818cf8)
  - ritual-phase-display (text-display, icon: sparkles)
  - affinity-bar (stat-bar, pink #f9a8d4)

settings:
  structuredOutput: false
  temperature: 0.85
```

**Step 3: Write the messageRenderer TSX**

Theme: 和风神社 — 紫蓝+樱色渐变，清水波纹效果

Renderer features:
- **messageIndex === 0**: 鸟居+神社风格开场 — 封面图 + "幽世神社" 标题 + 仪式阶段显示 + 净化度/梦境深度仪表
- **assistant messages**:
  - 顶部: 咲夜 + 仪式阶段标签
  - 内容: 对话用淡紫色, 动作用薄雾灰色斜体, 铃声/水声等音效用特殊高亮标记
  - 底部: 净化度进度条（水波纹样式）
- 全局: 微妙的和纸纹理背景

**Step 4: Inject renderer + verify** (same as Task 1)

---

### Task 3: NSFW-2 — JK妈妈的补习班 (RJ285384)

**Source**: asmr.one RJ285384, 325K DL, CV: 一之瀬りと, 免费
**Card level**: rich-char
**Files:**
- Create: `output/asmr-jk-mama.json`
- Create: `output/asmr-jk-mama-renderer.tsx`

**Step 1: Source details**

Key facts:
- Title: オナサポ科のJKママ♪
- Setting: JK少女扮演"妈妈"角色
- 2 tracks: 自我介绍（今天开始我是哥哥的妈妈）→ 亲密照顾
- NSFW, has 2 package images (normal + aroused versions)
- Cover: `https://api.asmr.one/api/cover/285384.jpg?type=main`

**Step 2: Write the card JSON**

Structure:

```
entries:
  1. worldview (system, before_char, priority 100)
     — 设定：一个温柔的JK少女扮演"妈妈"角色，为疲惫的你提供无条件的关爱和治愈
     — 核心规则：她不是真正的母亲，是一个温柔的JK在玩角色扮演。这个角色扮演中的"妈妈"身份既是保护壳也是亲密工具
     — NSFW 尺度控制：根据亲密度自然推进，不急不躁
  2. asmr-style (style, before_char, priority 95)
     — ASMR 写作风格 + 母性ASMR特化（温柔耳语、抱在怀里的安全感、轻拍背部的节奏）
  3. char-jk-mama (character, character, priority 90)
     — 角色卡：
       外貌：JK制服，但加了围裙，头发扎成温柔的马尾
       性格：色彩盘（主色=温柔母性包容、底色=青涩少女心、点缀=调皮撩拨）
       矛盾核心：用"妈妈"的身份说出做为JK说不出口的话
       语言模式：日常用温柔的"ママ"口吻、害羞时暴露JK本性、亲密时混合两者
       微叙事衍生
       NSFW行为梯度：头摸→拥抱→膝枕→耳语→更亲密的接触
       AI 原则 + 反模式
  4. example-dialogue (example, after_char, priority 80)
  5. lore-setting (lore, keyword: 房间,屋子,家)
  6. output-control (system, post_history, priority 98)
  7. greeting-1 — 她穿着制服+围裙站在门口，"欢迎回来，今天妈妈来照顾你哦"
  8. greeting-2 — 你已经躺在她的膝枕上，她在轻轻给你掏耳朵

variables:
  - comfort (number, 0-100, stat): 安心感
    behaviorRules: "被温柔对待+5~10, 撒娇+3~5, 抗拒-5~10, 完全放松+10~15"
  - intimacy (number, 0-100, relationship): 亲密度
    behaviorRules: "温柔互动+2~3, 身体接触+3~5, 主动撒娇+2~4, 过于急躁-3~5, 自然推进+5~8"
  - arousal (number, 0-100, custom): 情欲度（隐藏变量，不在UI显示）
    behaviorRules: "此变量不在侧边栏显示，仅供AI参考调整描写尺度。0-29: 纯粹温柔, 30-59: 带暧昧意味的接触, 60-79: 明显的性暗示, 80-100: 直接亲密行为"
  - mama-mode (boolean, flag): 妈妈模式
    behaviorRules: "默认 true。当角色害羞暴露JK本性时短暂变为 false，恢复后变回 true"
    description: "角色当前是否在'妈妈'角色扮演模式中"

rules:
  - intimacy-30: variable-crossed, intimacy rises-above 30 → notify "她的'妈妈'演技开始带上了一点真心……"
  - intimacy-70: variable-crossed, intimacy rises-above 70 → inject-directive "角色可以开始混合JK少女的真实情感和妈妈角色扮演"
  - arousal-high: variable-crossed, arousal rises-above 60 → inject-directive "描写尺度可以升级，但保持温柔基调"

components:
  - comfort-bar (stat-bar, amber #fbbf24)
  - intimacy-bar (stat-bar, rose #fb7185)
  (arousal 不创建组件 — 隐藏变量)
```

**Step 3: Write messageRenderer TSX**

Theme: 柔和奶油色调 — 温暖、包裹感、校服元素

- **messageIndex === 0**: 温暖的房间卡片 — 封面图 + "JK妈妈的补习班" + 安心感/亲密度面板
- **assistant**: 气泡用奶油色渐变，角色名旁显示 "ママモード 💛" 或 "JKモード 💗"
- 对话用暖橙色，动作用柔和灰色

**Step 4: Inject renderer + verify**

---

### Task 4: NSFW-1 — 双子偶像女仆的后宫奉仕 (RJ432317)

**Source**: asmr.one RJ432317, 139K DL, 4.78 rating, CV: 涼花みなせ + 陽向葵ゅか
**Card level**: scenario (双角色)
**Files:**
- Create: `output/asmr-twin-maid.json`
- Create: `output/asmr-twin-maid-renderer.tsx`

**Step 1: Source details**

Key facts:
- Title: どすけべWアイドルメイドのオス煽りご奉仕ハーレム♪
- 2 characters: ふわり (元气天然) × みや (冷静务实)
- 6 tracks/scenarios: 面试 → 禁忌制作人RP → 初体验 → 事后 → 新婚RP(ふわり) → 认真(みや)
- NSFW, ¥110
- Has 2 high-res package images + 6 script .txt files
- Cover: `https://api.asmr.one/api/cover/432317.jpg?type=main`

**Step 2: Fetch scripts if possible**

Try to fetch track scripts from asmr.one for dialogue reference:
- Track scripts are in `②台本/トラック１.txt` through `トラック６.txt`

**Step 3: Write the card JSON**

Structure (scenario template):

```
entries:
  1. worldview (system, before_char, priority 100)
     — 设定：你是一座屋敷的新主人，两位偶像女仆为你服务
     — 游戏系统：场景制（6个场景可按顺序或自由选择）
     — 双角色互动规则
  2. output-control (system, before_char, priority 98)
     — 双角色同时在场时的描写规则、NSFW 尺度控制、决策点停止
  3. asmr-style (style, before_char, priority 95)
     — ASMR 风格 + 偶像特化（甜美耳语、应援式鼓励、双声道效果描写）
  4. char-fuwari (character, character, priority 90)
     — ふわり(芙瓦莉)角色卡：
       真诚元气、天然呆、失误后马上恢复、容易害羞但行动力强
       Trait pairing: "热情到过头 vs 突然害羞到说不出话"
       与みや的关系：崇拜+竞争意识
       NSFW梯度：从笨拙到全力以赴
  5. char-miya (character, character, priority 90)
     — みや(宫)角色卡：
       冷静务实、目标导向、表面矜持但内心好胜
       Trait pairing: "冷酷专业 vs 被夸奖时的小得意"
       与ふわり的关系：照顾+暗中较劲
       NSFW梯度：从优雅控制到失去冷静
  6. example-dialogue (example, after_char, priority 80)
     — 双角色对话示例，展示两人互动风格
  7. lore-mansion (lore, keyword: 屋敷,房间,大厅)
  8. lore-idol (lore, keyword: 偶像,舞台,演出,粉丝)
  9. greeting-1 — 两人一起出现在屋敷大厅，进行自我介绍和"面试"
  10. greeting-2 — 你已经是主人，ふわり在做饭，みや在整理书房，你选择去找谁

variables:
  - fuwari-affinity (number, 0-100, relationship): 芙瓦莉好感度
    behaviorRules: "温柔对待+2~3, 夸奖她的努力+3~5, 选择她而不是宫+5~8, 忽视她-3~5, 批评她-5~8"
  - miya-affinity (number, 0-100, relationship): 宫好感度
    behaviorRules: "认可她的能力+2~3, 让她主导+3~5, 选择她而不是芙瓦莉+5~8, 小看她-3~5, 太粘人-2~3"
  - harmony (number, 50-100, custom): 后宫和谐度
    behaviorRules: "两人都照顾到+3~5, 偏心严重时-5~10, 调解争端+5~8, 让她们互相竞争-3~5"
    description: "两位女仆之间的和谐程度。低于30时她们会闹别扭，高于80时会主动配合"
  - scene (string, custom): 当前场景
    behaviorRules: "根据剧情推进设定。可选：自由时间/面试/制作人RP/初体验/芙瓦莉独处/宫独处"
  - arousal (number, 0-100, custom): 情欲氛围（隐藏）
    behaviorRules: "隐藏变量。0-29: 日常服务, 30-59: 暧昧服务, 60-79: 情色暗示, 80-100: 直接亲密"

rules:
  - harmony-low: variable-crossed, harmony drops-below 30 → notify "两位女仆之间的气氛有些微妙……" + inject-directive "角色间出现嫉妒和竞争行为"
  - harmony-high: variable-crossed, harmony rises-above 80 → notify "两位女仆默契十足♪" + inject-directive "角色主动配合，可以出现三人互动场景"
  - fuwari-60: variable-crossed, fuwari-affinity rises-above 60 → notify "芙瓦莉的眼神越来越炙热了……"
  - miya-60: variable-crossed, miya-affinity rises-above 60 → notify "宫难得露出了柔软的表情……"

components:
  - fuwari-bar (stat-bar, pink #f472b6, label 芙瓦莉好感度)
  - miya-bar (stat-bar, blue #60a5fa, label 宫好感度)
  - harmony-bar (stat-bar, purple #a78bfa, label 后宫和谐度)
  - scene-display (text-display, icon: clapperboard)
```

**Step 3: Write messageRenderer TSX**

Theme: 偶像舞台 × 女仆屋敷 — 双色系（粉 for ふわり + 蓝 for みや）

- **messageIndex === 0**: 华丽的屋敷入口卡 — 封面图 + 双角色简介卡片(并排) + 好感度面板 + 场景选择按钮 + 自由输入框
  - 选择按钮：6个场景可选，点击调用 sendMessage()
  - 自由输入框：让玩家自定义开局
- **assistant**:
  - 角色名检测：内容中出现ふわり/芙瓦莉时用粉色标记，みや/宫时用蓝色标记
  - 对话高亮：检测说话角色，用对应颜色
  - 底部迷你面板：两人好感度+和谐度
- 双角色头像指示器

**Step 4: Inject renderer + verify**

---

## Post-Generation Checklist

After all 4 cards are generated:

- [ ] All 4 JSON files exist in `output/`
- [ ] Each has messageRenderer injected
- [ ] All user-visible text is Chinese
- [ ] All variable IDs are unique within each card
- [ ] All referenced variable IDs exist
- [ ] Cover image URLs are correct
- [ ] Greetings demonstrate the card's writing style
- [ ] ASMR writing style instructions are present in all cards
- [ ] SFW cards have no NSFW content
- [ ] NSFW cards have appropriate arousal/intimacy progression
