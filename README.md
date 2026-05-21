# RosyPilot

为 Obsidian 法律写作场景打造的 AI 辅助插件。

AI-powered inline completions and legal workflow commands for Obsidian.

RosyPilot 帮助你在 Obsidian 中更快起草中文法律文书，提供两大核心能力：

RosyPilot helps you write Chinese legal documents faster in Obsidian. It offers two complementary capabilities:

- **行内补全** — 根据光标处的 Markdown 上下文生成幽灵文字，按 `Tab` 接受。
- **法律命令** — 按需查询法条、案例，校验法律引用，将结果插入文档。

- **Inline completions** — ghost text that predicts your next sentence, tailored to the Markdown context at the cursor. Press `Tab` to accept.
- **Legal commands** — on-demand tools that look up statute text and cases, verify legal references, and insert results at the cursor.

> 基于 [Markpilot](https://github.com/taichimaeda/markpilot) 开发（MIT，Copyright © 2024 Taichi Maeda）。
>
> Built on top of [Markpilot](https://github.com/taichimaeda/markpilot) (MIT License, Copyright © 2024 Taichi Maeda).

---

## 安装 / Installation

**插件商店（推荐）：** 设置 → 第三方插件 → 浏览 → 搜索 **RosyPilot** → 安装并启用。

**Community plugins (recommended):** Settings → Community plugins → Browse → search **RosyPilot** → Install → Enable.

**手动安装：** 从[最新 Release](https://github.com/zh-xx/rosypilot/releases/latest) 下载 `main.js`、`manifest.json`、`styles.css`，复制到 `<Vault>/.obsidian/plugins/rosypilot/`，然后在设置中启用。

**Manual:** Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/zh-xx/rosypilot/releases/latest), copy them into `<vault>/.obsidian/plugins/rosypilot/`, then enable the plugin.

---

## 快速开始 / Quick Start

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 获取 API Key。
2. 打开 **设置 → RosyPilot → 服务商 → DeepSeek**，填入 Key，点击**获取模型列表**。
3. 在**行内补全**中，服务商选 **DeepSeek**，模型选 `deepseek-v4-flash`。
4. 开始写作，幽灵文字出现后按 `Tab` 接受，`Esc` 忽略。

1. Get an API key from [DeepSeek Open Platform](https://platform.deepseek.com/).
2. Open **Settings → RosyPilot → Providers → DeepSeek**, paste your key, and click **Fetch Models**.
3. Under **Inline completions**, set Provider to **DeepSeek** and Model to `deepseek-v4-flash`.
4. Start writing — ghost text appears after a short pause. Press `Tab` to accept, `Esc` to dismiss.

---

## 功能 / Features

### 行内补全 / Inline Completions

停止输入片刻后，插件自动根据光标处的 Markdown 上下文生成续写建议：

The plugin recognises 6 Markdown context types and applies a dedicated prompting strategy for each:

| 上下文 / Context | 补全策略 / Behaviour |
| --- | --- |
| `heading` | 基于文档大纲结构（章节层级）补全标题 / Completes heading text based on document outline structure |
| `paragraph` | 提取祖先标题链定位章节，滑动窗口截取上下文 / Anchors to the ancestor heading chain; uses a sliding context window |
| `list-item` | 识别完整列表结构，仅续写当前项，不生成新项 / Continues only the current item — never generates new list items |
| `block-quote` | 续写引用块原文，不加入新论述 / Continues the quoted text in its own voice |
| `code-block` | 识别编程语言，生成对应代码 / Detects the language and generates matching code |
| `math-block` | 仅输出 LaTeX / Outputs LaTeX only |

### 法律命令 / Legal Commands

三条法律命令开箱即用。在 **设置 → 核心插件** 中开启**斜杠命令**后可用 `/` 触发，也可随时通过 `Cmd/Ctrl+P` 调用。

Three legal commands are available. Enable **Settings → Core plugins → Slash commands** to trigger them with `/`, or run them from `Cmd/Ctrl+P`.

#### `/补全法条` — Complete Legal Provision

将光标置于法条引用之后（如 `《民法典》第五百一十一条`），触发命令。插件识别法规名称和条文编号，查询数据源，在右侧面板展示原文；可选**直接插入**或**匹配上下文改写后插入**。

Place the cursor after a provision reference such as `《民法典》第五百一十一条`, then trigger the command. The plugin identifies the statute and article number, queries your configured data source, and shows the full article text in a side panel. From there you can **insert the provision** directly or **insert adapted** to an LLM-rewritten version that fits your sentence.

#### `/补全案例` — Complete Legal Case

将光标置于案例引用之后（如 `（2023）京03民终4521号`），触发命令。插件按案号精确查询或按争议焦点检索，在右侧面板展示结果，支持同样的插入方式。

Place the cursor after a case reference such as `（2023）京03民终4521号`, then trigger the command. The plugin looks up the case by number or searches by legal issue, and shows the result in the side panel with the same insert options.

#### `/幻觉校验` — Verify Legal References

自动从全文（或当前选区）抽取所有法条与案例引用，逐条与权威来源比对，在右侧面板以卡片形式展示结果，每张卡片包含：

Automatically extracts all statute and case citations from the document (or the current selection) and verifies each one against authoritative sources. Results appear in the side panel as cards, each showing:

- **判定 badge** — 一致 / 不一致 / 无法判断 / 跳过
- **Verdict badge** — Consistent / Inconsistent / Unknown / Skipped
- **幻觉类型标签** — 法规不存在 / 条文号不存在 / 内容严重错误 / 理解偏差 / 内容吻合 / 无法核实
- **Hallucination type tag** — Law does not exist / Clause not found / Content severely incorrect / Misapplication / Content consistent / Unverifiable
- **权威条文** — 数据库中的原文 / **Authoritative text** — the exact text from the legal database
- **比对说明与要点** — API 语义比对结果 / **Comparison note and key points** — the API's semantic comparison result
- **定位** — 点击后编辑器自动滚动至对应文字并高亮标记 / **Locate** — click to scroll to and highlight the cited text in the editor
- **AI 评述** — 点击后由 LLM 生成对幻觉类型和错误程度的自然语言评述 / **AI Commentary** — click to generate an LLM-written explanation of the specific hallucination and its severity

**触发方式 / Trigger options:**

| 方式 / Method | 选区支持 / Selection support |
| --- | --- |
| 斜杠命令 `/幻觉校验` / Slash command | 仅全文 / Full document only |
| 命令面板 `Cmd+P` / Command palette | 保留选区，只校验选区 / Preserves selection — verifies selection only |
| 右键菜单 / Right-click context menu | 无选区 → 全文；有选区 → 只校验选区 / No selection → full document; selection → selection only |

`/补全法条` 与 `/补全案例` 支持以下检索策略：

The retrieval strategy controls which sources are used for `/补全法条` and `/补全案例`:

| 策略 / Strategy | 说明 / Behaviour |
| --- | --- |
| `auto`（默认 / default） | 元典优先；不可用时自动回退到 Tavily 联网检索 / Yuandian first; falls back to web search (Tavily) if no result |
| `structured-first` | 仅用元典 / Yuandian only |
| `web-first` | 仅用 Tavily 联网检索 / Web search (Tavily) only |
| `all` | 同时使用两者，面板展示全部结果 / Both sources; all results shown in the panel |

---

## 配置 / Configuration

### 行内补全 / Inline Completions

| 设置项 / Setting | 默认值 / Default | 说明 / Notes |
| --- | --- | --- |
| 服务商 / Provider | DeepSeek | 支持 DeepSeek、火山引擎（豆包）/ DeepSeek or Volcengine (Doubao) |
| 模型 / Model | `deepseek-v4-flash` | 填入 API Key 后自动拉取 / Fetched automatically after entering an API key |
| 最大 Token 数 / Max tokens | 64 | 每次补全的最大长度 / Length of each suggestion |
| 等待时间 / Wait time | 500 ms | 停止输入后触发补全的延迟 / Delay after typing stops |
| 上下文窗口 / Context window | 512 chars | 光标前后截取的字符数 / Characters captured before and after the cursor |
| 接受快捷键 / Accept key | `Tab` | 可自定义 / Configurable |
| 月度 Token 上限 / Monthly token limit | 10,000,000 | 达到上限后自动停止 / Completions stop when reached |

**火山引擎配置：** 在[控制台](https://console.volcengine.com/ark)创建推理接入点，填入 API Key 后将接入点 ID 作为模型名使用。

**Volcengine (Doubao):** get an API key from the [Volcengine console](https://console.volcengine.com/ark), create an inference endpoint, then enter the key under **Providers → Volcengine** and choose your endpoint ID as the model.

### 法律命令 / Legal Commands

| 设置项 / Setting | 说明 / Notes |
| --- | --- |
| 元典 API Key / Yuandian API Key | 结构化中国法律数据库（[open.chineselaw.com](https://open.chineselaw.com/)）；用于法条查询、案例查询及幻觉校验 / Structured Chinese legal database; used for provision lookup, case lookup, and hallucination verification |
| Tavily API Key | 联网检索数据源（[tavily.com](https://tavily.com)）/ Web search fallback |
| 默认检索策略 / Default retrieval strategy | `auto` / `structured-first` / `web-first` / `all` |
| 命令级覆盖 / Per-command override | 为特定命令单独设置检索策略 / Override the default strategy for a specific command |

---

## 注意事项 / Caveats

- 仅支持桌面端，暂不支持移动端。/ **Desktop only** — mobile is not supported.
- 文档片段会发送至所选 AI 服务商生成补全，请勿在保密文件中使用，并查阅所用服务商的数据政策。/ Portions of your document are sent to the AI provider to generate completions. Avoid using the plugin with confidential documents and review your provider's data policy.
- API 费用自理，建议设置月度 Token 上限并在服务商平台监控用量。/ API costs are your responsibility. Use the monthly token limit and monitor usage on your provider's platform.

---

## 常见问题 / FAQ

**按 `Tab` 无法接受补全。** 其他插件（如 Obsidian Outliner）可能优先捕获了 `Tab` 键。可在设置中更改接受快捷键，或将 RosyPilot 设为最后启用的插件。

**`Tab` does not accept the completion.** Another plugin (e.g. Obsidian Outliner) may be capturing the key first. Change the accept keybinding in settings, or enable RosyPilot after the conflicting plugin.

**文档中出现 `</INSERT>` 标签。** 已在 v0.2.0 修复，请更新至最新版本。

**Strange `</INSERT>` tags appear in my document.** Fixed in v0.2.0. Update to the latest version.

**补全没有触发。** 检查行内补全总开关是否开启、月度 Token 是否达到上限，以及当前文件是否匹配了忽略规则。

**Completions are not triggering.** Check that inline completions are enabled, you have not hit the monthly token limit, and the file does not match an ignored glob pattern.

---

## 致谢 / Acknowledgements

- [Markpilot](https://github.com/taichimaeda/markpilot) — original plugin by Taichi Maeda
- [codemirror-copilot](https://github.com/asadm/codemirror-copilot) — CodeMirror extension reference

[CHANGELOG.md](https://github.com/zh-xx/rosypilot/blob/main/CHANGELOG.md) · MIT License — Copyright © 2026 JiCheng
