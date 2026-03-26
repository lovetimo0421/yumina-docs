# Yumina 创作者文档 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 编写完整的 Yumina 中文创作者文档（双轨制：教程 + 参考手册）

**Architecture:** Markdown 文件放在 `docs/creator-guide/`，每章独立文件，README 作为导航。每个复杂功能章节包含 🟢简单版 和 🔵详细版 两层。

**Tech Stack:** Markdown, 参考 Yumina engine/shared/app 源码

**注意:** `02-tutorial-advanced.md`（壺中の毒高级教程）暂不编写，留待后续。

---

### Task 1: README 导航页

**Files:**
- Create: `docs/creator-guide/README.md`

**内容:**
- 文档标题和一句话介绍
- 完整目录，分三部分（创作之旅 / 功能参考 / 附录）
- 每章一行链接 + 一句话描述
- "怎么用这份文档"的简短说明

---

### Task 2: 欢迎页

**Files:**
- Create: `docs/creator-guide/00-welcome.md`

**源码参考:**
- `packages/app/src/features/hub/featured-section.tsx`（精选世界列表）

**内容:**
- Yumina 是什么（一句话定义 + 展开）
- 创作者能做什么（能力概览列表）
- 文档使用指南（教程路径 vs 参考手册）
- "5分钟感受"（引导去体验精选世界）

---

### Task 3: 核心概念速览

**Files:**
- Create: `docs/creator-guide/01-core-concepts.md`

**源码参考:**
- `packages/engine/src/types/index.ts`（核心类型定义）
- `packages/engine/src/world/schema.ts`（WorldDefinition）

**内容:**
- 7个核心概念各用一段大白话解释：世界、词条、变量、指令、规则、组件、渲染器
- ASCII/文字流程图：词条→提示词→AI→指令→变量→规则→渲染
- 概念之间的关系说明

---

### Task 4: 普通版教程（No, I am not human）

**Files:**
- Create: `docs/creator-guide/02-tutorial-basic.md`

**源码参考:**
- `sample card/No__I_m_not_a_Human.json`（世界定义）

**内容:**
- 以 "No, I am not human" 为蓝本，手把手教创建类似世界
- 步骤：创建世界 → 写角色词条 → 写开场白 → 创建变量 → 教AI用指令 → 加HUD组件 → 加世界书词条 → 测试发布
- 每步配截图位置标记（`[截图：xxx]`占位）
- 口语化风格，像朋友在旁边教

---

### Task 5: 词条与世界书

**Files:**
- Create: `docs/creator-guide/03-entries-and-lorebook.md`

**源码参考:**
- `packages/engine/src/world/schema.ts`（WorldEntry 定义）
- `packages/engine/src/prompts/prompt-builder.ts`（词条如何组装进提示词）

**内容:**
- 🟢 简单版：词条是什么、角色类型、关键词触发
- 🔵 详细版：全字段、四大区域、深度、模糊匹配、二级关键词、递归、文件夹
- 💡 例子：角色词条、场景词条、条件触发词条

---

### Task 6: 变量系统

**Files:**
- Create: `docs/creator-guide/04-variables.md`

**源码参考:**
- `packages/engine/src/world/schema.ts`（Variable 定义）
- `packages/engine/src/state/game-state-manager.ts`（状态管理）

**内容:**
- 🟢 简单版：四种类型、怎么创建、默认值
- 🔵 详细版：9种操作、min/max、分类、嵌套路径、behaviorRules
- 💡 例子：HP变量、背包数组、角色关系JSON

---

### Task 7: AI指令与宏

**Files:**
- Create: `docs/creator-guide/05-directives-and-macros.md`

**源码参考:**
- `packages/engine/src/parser/response-parser.ts`（指令解析）
- `packages/engine/src/prompts/prompt-builder.ts`（宏展开）

**内容:**
- 🟢 简单版：基本语法、3个常用宏
- 🔵 详细版：所有语法变体、完整宏表、JSON Patch、音频指令、解析流程
- 💡 例子：战斗扣血、获得物品、切换场景

---

### Task 8: 行为规则引擎

**Files:**
- Create: `docs/creator-guide/06-rules-engine.md`

**源码参考:**
- `packages/engine/src/rules/rules-engine.ts`
- `packages/engine/src/reactions/reaction-evaluator.ts`
- `packages/engine/src/world/schema.ts`（Rule 定义）

**内容:**
- 🟢 简单版：WHEN/IF/THEN、最简例子
- 🔵 详细版：9种触发器、7种运算符、8种动作、注入位置、优先级/冷却/次数
- 💡 例子：HP归零游戏结束、进入区域触发描述、回合计时器

---

### Task 9: 组件系统

**Files:**
- Create: `docs/creator-guide/07-components.md`

**源码参考:**
- `packages/engine/src/types/components.ts`
- `packages/app/src/features/session/game-panel/`（组件渲染）

**内容:**
- 🟢 简单版：5种组件介绍、最简配置
- 🔵 详细版：每种组件全部字段、变量绑定、Web Panel
- 💡 例子：HP血条、背包格子、场景图片

---

### Task 10: 自定义消息渲染器

**Files:**
- Create: `docs/creator-guide/08-message-renderer.md`

**源码参考:**
- `packages/app/src/features/session/message-list/`（渲染逻辑）
- `sample card/` 中的渲染器代码

**内容:**
- 🟢 简单版：渲染器是什么、效果对比
- 🔵 详细版：TSX入门、Props接口、模板、三种渲染方式区别
- 💡 例子：简单气泡渲染器、带角色头像的渲染器

---

### Task 11: 音频系统

**Files:**
- Create: `docs/creator-guide/09-audio.md`

**源码参考:**
- `packages/engine/src/world/schema.ts`（AudioTrack, BGMPlaylist, ConditionalBGM）

**内容:**
- 🟢 简单版：加BGM、三种类型
- 🔵 详细版：播放列表、条件触发、AI指令、淡入淡出、链式播放
- 💡 例子：循环BGM、战斗切歌、环境音

---

### Task 12: AI模型与设置

**Files:**
- Create: `docs/creator-guide/10-ai-settings.md`

**源码参考:**
- `packages/engine/src/world/schema.ts`（WorldSettings）

**内容:**
- 🟢 简单版：temperature/max_tokens概念、推荐值
- 🔵 详细版：全参数、扫描深度、递归深度、structuredOutput
- 💡 例子：不同风格的推荐设置

---

### Task 13: 发布、导出与Bundle

**Files:**
- Create: `docs/creator-guide/11-publish-and-share.md`

**源码参考:**
- `packages/server/src/routes/worlds.ts`
- `packages/engine/src/world/schema.ts`（YuminaBundle）

**内容:**
- 🟢 简单版：发布流程、可见性
- 🔵 详细版：Bundle系统、JSON导出、标签分级、多人模式
- 💡 例子：发布检查清单

---

### Task 14: 术语表

**Files:**
- Create: `docs/creator-guide/12-glossary.md`

**内容:**
- 所有术语按拼音/字母排序
- 每个术语一句话解释 + 对应英文
- 涵盖：世界、词条、变量、指令、规则、组件、渲染器、Bundle、宏、触发器等

---

### Task 15: 常见问题

**Files:**
- Create: `docs/creator-guide/13-faq.md`

**内容:**
- 分类整理：创作基础、变量与指令、规则、组件、发布
- 每个问题简短回答 + 指向相关章节的链接
