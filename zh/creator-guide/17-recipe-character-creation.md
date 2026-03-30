<div v-pre>

# 角色创建表单

> 玩家打开会话，看到一个角色创建界面——输入名字、选择职业、写背景故事，点「开始冒险」后跳转到真正的故事开场。从第一条 AI 回复开始，AI 就知道玩家角色的一切。

---

## 你要做的东西

第一条消息不是故事，而是一个**角色创建表单**。表单由消息渲染器绘制，包含：

- 一个文本输入框——让玩家输入角色名字
- 三个职业选择按钮——战士 / 法师 / 盗贼
- 一个文本区域——让玩家写角色的背景故事
- 一个「开始冒险」按钮——点击后把所有信息存入变量，然后跳转到真正的故事开场白

跳转之后，知识库条目里的 `{{player_name}}`、`{{player_class}}`、`{{player_backstory}}` 宏会被引擎自动替换成玩家填写的内容。AI 在写第一条回复时，就已经拿到了完整的角色信息。

### 前置知识

这个配方直接建立在 **配方 #1** 的两个核心技巧之上：

| 技巧 | 来源 | 本配方怎么用 |
|------|------|-------------|
| `switchGreeting(index)` 跳转开场白 | 配方 #1 第一部分 | 玩家填完表单后，从"创建界面"跳到"故事开场" |
| `{{variableId}}` 宏替换条目内容 | 配方 #1 第二部分 | 条目里的 `{{player_name}}` 等宏在提示词构建时被替换成玩家输入的值 |

如果你还没读过配方 #1，建议先去看一遍：[点击 UI 跳转开场白与修改条目内容](./14-recipe-scene-jumping.md)。

### 原理

完整的时序：

```
1. 玩家开始新会话 → 看到第 1 个问候语（角色创建表单）
2. 消息渲染器检测到 messageIndex === 0，渲染表单 UI
3. 玩家输入名字、选择职业、写背景故事
4. 玩家点击「开始冒险」
   → 代码调用 api.setVariable("player_name", "艾琳")
   → 代码调用 api.setVariable("player_class", "法师")
   → 代码调用 api.setVariable("player_backstory", "从小在魔法塔长大...")
   → 代码调用 api.switchGreeting(1)
   → 第一条消息立刻切换到第 2 个问候语（真正的故事开场）
5. 玩家发第一条消息
   → 引擎构建提示词 → 扫描条目里的 {{...}} 宏
   → {{player_name}} 替换为 "艾琳"
   → {{player_class}} 替换为 "法师"
   → {{player_backstory}} 替换为 "从小在魔法塔长大..."
   → AI 收到完整的角色信息 → 写出第一条回复
```

**关键点：** `setVariable` 是即时生效的，但 AI 要到下一次构建提示词时才能看到变化。所以顺序是：先 `setVariable` 存值 → 再 `switchGreeting` 跳转 → 玩家发消息 → AI 在回复里就能用上角色信息了。

---

## 一步步来

### 第 1 步：创建变量

我们需要三个字符串变量来存储玩家的角色信息。

编辑器 → 左侧边栏 → **变量** 标签页 → 点击「添加变量」，依次创建以下三个：

**变量 1：角色名字**

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 角色名字 | 给你自己看的，方便识别 |
| ID | `player_name` | 条目里的 `{{player_name}}` 宏会找这个 ID |
| 类型 | 字符串 | 因为名字是文字 |
| 默认值 | `旅人` | 如果玩家不填名字就开始，AI 会称呼角色为"旅人" |
| 分类 | 自定义 | 纯分类标签，方便管理 |
| 行为规则 | `不要修改这个变量。它由玩家通过角色创建表单设置。` | 告诉 AI 不要自己改角色名 |

**变量 2：角色职业**

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 角色职业 | 给你自己看的 |
| ID | `player_class` | 条目里的 `{{player_class}}` 宏会找这个 ID |
| 类型 | 字符串 | 因为职业是文字（"战士"、"法师"、"盗贼"） |
| 默认值 | *留空* | 留空表示还没选。消息渲染器会检查这个值来决定高亮哪个按钮 |
| 分类 | 自定义 | 纯分类标签 |
| 行为规则 | `不要修改这个变量。它由玩家通过角色创建表单设置。` | 告诉 AI 不要自己改职业 |

**变量 3：角色背景故事**

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 显示名称 | 角色背景 | 给你自己看的 |
| ID | `player_backstory` | 条目里的 `{{player_backstory}}` 宏会找这个 ID |
| 类型 | 字符串 | 因为背景故事是文字 |
| 默认值 | *留空* | 留空 = 玩家没写背景故事。条目里对应的位置会是空字符串 |
| 分类 | 自定义 | 纯分类标签 |
| 行为规则 | `不要修改这个变量。它由玩家通过角色创建表单设置。` | 告诉 AI 不要自己改背景故事 |

> **为什么 `player_name` 有默认值而另外两个没有？** 因为名字在很多场景下是必需的——AI 总得叫角色点什么。给一个兜底值"旅人"可以避免 AI 在回复里写出尴尬的空白或"无名角色"。而职业和背景故事可以为空——AI 可以合理地忽略它们，或者即兴发挥。

---

### 第 2 步：在「首条消息」里创建两个问候语

打开编辑器，在左侧边栏点击 **首条消息** 标签页。

**创建第一个问候语（角色创建界面）：**

点击「创建首条消息」按钮。在文本框中写入：

```
*一阵温暖的光芒包围了你。你感觉到自己正在成形——但你的身份尚未确定。*

*一个古老的声音在虚空中回荡：*

"欢迎，旅人。在你踏入这个世界之前，请告诉我——你是谁？"
```

> 这段文字是装饰性的——真正的表单 UI 由消息渲染器在这段文字下方渲染。玩家看到的是：上面一段氛围文字，下面一个可交互的角色创建表单。

**创建第二个问候语（真正的故事开场）：**

点击底部的「添加问候语」按钮。切换到标签 **2**，写入故事的真正开场：

```
*{{player_name}}推开了命运之门。*

*你是一名{{player_class}}，这是你第一次踏入埃尔德大陆。远方的城市轮廓在晨曦中若隐若现，脚下的石板路延伸向未知的方向。*

*一阵微风拂过你的脸庞，带着草地和远处炊烟的气息。你深吸一口气——冒险，从现在开始。*

你面前有三条路：通往城镇的大道、穿越树林的小径、以及一条通向河边的下坡路。你怎么走？
```

::: info 问候语里也可以用宏
注意第二个问候语里的 `{{player_name}}` 和 `{{player_class}}`。这些宏会在**显示时**被引擎替换成变量的当前值。所以当玩家填完表单、变量被 `setVariable` 更新之后，`switchGreeting(1)` 切换到这个问候语时，玩家看到的就是带有自己角色名和职业的故事开场。
:::

::: warning 问候语顺序 = index
标签 1 = index 0（默认显示的角色创建界面），标签 2 = index 1（故事开场）。后面消息渲染器里的 `switchGreeting(1)` 就是跳到第二个。
:::

---

### 第 3 步：创建使用宏的知识库条目

现在创建一个条目，把角色信息注入到每次发给 AI 的提示词中。

编辑器 → **知识库** 标签页 → 新建条目

| 字段 | 填什么 | 为什么这样填 |
|------|--------|-------------|
| 名称 | 玩家角色档案 | 给你自己看的 |
| 区域 | 预设 | 预设区的条目每次都会发给 AI |
| 启用 | **是**（打开开关） | 始终生效——角色信息是 AI 一直需要的 |

内容：

```
[玩家角色档案]
姓名：{{player_name}}
职业：{{player_class}}
背景故事：{{player_backstory}}

在对话中始终用角色的名字称呼玩家。根据角色的职业和背景故事来调整互动方式、可用的技能和遭遇的事件。
```

**发生了什么？**

引擎在构建提示词时会扫描这段文字：
- `{{player_name}}` → 替换成变量 `player_name` 的当前值（比如"艾琳"）
- `{{player_class}}` → 替换成变量 `player_class` 的当前值（比如"法师"）
- `{{player_backstory}}` → 替换成变量 `player_backstory` 的当前值（比如"从小在魔法塔长大"）

如果某个变量是空字符串，对应的位置就是空的。比如玩家没写背景故事，AI 看到的就是「背景故事：」后面什么都没有——AI 通常会忽略空字段或自由发挥。

---

### 第 4 步：做角色创建表单的消息渲染器

这是核心步骤——在聊天界面里渲染一个可交互的角色创建表单。

编辑器 → **消息渲染器** 标签页 → 选「自定义 TSX」→ 粘贴以下代码：

```tsx
export default function Renderer({ content, renderMarkdown, messageIndex }) {
  const api = useYumina();

  // ---- 表单状态 ----
  const [name, setName] = React.useState(
    String(api.variables.player_name || "")
  );
  const [selectedClass, setSelectedClass] = React.useState(
    String(api.variables.player_class || "")
  );
  const [backstory, setBackstory] = React.useState(
    String(api.variables.player_backstory || "")
  );

  // 判断是否已经完成角色创建（职业已选 = 表单提交过了）
  const hasCreated = String(api.variables.player_class || "") !== "";

  // 职业列表
  const classes = [
    { id: "战士", label: "战士", icon: "⚔️", desc: "近战专精，高生命值" },
    { id: "法师", label: "法师", icon: "🔮", desc: "远程魔法，高魔力值" },
    { id: "盗贼", label: "盗贼", icon: "🗡️", desc: "敏捷隐匿，高暴击率" },
  ];

  // 处理「开始冒险」
  const handleStart = () => {
    if (!selectedClass) return; // 至少要选一个职业
    api.setVariable("player_name", name.trim() || "旅人");
    api.setVariable("player_class", selectedClass);
    api.setVariable("player_backstory", backstory.trim());
    api.switchGreeting?.(1); // 跳转到第 2 个问候语（故事开场）
  };

  return (
    <div>
      {/* 渲染消息原文 */}
      <div
        style={{ color: "#e2e8f0", lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />

      {/* 角色创建表单——只在第一条消息 & 尚未创建时显示 */}
      {messageIndex === 0 && !hasCreated && (
        <div
          style={{
            marginTop: "20px",
            padding: "24px",
            background: "linear-gradient(135deg, #1e1b4b 0%, #1a1a2e 100%)",
            borderRadius: "16px",
            border: "1px solid #312e81",
          }}
        >
          {/* 标题 */}
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              color: "#c4b5fd",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            创建你的角色
          </div>

          {/* 名字输入 */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#a5b4fc",
                marginBottom: "6px",
                fontWeight: "600",
              }}
            >
              角色名字
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入你的名字（留空则为「旅人」）"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#e2e8f0",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* 职业选择 */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#a5b4fc",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              选择职业
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  style={{
                    flex: 1,
                    padding: "14px 10px",
                    background:
                      selectedClass === cls.id
                        ? "linear-gradient(135deg, #4338ca, #6366f1)"
                        : "#1e293b",
                    border:
                      selectedClass === cls.id
                        ? "2px solid #818cf8"
                        : "1px solid #334155",
                    borderRadius: "10px",
                    color:
                      selectedClass === cls.id ? "#e0e7ff" : "#94a3b8",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "4px" }}>
                    {cls.icon}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      marginBottom: "2px",
                    }}
                  >
                    {cls.label}
                  </div>
                  <div style={{ fontSize: "11px", opacity: 0.7 }}>
                    {cls.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 背景故事 */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#a5b4fc",
                marginBottom: "6px",
                fontWeight: "600",
              }}
            >
              背景故事（可选）
            </div>
            <textarea
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              placeholder="简单写几句角色的来历..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#e2e8f0",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* 开始冒险按钮 */}
          <button
            onClick={handleStart}
            disabled={!selectedClass}
            style={{
              width: "100%",
              padding: "14px",
              background: selectedClass
                ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                : "#374151",
              border: "none",
              borderRadius: "10px",
              color: selectedClass ? "#f5f3ff" : "#6b7280",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: selectedClass ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            {selectedClass ? "开始冒险" : "请先选择职业"}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### 代码逐行解释

**状态管理：**

- `const api = useYumina()` — 获取 Yumina API，用来读写变量、切换问候语
- `name` / `selectedClass` / `backstory` — 三个 React 状态，分别追踪输入框、职业按钮和文本区域的当前值
- `React.useState(String(api.variables.player_name || ""))` — 初始值从变量读取。如果是新会话，变量是默认值；如果是已有会话，从已保存的变量恢复
- `hasCreated` — 检查 `player_class` 是否为空字符串。为空 = 还没创建角色；不为空 = 已经创建了，不再显示表单

**表单 UI：**

- `messageIndex === 0 && !hasCreated` — 只在第一条消息上、且尚未创建角色时显示表单
- `classes.map(...)` — 遍历职业列表，为每个职业渲染一个按钮。选中的职业有高亮边框和渐变背景
- `selectedClass === cls.id` — 判断当前点击的是不是这个职业，用于高亮显示
- `disabled={!selectedClass}` — 没选职业时按钮灰显、不可点击

**提交逻辑（`handleStart`）：**

- `api.setVariable("player_name", name.trim() || "旅人")` — 存入名字。如果玩家留空，用兜底值"旅人"
- `api.setVariable("player_class", selectedClass)` — 存入职业
- `api.setVariable("player_backstory", backstory.trim())` — 存入背景故事
- `api.switchGreeting?.(1)` — 跳转到第 2 个问候语。`?.` 是可选链，如果 API 不可用不会报错

**为什么按这个顺序调用？**

```
setVariable × 3  →  switchGreeting(1)
    ↑                    ↑
  先存数据            再跳转
```

必须先 `setVariable` 再 `switchGreeting`。因为跳转后问候语里的 `{{player_name}}` 和 `{{player_class}}` 宏会立即被替换——如果先跳转后存值，宏拿到的还是旧值（空字符串或默认值）。

---

### 第 5 步：保存并测试

1. 点击编辑器顶部的「保存」
2. 点击「开始游戏」或回到首页开一个新会话
3. 你会看到第一个问候语的氛围文字，下面是角色创建表单
4. 在名字框输入「艾琳」
5. 点击「法师」按钮——按钮高亮，底部按钮变成「开始冒险」
6. 在背景故事框输入「从小在魔法塔长大，偶然发现了通往异世界的传送门」
7. 点击「开始冒险」
8. 第一条消息**立刻**切换成：「*艾琳推开了命运之门。你是一名法师...*」——表单消失
9. 发一条消息（比如"我走向城镇"）——AI 的回复会用"艾琳"称呼你，并根据法师的身份来写互动

**验证 AI 是否真的拿到了角色信息：**

发送消息后，检查 AI 的回复里是否：
- 用了你的角色名（"艾琳"而不是"你"或"旅人"）
- 提到了职业相关的细节（法师→魔法、法杖、咒语等）
- 如果你写了背景故事，AI 可能会引用它（"你想起了魔法塔里的日子..."）

如果 AI 没有用到这些信息，检查下一节的故障排查表。

---

### 故障排查

| 现象 | 可能的原因 | 解决方法 |
|------|-----------|---------|
| 看不到角色创建表单 | 消息渲染器代码没保存或有语法错误 | 检查消息渲染器底部的编译状态，应该显示绿色「OK」 |
| 点「开始冒险」没反应 | 没有选择职业 | 按钮在未选职业时是灰色的（`disabled`），必须先点一个职业 |
| 点了按钮开场白没切换 | 只有一个问候语 | 确认「首条消息」标签页里有 2 个问候语（标签 1 和标签 2） |
| 开场白切换了但看到 `{{player_name}}` 原文 | 宏没有被替换 | 检查变量的 ID 是否拼写正确（`player_name`，不是 `playerName`） |
| AI 回复里没用到角色名 | 条目没有生效 | 检查知识库条目是否启用，内容里是否写了 `{{player_name}}` |
| AI 回复用了默认值"旅人" | `setVariable` 在 `switchGreeting` 之后调用了 | 确认代码里先调 `setVariable` 再调 `switchGreeting` |
| 表单在已创建后还显示 | `hasCreated` 判断条件不对 | 确认 `player_class` 的默认值是空字符串（不是某个有内容的值） |

---

## 进阶：扩展角色创建

### 添加更多职业

只需在 `classes` 数组里加新元素：

```tsx
const classes = [
  { id: "战士", label: "战士", icon: "⚔️", desc: "近战专精，高生命值" },
  { id: "法师", label: "法师", icon: "🔮", desc: "远程魔法，高魔力值" },
  { id: "盗贼", label: "盗贼", icon: "🗡️", desc: "敏捷隐匿，高暴击率" },
  { id: "牧师", label: "牧师", icon: "✨", desc: "治愈祝福，高辅助力" },
  { id: "游侠", label: "游侠", icon: "🏹", desc: "远程射击，擅长追踪" },
];
```

不需要改其他任何代码——按钮会自动出现，选中后 `selectedClass` 就是新职业的 `id`。

### 结合行为规则

你可以像配方 #1 那样，根据职业自动启用/禁用不同的知识库条目。比如：

1. 在知识库里创建「战士专属设定」「法师专属设定」「盗贼专属设定」三个条目，**默认禁用**
2. 在行为标签页创建三个行为，分别在 `player_class` 为对应值时启用对应条目
3. 在 `handleStart` 里加一行 `api.executeAction("choose-class-warrior")` 之类的调用

这样每个职业不仅有不同的名称标签，还有完全不同的世界观设定和 AI 行为。

### 把创建信息显示在后续消息里

你可以在消息渲染器里加一个"角色信息栏"，在每条消息的顶部显示角色名和职业：

```tsx
{/* 在 return 里、消息内容的上方 */}
{hasCreated && (
  <div style={{
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
    fontSize: "12px",
    color: "#a5b4fc",
  }}>
    <span>{String(api.variables.player_name)}</span>
    <span style={{ opacity: 0.5 }}>|</span>
    <span>{String(api.variables.player_class)}</span>
  </div>
)}
```

---

## 速查表

| 你想做的事 | 怎么做 |
|-----------|--------|
| 存储玩家输入的文字 | 创建字符串变量 + `api.setVariable("id", value)` |
| 做选择按钮 | React 状态追踪选中项 + 点击时 `setSelectedClass(id)` |
| 提交表单后跳转开场白 | 先 `setVariable` 存所有值，再 `switchGreeting(index)` 跳转 |
| 让 AI 知道角色信息 | 条目里写 `{{variableId}}` 宏，引擎在构建提示词时自动替换 |
| 表单只显示一次 | 用变量判断 `hasCreated`，创建后表单消失 |
| 按钮不可点击直到满足条件 | `disabled={!condition}` + 对应的灰色样式 |
| 问候语里也显示角色信息 | 问候语文本里直接写 `{{player_name}}` 等宏 |

---

## 直接试试——可导入的示例世界

下载这个 JSON 文件，导入即可体验完整效果：

<a href="/recipe-4-demo-zh.json" download>recipe-4-demo-zh.json</a>

**导入方法：**
1. 进入 Yumina → 我的世界 → 创建新世界
2. 在编辑器顶部点「更多操作」→「导入包」
3. 选择下载的 `.json` 文件
4. 世界会被创建，所有问候语、变量和渲染器都已预配置好
5. 开一个新会话试试看

**包含内容：**
- 2 个问候语（角色创建表单 + 故事开场）
- 3 个变量（`player_name` 角色名、`player_class` 职业、`player_backstory` 背景故事）
- 1 个知识库条目（使用 `{{player_name}}`、`{{player_class}}`、`{{player_backstory}}` 宏的角色档案）
- 一个完整的消息渲染器（角色创建表单 UI）

---

::: tip 这是实战配方 #4
配方 #1 教了按钮跳转和宏替换，这个配方把它们组合成了一个完整的角色创建流程。接下来的配方会继续在这个基础上扩展——比如加入属性点分配、装备选择、多步骤引导等等。
:::

</div>
