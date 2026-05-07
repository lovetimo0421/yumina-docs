<div v-pre>

# 玩家上传图片

> 让玩家从自己设备里挑一张图——头像、自定义背景、自己角色的照片——立刻显示在世界里。图片以普通变量存储，跨会话保留，导出 bundle 时一起带走。

---

## 你要做出来的东西

聊天旁边一个小的头像上传位:

- 玩家点头像位 → 弹出系统文件选择器
- 选 `.png` / `.jpg` → 图立即出现
- 刷新、切会话、导出 bundle 都不会丢
- **完全本地** —— 不发请求、不上传到服务器

这个套路对所有图片型素材都通用:背景、NPC 立绘覆盖、玩家自画的物品图标、想给 AI 看的截图。

::: info 玩家上传 vs 创作者素材
本配方处理**玩家在游玩时提供**的图片。如果你(创作者)想跟世界一起发货一张固定图片，去编辑器 **素材** 标签上传，然后用 `@asset:xxx` 引用——那走 CDN，不会塞进玩家的会话存档里。
:::

### 原理

整个流程就是三个浏览器原生 API + 一次 SDK 调用:

```
玩家选文件
  → <input type="file" accept="image/*"> 触发 change
  → FileReader.readAsDataURL(file) → "data:image/png;base64,..."
  → api.setVariable("player-avatar", dataUrl)
  → 变量更新 → 组件重渲染 → <img src={dataUrl}> 显示图
```

data URL 就是一段字符串。Yumina 变量能装任何 JSON，所以这串字符串跟其他文本一样存在变量里——不需要单独的上传管线。

---

## 一步一步来

### 第 1 步: 创建变量

编辑器 → 侧边栏 → **变量** 标签 → **添加变量**:

| 字段 | 值 | 为什么 |
|------|-----|------|
| 显示名 | 玩家头像 | 给你自己看的 |
| ID | `player-avatar` | Root Component 用这个 ID 读写 |
| 类型 | 字符串 | data URL 就是文本 |
| 默认值 | *留空* | 留空 = 还没上传，显示占位符 |
| 分类 | 自定义 | 整理用 |
| 行为规则 | `不要修改这个变量。图片是玩家自己上传的，AI 绝对不要改。` | 防止 AI 输出 `[player-avatar: set ...]` 这种指令把图片冲掉 |

> **为什么用字符串、不用 JSON?** data URL 就是一串字符串 `data:image/png;base64,iVBORw...`。用 JSON 也行——比如你需要好几个槽位 `{ avatar: "...", background: "..." }`——但单一头像位用字符串最干净。

---

### 第 2 步: Root Component

编辑器 → **自定义 UI** 区 → 打开 `index.tsx` → 粘贴:

```tsx
export default function MyWorld() {
  const api = useYumina();
  const avatar = String(api.variables["player-avatar"] || "");

  function handlePick(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(ev) {
      const dataUrl = String(ev.target.result || "");
      api.setVariable("player-avatar", dataUrl);
    };
    reader.readAsDataURL(file);

    // 重置 value，否则连选两次同一个文件不触发 onChange
    e.target.value = "";
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 左侧: 头像位 */}
      <div style={{ width: "200px", padding: "16px", borderRight: "1px solid #333" }}>
        <label style={{ display: "block", cursor: "pointer" }}>
          <div style={{
            width: "168px",
            height: "168px",
            borderRadius: "12px",
            background: avatar ? `url(${avatar}) center/cover` : "#1f2937",
            border: "1px solid #374151",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: "13px",
          }}>
            {avatar ? "" : "点击上传"}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handlePick}
            style={{ display: "none" }}
          />
        </label>

        {avatar && (
          <button
            onClick={() => api.setVariable("player-avatar", "")}
            style={{
              marginTop: "12px",
              padding: "6px 12px",
              fontSize: "12px",
              background: "transparent",
              border: "1px solid #4b5563",
              borderRadius: "6px",
              color: "#9ca3af",
              cursor: "pointer",
              width: "100%",
            }}
          >
            移除
          </button>
        )}
      </div>

      {/* 右侧: 普通聊天 */}
      <div style={{ flex: 1 }}>
        <Chat />
      </div>
    </div>
  );
}
```

**逐行解释:**

- `api.variables["player-avatar"]` —— 读出已存的 data URL(没上传时是空字符串)
- `<input type="file" accept="image/*">` —— 标准浏览器文件选择器。`accept="image/*"` 让 OS 对话框只显示图片
- `FileReader.readAsDataURL` —— 异步读文件、产出 `data:image/...;base64,...` 字符串，结果在 `ev.target.result`
- `api.setVariable("player-avatar", dataUrl)` —— 把字符串存进变量。变量属于会话状态，所以头像跨刷新保留，玩家导出会话时也带着
- `e.target.value = ""` —— 没这一行，连选两次同一个文件不会触发 `onChange`(浏览器会去重相同的 file input value)
- 头像那块用 CSS `background-image` 而不是 `<img>` 标签，是为了白嫖 `cover` 裁剪

---

### 第 3 步: (可选)保存前压缩

一张 4K 手机照片轻松超过 5 MB，base64 编码后再大 ~33%。每次渲染都序列化 7 MB 的字符串很慢，导出 bundle 也会膨胀。比缩略图大一点的图，建议在客户端先降采样:

```tsx
function compressToDataUrl(file, maxDim = 512, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => { img.src = String(reader.result); };
    reader.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handlePick(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const dataUrl = await compressToDataUrl(file, 512, 0.85);
  api.setVariable("player-avatar", dataUrl);
  e.target.value = "";
}
```

`canvas.toDataURL("image/jpeg", 0.85)` 一般能把 512×512 头像压到 40–80 KB，存储几乎无成本，渲染瞬时。

> **经验值**: 单个图片变量 base64 编码后保持 ~200 KB 以内。几个这种大小的头像没问题；一整套全分辨率照片就过分了——那场景用编辑器 **素材** 标签 + `@asset:xxx` 引用。

---

### 第 4 步: 保存测试

1. 编辑器顶上点 **保存**
2. 开/进会话
3. 点头像位、选张图——应当立即出现
4. 刷新页面——头像还在
5. 点 **移除**——回到"点击上传"

**出问题怎么办:**

| 现象 | 可能原因 | 修法 |
|------|----------|------|
| 选择器不弹 | `<input>` 没在 `<label>` 里，或 `display: none` 加在 label 上 | 确保 `<input type="file">` 在 `<label>` 内、label 有 `cursor: pointer` |
| 选完图不显示 | 没调 `setVariable`，或变量 ID 拼错 | 确认变量定义里的 ID 跟代码完全一样:`player-avatar` |
| 同一文件第二次没反应 | 处理结束没 `e.target.value = ""` | handler 末尾必须重置 value |
| 上传后页面变卡 | 图太大 | 加上面的 `compressToDataUrl` 步骤 |
| AI 开始输出乱七八糟的 `[player-avatar: ...]` 指令 | 变量没加行为规则 | 回去打开变量、把第 1 步那段规则贴上 |

---

## 速查

| 想干嘛 | 怎么做 |
|--------|--------|
| 让玩家选图 | `<label>` 里包一个 `<input type="file" accept="image/*">` |
| 文件 → 字符串 | `new FileReader(); reader.readAsDataURL(file)` |
| 持久化所选图 | `api.setVariable("id", dataUrl)`——任何长度字符串都能塞进去 |
| 渲染出来 | `<img src={dataUrl}>` 或 `background: url(${dataUrl})` |
| 同文件能再选 | handler 末尾 `e.target.value = ""` |
| 控制存储大小 | 存之前过一遍 `canvas.toDataURL("image/jpeg", 0.85)` |
| 玩家移除 | `api.setVariable("id", "")` |

---

## 什么时候**不要**用这个套路

| 场景 | 用什么替代 |
|------|------------|
| 图片随世界发货(永远都是同一张) | 编辑器 **素材** 标签 + `@asset:xxx` |
| 大量大图，不想塞进每个玩家的会话 bundle | **素材** 标签——传一次、走 CDN |
| 图片需要给同房间其他玩家看到 | **素材** 标签——变量是按会话隔离的，素材是按世界共享的 |
| AI 要*看到*图(视觉模型) | 即将到来:聊天消息附件。当前先在另一个变量里存图的描述，让 AI 反应描述 |

划界很简单:**创作者预先选好的内容**走素材;**玩家运行时产生的内容**走变量。

---

::: tip 这是配方 #11
*浏览器文件 API → 字符串变量* 这个套路对其他类型也成立:短音频(`readAsDataURL` + `<audio src={dataUrl}>`)、小段文本(`readAsText`)、JSON 导入。每当你需要让玩家把数据*带进*世界时，都是这个形状。
:::

</div>
