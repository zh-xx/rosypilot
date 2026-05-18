# RosyPilot

[中文](https://github.com/zh-xx/rosypilot/blob/main/README.zh.md) | English

**AI-powered inline completions and legal workflow commands for Obsidian**

RosyPilot helps you write Chinese legal documents faster in Obsidian. It offers two complementary capabilities:

- **Inline completions** — ghost text that predicts your next sentence, tailored to the Markdown context at the cursor. Press `Tab` to accept.
- **Legal commands** — on-demand tools that look up statute text, insert it at the cursor, and adapt it to your sentence.

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
|---------|-----------|
| `heading` | Completes heading text based on document outline structure |
| `paragraph` | Anchors to the ancestor heading chain; uses a sliding context window |
| `list-item` | Continues only the current item — never generates new list items |
| `block-quote` | Continues the quoted text in its own voice |
| `code-block` | Detects the language and generates matching code |
| `math-block` | Outputs LaTeX only |

### Legal Commands

`/补全法条` (Complete Provision) is the first legal command. Trigger it when your cursor is after a provision reference like `《民法典》第五百一十一条`:

```
 / → 补全法条   or   Cmd+P → Complete Provision
```

The plugin identifies the statute and article number, queries your configured data source, and shows the full article text in a side panel. From there:

- **Insert provision** — injects the article heading and full text as ghost text
- **Insert adapted** — asks the LLM to rewrite the provision to fit your sentence, then injects it

The retrieval strategy controls which sources are used:

| Strategy | Behaviour |
|----------|-----------|
| `auto` *(default)* | Yuandian first; falls back to web search (Tavily) if no result |
| `structured-first` | Yuandian only |
| `web-first` | Web search (Tavily) only |
| `all` | Both sources; all results shown in the panel |

---

## Configuration

### Inline Completions

| Setting | Default | Notes |
|---------|---------|-------|
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
|---------|-------|
| Yuandian API Key | Structured Chinese legal database ([open.chineselaw.com](https://open.chineselaw.com/)); used for exact provision lookup |
| Tavily API Key | Web search fallback; get a key at [tavily.com](https://tavily.com) |
| Default retrieval strategy | `auto` / `structured-first` / `web-first` / `all` |
| Per-command override | Override the default strategy for a specific command |

Without a Yuandian key, `/补全法条` falls back to Tavily. Without either key, the command cannot retrieve results.

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
