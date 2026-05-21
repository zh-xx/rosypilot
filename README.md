# RosyPilot

**AI-powered inline completions and legal workflow commands for Obsidian**

RosyPilot helps you write Chinese legal documents faster in Obsidian. It offers two complementary capabilities:

- **Inline completions** — ghost text that predicts your next sentence, tailored to the Markdown context at the cursor. Press `Tab` to accept.
- **Legal commands** — on-demand tools that look up statute text and cases, verify legal references, and insert results at the cursor.

> Built on top of [Markpilot](https://github.com/taichimaeda/markpilot) (MIT License, Copyright © 2024 Taichi Maeda).

---

## Installation

**Community plugins (recommended):** Settings → Community plugins → Browse → search **RosyPilot** → Install → Enable.

**Manual:** Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/zh-xx/rosypilot/releases/latest), copy them into `<vault>/.obsidian/plugins/rosypilot/`, then enable the plugin.

---

## Quick Start

1. Get an API key from [DeepSeek Open Platform](https://platform.deepseek.com/).
2. Open **Settings → RosyPilot → Providers → DeepSeek**, paste your key, and click **Fetch Models**.
3. Under **Inline completions**, set Provider to **DeepSeek** and Model to `deepseek-v4-flash`.
4. Start writing — ghost text appears after a short pause. Press `Tab` to accept, `Esc` to dismiss.

---

## Features

### Inline Completions

The plugin recognises 6 Markdown context types and applies a dedicated prompting strategy for each:

| Context | Behaviour |
| --- | --- |
| `heading` | Completes heading text based on document outline structure |
| `paragraph` | Anchors to the ancestor heading chain; uses a sliding context window |
| `list-item` | Continues only the current item — never generates new list items |
| `block-quote` | Continues the quoted text in its own voice |
| `code-block` | Detects the language and generates matching code |
| `math-block` | Outputs LaTeX only |

### Legal Commands

Three legal commands are available. Enable **Settings → Core plugins → Slash commands** to trigger them with `/`, or run them from `Cmd/Ctrl+P`.

#### `/补全法条` — Complete Legal Provision

Place the cursor after a provision reference such as `《民法典》第五百一十一条`, then trigger the command. The plugin identifies the statute and article number, queries your configured data source, and shows the full article text in a side panel. From there:

- **Insert provision** — injects the article heading and full text as ghost text
- **Insert adapted** — asks the LLM to rewrite the provision to fit your sentence, then injects it

#### `/补全案例` — Complete Legal Case

Place the cursor after a case reference such as `（2023）京03民终4521号`, then trigger the command. The plugin looks up the case by number or searches by legal issue, and shows the result in the side panel with the same insert options.

#### `/幻觉校验` — Verify Legal References

Automatically extracts all statute and case citations from the document (or the current selection) and verifies each one against authoritative sources. Results appear in the side panel as cards, each showing:

- **Verdict badge** — Consistent / Inconsistent / Unknown / Skipped
- **Hallucination type tag** — Law does not exist / Clause not found / Content severely incorrect / Misapplication / Content consistent / Unverifiable
- **Authoritative text** — the exact text from the legal database
- **Comparison note and key points** — the API's semantic comparison result
- **Locate** — click to scroll to and highlight the cited text in the editor
- **AI Commentary** — click to generate an LLM-written explanation of the specific hallucination and its severity

**Trigger options:**

| Method | Selection support |
| --- | --- |
| Slash command `/幻觉校验` | Full document only |
| Command palette `Cmd+P` | Preserves selection — verifies selection only |
| Right-click context menu | No selection → full document; selection → selection only |

The retrieval strategy controls which sources are used for `/补全法条` and `/补全案例`:

| Strategy | Behaviour |
| --- | --- |
| `auto` *(default)* | Yuandian first; falls back to web search (Tavily) if no result |
| `structured-first` | Yuandian only |
| `web-first` | Web search (Tavily) only |
| `all` | Both sources; all results shown in the panel |

---

## Configuration

### Inline Completions

| Setting | Default | Notes |
| --- | --- | --- |
| Provider | DeepSeek | DeepSeek or Volcengine (Doubao) |
| Model | `deepseek-v4-flash` | Fetched automatically after entering an API key |
| Max tokens | 64 | Length of each suggestion |
| Wait time | 500 ms | Delay after typing stops |
| Context window | 512 chars | Characters captured before and after the cursor |
| Accept key | `Tab` | Configurable |
| Monthly token limit | 10,000,000 | Completions stop when reached |

**Volcengine (Doubao):** get an API key from the [Volcengine console](https://console.volcengine.com/ark), create an inference endpoint, then enter the key under **Providers → Volcengine** and choose your endpoint ID as the model.

### Legal Commands

| Setting | Notes |
| --- | --- |
| Yuandian API Key | Structured Chinese legal database ([open.chineselaw.com](https://open.chineselaw.com/)); used for provision lookup, case lookup, and hallucination verification |
| Tavily API Key | Web search fallback; get a key at [tavily.com](https://tavily.com) |
| Default retrieval strategy | `auto` / `structured-first` / `web-first` / `all` |
| Per-command override | Override the default strategy for a specific command |

---

## Caveats

- **Desktop only** — mobile is not supported.
- Portions of your document are sent to the AI provider to generate completions. Avoid using the plugin with confidential documents and review your provider's data policy.
- API costs are your responsibility. Use the monthly token limit and monitor usage on your provider's platform.

---

## FAQ

**`Tab` does not accept the completion.**
Another plugin (e.g. Obsidian Outliner) may be capturing the key first. Change the accept keybinding in settings, or enable RosyPilot after the conflicting plugin.

**Strange `</INSERT>` tags appear in my document.**
Fixed in v0.2.0. Update to the latest version.

**Completions are not triggering.**
Check that inline completions are enabled, you have not hit the monthly token limit, and the file does not match an ignored glob pattern.

---

## Changelog

See [CHANGELOG.md](https://github.com/zh-xx/rosypilot/blob/main/CHANGELOG.md).

## Acknowledgements

- [Markpilot](https://github.com/taichimaeda/markpilot) — original plugin by Taichi Maeda
- [codemirror-copilot](https://github.com/asadm/codemirror-copilot) — CodeMirror extension reference

## License

MIT License — Copyright © 2026 JiCheng

---
---

# RosyPilot（中文）

**为 Obsidian 法律写作场景打造的 AI 辅助插件**

RosyPilot 帮助你在 Obsidian 中更快起草中文法律文书，提供两大核心能力：

- **行内补全** — 根据光标处的 Markdown 上下文生成幽灵文字，按 `Tab` 接受。
- **法律命令** — 按需查询法条、案例，校验法律引用，将结果插入文档。

> 基于 [Markpilot](https://github.com/taichimaeda/markpilot) 开发（MIT，Copyright © 2024 Taichi Maeda）。

---

## 安装

**插件商店（推荐）：** 设置 → 第三方插件 → 浏览 → 搜索 **RosyPilot** → 安装并启用。

**手动安装：** 从[最新 Release](https://github.com/zh-xx/rosypilot/releases/latest) 下载 `main.js`、`manifest.json`、`styles.css`，复制到 `<Vault>/.obsidian/plugins/rosypilot/`，然后在设置中启用。

---

## 快速开始

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 获取 API Key。
2. 打开 **设置 → RosyPilot → 服务商 → DeepSeek**，填入 Key，点击**获取模型列表**。
3. 在**行内补全**中，服务商选 **DeepSeek**，模型选 `deepseek-v4-flash`。
4. 开始写作，幽灵文字出现后按 `Tab` 接受，`Esc` 忽略。

---

## 功能

### 行内补全

停止输入片刻后，插件自动根据光标处的 Markdown 上下文生成续写建议：

| 上下文 | 补全策略 |
| --- | --- |
| `heading` | 基于文档大纲结构（章节层级）补全标题 |
| `paragraph` | 提取祖先标题链定位章节，滑动窗口截取上下文 |
| `list-item` | 识别完整列表结构，仅续写当前项，不生成新项 |
| `block-quote` | 续写引用块原文，不加入新论述 |
| `code-block` | 识别编程语言，生成对应代码 |
| `math-block` | 仅输出 LaTeX |

### 法律命令

三条法律命令开箱即用。在 **设置 → 核心插件** 中开启**斜杠命令**后可用 `/` 触发，也可随时通过 `Cmd/Ctrl+P` 调用。

#### `/补全法条`

将光标置于法条引用之后（如 `《民法典》第五百一十一条`），触发命令。插件识别法规名称和条文编号，查询数据源，在右侧面板展示原文；可选**直接插入**或**匹配上下文改写后插入**。

#### `/补全案例`

将光标置于案例引用之后（如 `（2023）京03民终4521号`），触发命令。插件按案号精确查询或按争议焦点检索，在右侧面板展示结果，支持同样的插入方式。

#### `/幻觉校验`

自动从全文（或当前选区）抽取所有法条与案例引用，逐条与权威来源比对，在右侧面板以卡片形式展示结果，每张卡片包含：

- **判定 badge** — 一致 / 不一致 / 无法判断 / 跳过
- **幻觉类型标签** — 法规不存在 / 条文号不存在 / 内容严重错误 / 理解偏差 / 内容吻合 / 无法核实
- **权威条文** — 数据库中的原文
- **比对说明与要点** — API 语义比对结果
- **定位** — 点击后编辑器自动滚动至对应文字并高亮标记
- **AI 评述** — 点击后由 LLM 生成对幻觉类型和错误程度的自然语言评述

**触发方式：**

| 方式 | 选区支持 |
| --- | --- |
| 斜杠命令 `/幻觉校验` | 仅全文 |
| 命令面板 `Cmd+P` | 保留选区，只校验选区 |
| 右键菜单 | 无选区 → 全文；有选区 → 只校验选区 |

`/补全法条` 与 `/补全案例` 支持以下检索策略：

| 策略 | 说明 |
| --- | --- |
| `auto`（默认） | 元典优先；不可用时自动回退到 Tavily 联网检索 |
| `structured-first` | 仅用元典 |
| `web-first` | 仅用 Tavily 联网检索 |
| `all` | 同时使用两者，面板展示全部结果 |

---

## 配置速查

### 行内补全

| 设置项 | 默认值 | 说明 |
| --- | --- | --- |
| 服务商 | DeepSeek | 支持 DeepSeek、火山引擎（豆包） |
| 模型 | `deepseek-v4-flash` | 填入 API Key 后自动拉取 |
| 最大 Token 数 | 64 | 每次补全的最大长度 |
| 等待时间 | 500 ms | 停止输入后触发补全的延迟 |
| 上下文窗口 | 512 字符 | 光标前后截取的字符数 |
| 接受快捷键 | `Tab` | 可自定义 |
| 月度 Token 上限 | 10,000,000 | 达到上限后自动停止 |

**火山引擎配置：** 在[控制台](https://console.volcengine.com/ark)创建推理接入点，填入 API Key 后将接入点 ID 作为模型名使用。

### 法律命令

| 设置项 | 说明 |
| --- | --- |
| 元典 API Key | 结构化中国法律数据库（[open.chineselaw.com](https://open.chineselaw.com/)）；用于法条查询、案例查询及幻觉校验 |
| Tavily API Key | 联网检索数据源（[tavily.com](https://tavily.com)） |
| 默认检索策略 | `auto` / `structured-first` / `web-first` / `all` |
| 命令级覆盖 | 为特定命令单独设置检索策略 |

---

## 注意事项

- 仅支持桌面端，暂不支持移动端。
- 文档片段会发送至所选 AI 服务商生成补全，请勿在保密文件中使用，并查阅所用服务商的数据政策。
- API 费用自理，建议设置月度 Token 上限并在服务商平台监控用量。

---

## 常见问题

**按 `Tab` 无法接受补全。**
其他插件（如 Obsidian Outliner）可能优先捕获了 `Tab` 键。可在设置中更改接受快捷键，或将 RosyPilot 设为最后启用的插件。

**文档中出现 `</INSERT>` 标签。**
已在 v0.2.0 修复，请更新至最新版本。

**补全没有触发。**
检查行内补全总开关是否开启、月度 Token 是否达到上限，以及当前文件是否匹配了忽略规则。

---

[CHANGELOG.md](https://github.com/zh-xx/rosypilot/blob/main/CHANGELOG.md) · MIT License — Copyright © 2026 JiCheng
