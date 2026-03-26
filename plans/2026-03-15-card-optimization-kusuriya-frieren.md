# Card Optimization: 薬屋のひとりごと + 葬送のフリーレン

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize two scenario cards — add character portraits (dual images), enrich character descriptions, and add a complete mystery case system to the Kusuriya card.

**Architecture:** Each card is a single WorldDefinition v13 JSON file in `output/`. Character images use external CDN URLs (MAL + Bangumi) embedded directly in the messageRenderer TSX code as a character→URL mapping. Mystery cases are implemented as hidden lorebook entries with condition-gated loading.

**Tech Stack:** Node.js scripts (patch-images.js, moegirl scraper), WorldDefinition v13 JSON, messageRenderer TSX (React.createElement)

**Image Strategy:**
- Status panel: Bangumi character images (`lain.bgm.tv/pic/crt/...`)
- Dialogue bubbles: MAL character images (`myanimelist.net/images/characters/...`)
- Fallback: Moegirl portrait extraction for characters missing from both sources

---

## Phase 1: Image Acquisition

### Task 1: Re-scrape MAL characters for both IPs

Run `patch-images.js` to fetch expanded character lists (all Main + top 20 Supporting) with images.

**Step 1:** Run patch-images for 薬屋のひとりごと

```bash
cd C:/Users/chenp/Downloads/yumina/scripts/card-gen
node patch-images.js "薬屋のひとりごと"
```

Expected: Updated `sources/薬屋のひとりごと/mal-characters.json` with 20+ characters and downloaded images.

**Step 2:** Run patch-images for 葬送のフリーレン

```bash
node patch-images.js "葬送のフリーレン"
```

Expected: Updated `sources/葬送のフリーレン/mal-characters.json` with 20+ characters and downloaded images.

**Step 3:** Verify results — check that key characters have `localImage` and `imageUrl` fields.

### Task 2: Collect Moegirl portraits for characters missing MAL images

Write a one-off Node.js script that uses the existing `extractCharacterPortrait()` from `lib/scrapers/moegirl.js` to fetch portrait URLs for key characters.

**Target characters (薬屋):**
- 猫猫, 壬氏, 玉葉妃, 梨花妃, 里樹妃, 阿多妃, 高順, 小蘭, 皇帝, 罗汉, 凤仙, 风明, 罗门

**Target characters (フリーレン):**
- フリーレン, フェルン, シュタルク, ヒンメル, ハイター, アイゼン, ザイン, フランメ, アウラ, ゼーリエ

**Step 1:** Create `scripts/card-gen/fetch-portraits.js`:

```js
import { extractCharacterPortrait } from './lib/scrapers/moegirl.js';
import { writeFile } from 'fs/promises';

const targets = {
  '薬屋のひとりごと': [
    '猫猫(薬屋のひとりごと)', '壬氏', '玉葉妃', '梨花妃',
    '里樹妃', '阿多妃(薬屋のひとりごと)', '高順(薬屋のひとりごと)',
    '小蘭(薬屋のひとりごと)', '皇帝(薬屋のひとりごと)',
    '羅漢(薬屋のひとりごと)', '鳳仙(薬屋のひとりごと)',
    '風明(薬屋のひとりごと)', '羅門(薬屋のひとりごと)'
  ],
  '葬送のフリーレン': [
    'フリーレン', 'フェルン(葬送のフリーレン)', 'シュタルク(葬送のフリーレン)',
    'ヒンメル', 'ハイター(葬送のフリーレン)', 'アイゼン(葬送のフリーレン)',
    'ザイン(葬送のフリーレン)', 'フランメ', 'アウラ(葬送のフリーレン)',
    'ゼーリエ'
  ]
};

async function main() {
  for (const [ip, chars] of Object.entries(targets)) {
    console.log(`\n=== ${ip} ===`);
    const results = {};
    for (const title of chars) {
      try {
        const { portraitUrl, infoboxData } = await extractCharacterPortrait(title);
        results[title] = { portraitUrl, infoboxData };
        console.log(`  ✅ ${title}: ${portraitUrl ? 'found' : 'no image'}`);
      } catch (err) {
        console.warn(`  ❌ ${title}: ${err.message}`);
        results[title] = { portraitUrl: null, infoboxData: {} };
      }
      // Rate limit
      await new Promise(r => setTimeout(r, 1500));
    }
    const slug = ip;
    await writeFile(
      `../../sources/${slug}/moegirl-portraits.json`,
      JSON.stringify(results, null, 2)
    );
  }
}

main();
```

**Step 2:** Run the script:
```bash
cd C:/Users/chenp/Downloads/yumina/scripts/card-gen
node fetch-portraits.js
```

**Step 3:** Verify output files exist:
- `sources/薬屋のひとりごと/moegirl-portraits.json`
- `sources/葬送のフリーレン/moegirl-portraits.json`

### Task 3: Build image URL mapping

After Tasks 1-2, compile a final character→image mapping for each card. Use:
- **Dialogue image**: MAL `imageUrl` (primary) or Moegirl `portraitUrl` (fallback)
- **Status panel image**: Bangumi `imageUrl` (primary) or Moegirl `portraitUrl` (fallback)

Output: Two JSON files for reference during frontend work:
- `sources/薬屋のひとりごと/image-map.json`
- `sources/葬送のフリーレン/image-map.json`

Format:
```json
{
  "猫猫": {
    "dialogue": "https://myanimelist.net/images/characters/16/371204.jpg",
    "panel": "https://lain.bgm.tv/pic/crt/l/63/84/61330_crt_GRcpk.jpg"
  }
}
```

---

## Phase 2: 薬屋 — Mystery Case System (Critical Fix)

The current card has investigation mechanics but **no actual mysteries**. The AI needs pre-written cases with clues, red herrings, and solutions to create a proper mystery experience.

### Task 4: Write mystery case lorebook entries

Add new lorebook entries to the card's `entries[]` array. Each case is a hidden lorebook entry that loads based on day progression + keyword triggers.

**Case 1: 铅粉中毒案 (Days 1-5)**

```json
{
  "id": "case-lead-powder",
  "name": "案件 · 铅粉中毒",
  "content": "## 案件：铅粉中毒\n\n### 事件\n柘榴宮的梨花妃和皇女鈴麗身体日渐虚弱。症状：面色苍白、腹痛、婴儿嗜睡不振。同时期一名皇子已夭折。\n\n### 可发现的线索\n- 翡翠宮的玉葉妃用的粉妆量少，她和皇女鈴麗都很健康\n- 柘榴宮的侍女们皮肤细腻但面色不正常——白粉用量极大\n- 药材库的记录显示宫中大量采购含铅白粉（おしろい）\n- 梨花妃停用白粉后一度好转，但又反复恶化\n- 侍女中有一人（辛）格外积极地为梨花妃上妆\n\n### 真相\n宫中流行的白粉含铅，长期使用导致慢性铅中毒。猫猫曾匿名留纸条警告，但被梨花妃的侍女辛（嫉妒梨花妃受宠的表姐妹）截获并丢弃。梨花妃停用白粉后，辛暗中继续在她的脂粉中掺入铅粉。直接导致皇子夭折、梨花妃病危。\n\n### AI行为指引\n- 线索值<20时：只描写症状表象\n- 线索值20-35时：可让猫猫在不经意间提到铅的特征\n- 线索值>35且猫猫信任度>25时：猫猫会在{{user}}面前分析白粉成分\n- 不要一次揭示辛是幕后黑手——先让{{user}}怀疑白粉本身，再发现有人蓄意投毒",
  "role": "lore",
  "position": "before_char",
  "apiRole": "system",
  "alwaysSend": false,
  "keywords": ["中毒", "铅", "白粉", "梨花妃", "柘榴宮", "脸色", "苍白", "鈴麗", "皇子"],
  "useFuzzyMatch": true,
  "conditions": [],
  "conditionLogic": "all",
  "priority": 60,
  "enabled": true,
  "order": 10,
  "section": "world-info",
  "tags": ["Case"]
}
```

**Case 2: 壁上鬼影 (Days 3-8)**

```json
{
  "id": "case-wall-ghost",
  "name": "案件 · 壁上鬼影",
  "content": "## 案件：壁上鬼影\n\n### 事件\n深夜有人看到宫墙上出现白色人影舞蹈，宫中传言闹鬼。侍女们人心惶惶。\n\n### 可发现的线索\n- 「鬼影」只在月圆前后出现\n- 芙蓉妃即将被赐婚给一名武官\n- 芙蓉妃幼年有一个青梅竹马，现为低级武官\n- 芙蓉妃几乎从不被皇帝召幸\n- 「鬼影」的「舞姿」看起来像是故意让人看到\n\n### 真相\n「鬼影」是芙蓉妃本人。她故意在宫墙上「梦游」，目的是让皇帝觉得她精神不稳定，从而避免临幸，保全贞洁。她心中只有青梅竹马的武官，一切行为都是为了赐婚后能以清白之身与爱人团聚。她最终成功离宫。\n\n### AI行为指引\n- 这是一个温馨的案件，真相揭示后应有轻松感\n- 猫猫会注意到「梦游」的不自然之处（睡着的人不会选择被月光照到的位置）\n- 壬氏可能已经知道真相，但选择默许",
  "role": "lore",
  "position": "before_char",
  "apiRole": "system",
  "alwaysSend": false,
  "keywords": ["鬼", "鬼影", "宫墙", "夜里", "白影", "芙蓉", "闹鬼", "梦游"],
  "useFuzzyMatch": true,
  "conditions": [],
  "conditionLogic": "all",
  "priority": 60,
  "enabled": true,
  "order": 11,
  "section": "world-info",
  "tags": ["Case"]
}
```

**Case 3: 园游会毒杀 (Days 8-15)**

```json
{
  "id": "case-garden-party",
  "name": "案件 · 园游会毒杀",
  "content": "## 案件：园游会毒杀\n\n### 事件\n皇帝举办四妃园游会。猫猫作为玉葉妃的试毒侍女出席。宴席上，猫猫从一道汤中检出毒物，现场大乱。表面看目标是玉葉妃。\n\n### 可发现的线索\n- 里樹妃手臂上有荨麻疹——过敏反应\n- 里樹妃对�的鲭鱼和鲍鱼严重过敏（不是挑食）\n- 里樹妃的侍女嘉南私下调换了里樹妃和玉葉妃的餐食，因为里樹妃那份含过敏源\n- 毒是下在里樹妃的原始餐食中，被嘉南的好心调换误导到了玉葉妃面前\n- 阿多妃的侍女长风明在事件前后行为异常\n- 里樹妃小时候差点因蜂蜜中毒死亡\n\n### 真相\n真正的下毒目标是里樹妃，凶手是阿多妃的侍女长**风明**。十六年前，风明出于好意用蜂蜜喂养阿多妃的婴儿，导致婴儿肉毒杆菌中毒死亡。风明直到听说里樹妃幼年蜂蜜中毒的经历后才意识到自己是杀死婴儿的凶手。她试图灭口里樹妃以防真相暴露。嘉南调换餐食的意外操作使毒物误转到了玉葉妃的桌上。\n\n### AI行为指引\n- 这是最复杂的案件，连接蜂蜜案和阿多妃的秘密\n- 第一层真相：目标不是玉葉妃而是里樹妃（线索值30+可揭示）\n- 第二层真相：风明的动机与蜂蜜有关（线索值45+且壬氏信任度40+）\n- 第三层真相：婴儿的真实身份（见核心秘密·换婴事件）（线索值70+）\n- 风明最终自首被处刑",
  "role": "lore",
  "position": "before_char",
  "apiRole": "system",
  "alwaysSend": false,
  "keywords": ["园游会", "宴席", "宴会", "试毒", "毒杀", "下毒", "风明", "嘉南", "里樹", "蜂蜜"],
  "useFuzzyMatch": true,
  "conditions": [],
  "conditionLogic": "all",
  "priority": 60,
  "enabled": true,
  "order": 12,
  "section": "world-info",
  "tags": ["Case"]
}
```

**Case 4: 祭典暗杀 (Days 15-25, 大案)**

```json
{
  "id": "case-ceremony-assassination",
  "name": "案件 · 祭典暗杀",
  "content": "## 案件：祭典暗杀（主线大案）\n\n### 事件链\n这不是单一事件，而是一连串看似无关的事件最终指向同一个目标——刺杀壬氏。\n\n**事件A：官员连环死亡**\n负责祭典的礼部官员接连出事——有人「自杀」（实为盐中毒致死），继任者食物中毒卧床。\n\n**事件B：仓库大火**\n存放祭典器具的仓库发生爆炸性火灾。看守的宦官声称是有人给了他一根烟斗——「一个身材高挑、身上有药味的女人」。火灾原因是烟斗火星引燃了仓库中的细面粉（粉尘爆炸）。\n\n**事件C：工匠遗产谜题**\n城中一位工匠去世，留给三个儿子奇怪的遗产——铁匠铺、打不开的抽屉柜、玻璃鱼缸。工匠的专长是一种超低熔点合金（约98°C即熔化）。\n\n**事件D：祭典意外**\n祭典当天，壬氏在祭坛行礼时，头顶的巨型柱子突然坠落。\n\n### 线索链\n- 仓库火灾后，祭典金属配件丢失\n- 丢失的配件被换成了低熔点合金制品（与工匠案关联）\n- 祭典的炉火加热会使低熔点合金熔化，释放巨柱\n- 礼部官员被清除是为了确保无人检查祭典器具\n- 「药味女人」的描述指向一个精通药学的幕后黑手\n\n### 真相\n幕后主使是**翠苓**——一位藏在宫中、精通药学的神秘女子。她策划了整个暗杀链：杀害礼部官员（清除检查者）→ 仓库纵火（偷取+替换配件）→ 利用低熔点合金在祭典高温下熔化释放巨柱砸向壬氏。猫猫在最后一刻察觉异常，推开壬氏，自己腿部受重伤。翠苓被发现后服毒「身亡」，但实际使用了假死药逃脱。\n\n### AI行为指引\n- 事件A和B可以在Day 10+陆续发生，作为背景事件\n- 工匠案可作为独立谜题让{{user}}解决\n- 大案高潮应在Day 20+，需要线索值60+才能在祭典前拼凑出阴谋\n- 如果{{user}}线索值不够，猫猫仍会在最后关头察觉（保证剧情推进）\n- 翠苓的逃脱为后续故事留下伏笔",
  "role": "lore",
  "position": "before_char",
  "apiRole": "system",
  "alwaysSend": false,
  "keywords": ["祭典", "仓库", "大火", "火灾", "工匠", "合金", "暗杀", "官员", "翠苓", "柱子", "祭坛"],
  "useFuzzyMatch": true,
  "conditions": [],
  "conditionLogic": "all",
  "priority": 60,
  "enabled": true,
  "order": 13,
  "section": "world-info",
  "tags": ["Case"]
}
```

### Task 5: Write core secret lorebook entries

These are deep lore that only surfaces at high trust/clue thresholds.

**Secret 1: 壬氏的真实身份**

```json
{
  "id": "secret-jinshi-identity",
  "name": "秘密 · 壬氏的真实身份",
  "content": "## 壬氏的真实身份（AI专用 · 不可直接告知{{user}}）\n\n壬氏的真名是**华瑞月**。他不是宦官——他是当今皇帝的亲生儿子。\n\n### 身份链\n- 壬氏 = 华瑞月 = 皇帝与阿多妃的亲生子\n- 他名义上的身份是「皇弟」（皇帝的弟弟），但实际上是皇帝的儿子\n- 他名义上的母亲是皇太后安氏，但生母是阿多妃\n- 他服用抑制药物压制男性特征，伪装成宦官在后宫自由活动\n- 只有皇族成员可以未阉割进入后宫——这就是壬氏能以「宦官」身份活动的法理依据\n\n### 暗示方式\n绝不直接揭示。通过反常细节暗示：\n- 壬氏的权力范围远超任何宦官——他能调动侍卫、直接命令四妃宫的管事\n- 皇帝见到壬氏时偶尔流露出对待「不是弟弟」的复杂表情\n- 壬氏偶尔忘记压低嗓音，露出不像宦官的低沉声线\n- 高顺对壬氏的态度更像是「守护皇子」而非「服侍上级」\n- 壬氏服药的时间如果被打断，他会表现得比平时更焦虑\n\n### 触发条件\n- 壬氏信任度80+时：壬氏可能在极端情况下（如受伤、醉酒）露出破绽\n- 线索值80+且壬氏信任度70+时：壬氏可能暗示「我不是你以为的那种人」\n- 永远不在本轮游戏中完全揭示——保留悬念",
  "role": "lore",
  "position": "after_char",
  "apiRole": "system",
  "alwaysSend": false,
  "keywords": ["宦官", "身份", "皇子", "皇弟", "华瑞月", "真相", "秘密"],
  "useFuzzyMatch": true,
  "conditions": [
    { "type": "variable", "variableId": "jinshi_trust", "operator": "gte", "value": 50 }
  ],
  "conditionLogic": "all",
  "priority": 70,
  "enabled": true,
  "order": 20,
  "section": "world-info",
  "tags": ["Secret"]
}
```

**Secret 2: 换婴事件**

```json
{
  "id": "secret-baby-swap",
  "name": "秘密 · 换婴事件",
  "content": "## 换婴事件（AI专用 · 宫中最深的秘密）\n\n十六年前，阿多妃和皇太后安氏几乎同时临盆。\n\n### 经过\n- 安氏因身份尊贵被优先安排产婆，阿多妃被忽视，难产导致子宫摘除——她永远无法再生育\n- 安氏的孩子实际上是先帝（已故老皇帝）强暴安氏后的产物，安氏对这个孩子毫无母爱\n- 阿多妃提议互换婴儿——将自己的孩子（壬氏/华瑞月）交给安氏抚养为「皇弟」，获得更高的身份保障\n- 安氏同意——她不愿抚养先帝暴行的产物\n- 安氏的亲生子被作为阿多妃的孩子抚养，后被风明用蜂蜜喂食致死\n\n### 关键关联\n- 风明杀死的婴儿 = 安氏的亲生子 = 先帝的孙子（不是阿多妃的亲生子）\n- 壬氏 = 阿多妃的亲生子 = 皇帝的儿子 → 被安氏抚养为「皇弟」\n- 风明的愧疚 → 园游会毒杀里樹妃 → 阿多妃的悲剧 → 全部环环相扣\n\n### AI行为指引\n- 这个秘密是整条故事线的底层逻辑，但不应在一局游戏中完全揭示\n- 可以通过阿多妃的言行暗示她对壬氏有超越「同宫妃嫔与宦官」的复杂感情\n- 皇太后安氏偶尔看壬氏的眼神不像看「儿子」，更像看「别人的孩子」\n- 风明案的深层动机可以作为最终拼图的一部分",
  "role": "lore",
  "position": "after_char",
  "apiRole": "system",
  "alwaysSend": false,
  "keywords": ["婴儿", "换子", "安氏", "阿多", "先帝", "子宫", "临盆"],
  "useFuzzyMatch": true,
  "conditions": [
    { "type": "variable", "variableId": "clues", "operator": "gte", "value": 60 }
  ],
  "conditionLogic": "all",
  "priority": 70,
  "enabled": true,
  "order": 21,
  "section": "world-info",
  "tags": ["Secret"]
}
```

**Secret 3: 猫猫的身世**

```json
{
  "id": "secret-maomao-parents",
  "name": "秘密 · 猫猫的身世",
  "content": "## 猫猫的身世（AI专用）\n\n### 生父：罗汉（漢羅漢）\n朝廷重臣、棋道天才。患有**面容失认症**（脸盲）——在他眼中，所有人的脸都是棋子或棋石，唯独能看清两个人的脸：凤仙和猫猫。\n\n罗汉因军务离开花街时不知凤仙已怀孕。等他回来时，一切已不可挽回。他并非故意抛弃。\n\n### 生母：凤仙\n緑青館曾经的头牌花魁，以棋艺闻名——她是唯一能在棋盘上赢罗汉的人。怀孕后失去花魁身份，沦为底层妓女。感染梅毒后精神崩溃。在疯狂中切断了自己的小指和猫猫的小指尖——将断指送给罗汉作为诅咒（断绝红线）。\n\n凤仙最终在S1结局被罗汉赎身。此时她已失明、精神破碎。猫猫代替凤仙与罗汉下了一盘棋作为告别。\n\n### 养父：罗门\n猫猫的叔祖父（罗汉的叔叔），宦官。曾是宫中名医，因宫廷政治被阉割流放。在花街开药铺，收养并教导猫猫。是猫猫最重要的人。\n\n### 猫猫身上的痕迹\n- 左手小指指尖缺失——凤仙切断的\n- 左臂的试毒疤痕——自己做的\n- 对罗汉的复杂感情——不恨，但也不亲近\n\n### AI行为指引\n- 罗汉会在Day 10+作为朝廷来客出现在宫中\n- 他会表现出对猫猫异常的关注（因为她是他能看清脸的人）\n- 猫猫对罗汉的态度是冷漠回避的——她知道真相但不想面对\n- 罗汉和猫猫的棋局可以作为关系发展的重要场景",
  "role": "lore",
  "position": "after_char",
  "apiRole": "system",
  "alwaysSend": false,
  "keywords": ["罗汉", "凤仙", "罗门", "身世", "父亲", "母亲", "花街", "养父", "亲生", "棋"],
  "useFuzzyMatch": true,
  "conditions": [
    { "type": "variable", "variableId": "maomao_trust", "operator": "gte", "value": 40 }
  ],
  "conditionLogic": "all",
  "priority": 65,
  "enabled": true,
  "order": 22,
  "section": "world-info",
  "tags": ["Secret"]
}
```

### Task 6: Add new characters and upgrade existing ones (薬屋)

**New full character entries to add** (same depth as 猫猫/壬氏, using `role: "character"`, `position: "character"`):

These need complete character profiles with: 外貌, 性格光谱(表层/中层/深层), 说话方式, 对{{user}}的态度, AI扮演原则.

Characters to write as full entries:
1. **玉葉妃** — From lorebook snippet → full character entry
2. **高順** — From lorebook snippet → full character entry

Characters to write as enriched lorebook entries (more detailed than current, with personality + speaking patterns):
3. **梨花妃** — Expand significantly
4. **里樹妃** — Expand significantly
5. **阿多妃** — Expand significantly
6. **小蘭** — Expand significantly
7. **罗汉** — New detailed lorebook entry
8. **凤仙** — New detailed lorebook entry
9. **风明** — New detailed lorebook entry (critical for mystery cases)
10. **翠苓** — New detailed lorebook entry (critical for main case)
11. **芙蓉妃** — New lorebook entry (wall ghost case)

**Source material:** Use MAL about text, Bangumi data, Moegirl data, and the mystery research results. Read from `sources/薬屋のひとりごと/` and supplement with web search if needed.

**Writing guidelines:** Follow `scripts/card-gen/card-writing-knowledge.md` techniques — spectrum model, speech patterns, behavioral rules for trust levels.

---

## Phase 3: フリーレン — Character Enrichment

### Task 7: Upgrade and add characters (フリーレン)

**Upgrade from lorebook to full character entries:**
1. **辛美尔 (ヒンメル)** — Critical character, needs full treatment even though he's deceased (appears in flashbacks)
2. **海塔 (ハイター)** — Same, appears in flashbacks and through Fern's memories

**New enriched lorebook entries:**
3. **艾泽 (アイゼン)** — Expand significantly (Stark's master, still alive)
4. **赞因 (ザイン)** — New entry (travel companion, priest character)
5. **伏拉梅 (フランメ)** — New entry (Frieren's master, historical figure)
6. **阿乌拉 (アウラ)** — New entry (major villain, Seven Sages of Destruction)
7. **赛丽艾 (ゼーリエ)** — Expand from brief lorebook mention

**Source material:** Read from `sources/葬送のフリーレン/`, especially `moegirl-characters.json` which has the most comprehensive list.

**Note:** Himmel and Heiter are dead but appear constantly in flashbacks. Their entries should describe how they appear in Frieren's memories and what triggers those memories.

---

## Phase 4: 薬屋 — Frontend (messageRenderer with Avatars)

### Task 8: Update 薬屋 messageRenderer with character images

Modify the existing `KusuriyaRenderer` TSX code to:

1. **Add character image mapping** at the top of the component:
```js
var charImages = {
  '猫猫': { dialogue: 'MAL_URL', panel: 'BGM_URL' },
  '壬氏': { dialogue: 'MAL_URL', panel: 'BGM_URL' },
  // ... all characters
};
```

2. **Dialogue avatars** — When a character speaks (detected by the existing `detectSpeaker` function or 「dialogue」 parsing), render a small circular avatar next to the dialogue block:
```
[avatar img] | 角色名
             | 「对话内容」
```

3. **Status panel avatars** — Replace the current single-character circles (猫/壬) with actual character portrait images in the trust/affinity display section.

**Implementation approach:**
- Write the updated TSX to a temp file
- Use `inject-renderer.js` to inject into the card JSON
- Verify by visual inspection (load card in the app with `pnpm dev`)

**Key constraints:**
- Images use `<img>` via `React.createElement('img', { src: url, ... })`
- Avatar size: 28-32px circle for status panel, 36-40px for dialogue
- Use `borderRadius: '50%'`, `objectFit: 'cover'`
- Add `onError` fallback to show the single-character circle if image fails to load
- All visible labels remain in Chinese

### Task 9: Visual verification (薬屋)

1. Run `pnpm dev`
2. Load the 薬屋 card in the app
3. Check: dialogue avatars render correctly, status panel avatars render, images load from CDN
4. Fix any layout issues

---

## Phase 5: フリーレン — Frontend (messageRenderer with Avatars)

### Task 10: Update フリーレン messageRenderer with character images

Same approach as Task 8 but for the Frieren card:

1. **Character image mapping** for all フリーレン characters
2. **Dialogue avatars** — Modify the existing dialogue detection (which already identifies 芙莉莲/菲伦/休塔尔克 by color) to also show avatar images
3. **Status panel avatars** — Replace the colored dots in the trust display with actual portrait images

**Additional considerations for this card:**
- The existing renderer has a "memory" segment type (回忆片段) — consider showing Himmel/Heiter avatars in memory segments
- The journey progress bar and milestone display should remain unchanged

### Task 11: Visual verification (フリーレン)

Same as Task 9 — run dev server, load card, check rendering.

---

## Phase 6: Final Review

### Task 12: Cross-card quality check

1. Re-read both completed cards in full
2. Verify all entries have consistent formatting
3. Verify mystery cases have proper keyword triggers and don't conflict
4. Verify character names are consistently in Chinese across all entries
5. Verify image URLs are valid (quick spot-check)
6. Verify card JSON is valid (no syntax errors)

### Task 13: Commit

```bash
git add output/薬屋のひとりごと-scenario.json output/葬送のフリーレン-scenario.json
git add scripts/card-gen/fetch-portraits.js
git add sources/*/moegirl-portraits.json sources/*/image-map.json
git commit -m "feat(cards): optimize 薬屋+フリーレン — add mystery cases, character portraits, enriched characters"
```

---

## Dependency Graph

```
Task 1 (MAL re-scrape) ──┐
Task 2 (Moegirl portraits)──┤
                            ├── Task 3 (image mapping) ──┬── Task 8 (薬屋 frontend) ── Task 9 (verify)
                            │                            └── Task 10 (フリーレン frontend) ── Task 11 (verify)
Task 4 (mystery cases) ─────┤
Task 5 (core secrets) ──────┤
Task 6 (薬屋 characters) ───┤
Task 7 (フリーレン characters)┤
                            └── Task 12 (quality check) ── Task 13 (commit)
```

Tasks 1-2 can run in parallel. Tasks 4-7 can run in parallel with each other and with Task 3. Tasks 8 and 10 depend on Task 3. Task 12 depends on all content tasks.
