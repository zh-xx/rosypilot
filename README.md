# RosyPilot

**AI-powered inline completions for legal writing in Obsidian**

RosyPilot brings context-aware AI inline completions to Obsidian, optimised for Chinese legal document authoring. When drafting contracts, legal opinions, pleadings, and similar documents, the plugin detects the Markdown context at the cursor (heading, paragraph, list, block-quote, etc.), selects the most appropriate prompting strategy for each, and displays suggestions as ghost text.

> Built on top of [Markpilot](https://github.com/taichimaeda/markpilot) (MIT License, Copyright © 2024 Taichi Maeda).

---

## Features

### Context-Aware Completions

The plugin recognises 6 Markdown context types and applies a dedicated prompting strategy for each:

| Context | Description |
|---------|-------------|
| `heading` | Completes heading content based on the document outline structure (outline / children / content) |
| `paragraph` | Extracts the ancestor heading chain for section positioning; uses a sliding window for context |
| `list-item` | Recognises the full list structure and continues only the current item — never generates new items |
| `block-quote` | Continues the quoted text as-is |
| `code-block` | Detects the programming language and generates code in that language |
| `math-block` | Outputs LaTeX code only |

### Multiple Providers

- **DeepSeek** — `deepseek-chat`, `deepseek-reasoner`, and more
- **Volcengine** — Doubao series models
- Switch providers with one click; fetch available models automatically from the settings tab

### User Experience

- Suggestions appear as ghost text; press `Tab` to accept, `Esc` to reject
- Configurable trigger delay, context window size, and accept/reject keybindings
- In-memory cache to avoid redundant requests (cleared on restart)
- Monthly token usage tracking with a bar chart and configurable limit

---

## Getting Started

### Using DeepSeek

1. Obtain an API key from the [DeepSeek Open Platform](https://platform.deepseek.com/).
2. Install RosyPilot in Obsidian.
3. Open the plugin settings:
   - **Providers > DeepSeek > API Key**: enter your API key, then click **Fetch Models**.
   - **Inline completions > Provider**: select DeepSeek.
   - **Inline completions > Model**: choose a model (recommended: `deepseek-chat`).
4. Start writing — ghost text will appear after a short delay. Press `Tab` to accept.

### Using Volcengine (Doubao)

1. Obtain an API key from the [Volcengine console](https://console.volcengine.com/ark) and create an inference endpoint.
2. Open the plugin settings:
   - **Providers > Volcengine > API Key**: enter your API key, then click **Fetch Models**.
   - **Inline completions > Provider**: select Volcengine.
   - **Inline completions > Model**: choose the endpoint ID you created.

---

## Settings Reference

### Inline Completions — Core

| Setting | Description | Default |
|---------|-------------|---------|
| Enable inline completions | Master toggle | On |
| Provider | AI service provider | DeepSeek |
| Model | Model to use | `deepseek-chat` |
| Max tokens | Maximum output length per completion | 64 |
| Temperature | Lower = more conservative output | 0 |

### Inline Completions — Advanced

| Setting | Description | Default |
|---------|-------------|---------|
| Wait time | Delay after typing stops before triggering a completion (ms), adjustable in steps of 100 | 500 |
| Context window | Number of characters taken before and after the cursor | 512 |

### Inline Completions — Keybindings

| Setting | Default |
|---------|---------|
| Accept completion | `Tab` |
| Reject completion | `Escape` |

### Usage

| Setting | Description | Default |
|---------|-------------|---------|
| Monthly limit | Completions are automatically disabled when this token limit is reached | 10,000,000 |

---

## Caveats

- This plugin is **desktop only** and does not support mobile.
- Portions of your document are sent to the selected AI provider to generate completions. Avoid using the plugin with documents containing confidential information, and review the data handling policy of your chosen provider.
- API costs are your own responsibility. The monthly limit feature helps control spending, but you should also monitor usage directly on the provider's platform.

---

## FAQ

### I can't accept completions by pressing `Tab`

Some plugins (e.g. Obsidian Outliner) capture the `Tab` key for their own use, which conflicts with RosyPilot. You can either change the accept keybinding in the plugin settings, or adjust the plugin enable order (the plugin enabled last gets higher keybinding priority).

### Strange tags are appearing in my document

Some models (e.g. Doubao) treat `<INSERT>` as an XML tag and append a closing `</INSERT>` to their response, which can bleed into the document. This was fixed in v0.2.0 — please make sure you are on the latest version.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## Acknowledgements

- [Markpilot](https://github.com/taichimaeda/markpilot) — this plugin is a fork of Markpilot; thanks to the original author Taichi Maeda.
- [codemirror-copilot](https://github.com/asadm/codemirror-copilot) — reference for the CodeMirror extension implementation.

## License

MIT License — Copyright © 2026 JiCheng
