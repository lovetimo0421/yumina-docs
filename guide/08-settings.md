# 设置

点击导航栏的设置图标进入设置页面。左侧是分类导航，右侧是具体设置项。

![设置页面全景，展示左侧导航和右侧设置内容](./images/settings-overview.png)

## 账户（Account）

- **Email** — 显示你的邮箱（不能修改）
- **Username** — 修改用户名（@开头，字母数字下划线，3-30 位）
- **修改密码** — 填当前密码 + 新密码 + 确认新密码（至少 8 位）
- **退出登录** — 底部红色按钮

## 内容与安全（Content & Safety）

### 内容分级

三个等级可选：

| 等级 | 说明 | 限制 |
|------|------|------|
| **Safe Only** | 只显示全年龄内容 | 默认选项 |
| **Allow R18** | 包含成人内容 | 需要 18 岁以上 |
| **Allow R18G** | 包含所有内容，含极端内容 | 需要 18 岁以上 |

如果你未满 18 岁，R18 和 R18G 选项是灰色的，选不了。

### 模糊敏感内容

**Blur Sensitive Media** 开关——打开后 Hub 里的 R18/R18G 世界缩略图会被模糊处理，不会直接显示。

## 隐私（Privacy）

**Private Profile** 开关——打开后只有你的粉丝能看到你的活动和作品。

## 通知（Notifications）

**Email Notifications** 开关——有人评论你的作品时是否收到邮件通知。

## 关联账户（Connected Accounts）

可以关联你的 Twitter/X 和 Discord 账号。

## 壁纸个性化（Wallpaper）

这是 Yumina 最好玩的设置之一——你可以给每个页面设不同的壁纸 ✧


### 页面壁纸

四个页面可以分别设置壁纸：
- **Discover** — Hub 探索页
- **Profile** — 个人主页
- **Settings** — 设置页
- **Library** — 我的库

自带两个预设壁纸：**Starry Night**（星空）和 **Library Canvas**（画布）。也可以上传自己的图片当壁纸。

### 视觉调节滑块

三个滑块，范围都是 0% - 200%：
- **Wallpaper Opacity** — 壁纸透明度（越高越鲜艳）
- **Bottom Gradient Strength** — 底部渐变深度
- **Cloudy Glass Strength** — 毛玻璃效果强度

## 语言（Language & Region）

支持四种语言：
- English (US)
- 中文 (简体)
- 日本語
- 한국어

## API Key 配置

如果你想用自己的 API Key 来驱动 AI（不消耗平台额度），可以在这里添加。

![API Key 管理界面](./images/api-key-settings.png)

**支持的提供商：**

| 提供商 | Key 格式 | 获取链接 |
|--------|----------|----------|
| **OpenRouter** | `sk-or-v1-...` | openrouter.ai/keys |
| **Anthropic** | `sk-ant-...` | console.anthropic.com |
| **OpenAI** | `sk-...` | platform.openai.com |
| **Ollama (本地)** | `http://localhost:11434` | ollama.com |

**操作：**
1. 选择提供商
2. 填标签名（方便区分）和 Key
3. 点 **+** 添加
4. 添加后可以点验证按钮测试 Key 是否有效

## 自定义 Prompt

高级功能——你可以添加自己的 prompt 来影响 AI 的行为。

**三种注入位置：**
- **System** — 注入到系统 prompt（最强力）
- **In-Chat** — 注入到聊天历史中间
- **Final** — 注入到最后

可以创建文件夹来整理，也支持导入/导出为 JSON 文件。

::: tip 什么时候需要自定义 Prompt？
大多数情况下你不需要动这个。但如果你发现 AI 总是在某些方面表现不理想（比如总是忘记某个设定，或者你希望 AI 始终用中文回复），可以加一条对应的 prompt 试试。
:::

## Prompt Presets

每个世界的创作者都会设置默认的 prompt 预设。你可以选择：

- **Use Creator's** — 使用创作者的设置（默认，推荐）
- **Use My Own** — 使用自己的设置（切换后可以逐条编辑和开关每个预设）

::: warning 注意
除非你知道自己在做什么，否则建议保持 Use Creator's。随意修改预设可能会让世界的体验变得奇怪。
:::

## 关于（About）

显示 Yumina 版本号、使用条款和隐私政策链接。

---

恭喜你看完了基础教程！现在你已经知道怎么玩转 Yumina 了 ∠( ᐛ 」∠)＿

想自己做世界？去看 [创作者指南](/creator-guide/00-welcome) 吧 ᕕ( ᐛ )ᕗ
