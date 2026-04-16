# RosyPilot

[English](README.md) | 中文

**为 Obsidian 法律写作场景打造的 AI 行内补全插件**

RosyPilot 为 Obsidian 带来上下文感知的 AI 行内补全能力，专为中文法律文书写作优化。在起草合同、法律意见书、诉状等文件时，插件会自动识别光标处的 Markdown 上下文类型（标题、段落、列表、引用块等），针对每种类型选用最合适的提示策略，并以幽灵文字形式呈现建议。

> 基于 [Markpilot](https://github.com/taichimaeda/markpilot) 开发（MIT 协议，Copyright © 2024 Taichi Maeda）。

---

## 功能特性

### 上下文感知补全

插件识别 6 种 Markdown 上下文类型，并为每种类型应用专属提示策略：

| 上下文 | 说明 |
|--------|------|
| `heading` | 基于文档大纲结构（outline / children / content 三段式）补全标题内容 |
| `paragraph` | 提取祖先标题链作为章节定位；用滑动窗口截取上下文 |
| `list-item` | 识别完整列表结构，仅续写当前列表项，不生成新项 |
| `block-quote` | 续写引用块原文，不加入自己论述 |
| `code-block` | 识别编程语言，生成对应语言代码 |
| `math-block` | 仅输出 LaTeX 代码 |

### 多模型服务商

- **DeepSeek** — `deepseek-chat`、`deepseek-reasoner` 等
- **火山引擎（Volcengine）** — 豆包系列模型
- 一键切换服务商；在设置页面自动拉取可用模型列表

### 使用体验

- 建议以幽灵文字显示，按 `Tab` 接受，按 `Esc` 拒绝
- 触发延迟、上下文窗口大小、接受/拒绝快捷键均可配置
- 内存缓存避免重复请求（重启后清空）
- 月度 Token 用量追踪，支持柱状图展示和用量上限配置

---

## 快速开始

### 使用 DeepSeek

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 获取 API Key。
2. 在 Obsidian 中安装 RosyPilot。
3. 打开插件设置：
   - **服务商 > DeepSeek > API Key**：填入 API Key，然后点击**获取模型列表**。
   - **行内补全 > 服务商**：选择 DeepSeek。
   - **行内补全 > 模型**：选择模型（推荐 `deepseek-chat`）。
4. 开始写作，稍等片刻后幽灵文字出现，按 `Tab` 接受。

### 使用火山引擎（豆包）

1. 前往[火山引擎控制台](https://console.volcengine.com/ark)获取 API Key，并创建推理接入点。
2. 打开插件设置：
   - **服务商 > 火山引擎 > API Key**：填入 API Key，然后点击**获取模型列表**。
   - **行内补全 > 服务商**：选择 Volcengine。
   - **行内补全 > 模型**：选择你创建的接入点 ID。

---

## 设置说明

### 行内补全 — 基础

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 启用行内补全 | 总开关 | 开 |
| 服务商 | AI 服务商 | DeepSeek |
| 模型 | 使用的模型 | `deepseek-chat` |
| 最大 Token 数 | 每次补全的最大输出长度 | 64 |
| 温度 | 越低输出越保守 | 0 |

### 行内补全 — 高级

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 等待时间 | 停止输入后触发补全前的延迟（毫秒），步长 100 | 500 |
| 上下文窗口 | 光标前后截取的字符数 | 512 |

### 行内补全 — 快捷键

| 设置项 | 默认值 |
|--------|--------|
| 接受补全 | `Tab` |
| 拒绝补全 | `Escape` |

### 用量

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 月度上限 | 达到此 Token 上限后自动停止补全 | 10,000,000 |

---

## 注意事项

- 本插件**仅支持桌面端**，不支持移动端。
- 生成补全时，文档片段会发送至所选 AI 服务商。请避免在含有保密信息的文件中使用，并注意查阅所选服务商的数据处理政策。
- API 费用由用户自行承担。月度上限功能可辅助控制支出，但建议同时在服务商平台直接监控用量。

---

## 常见问题

### 按 `Tab` 无法接受补全

部分插件（如 Obsidian Outliner）会优先捕获 `Tab` 键，与 RosyPilot 产生冲突。可在插件设置中更改接受快捷键，或调整插件启用顺序（后启用的插件快捷键优先级更高）。

### 文档中出现奇怪的标签

部分模型（如豆包）会将 `<INSERT>` 识别为 XML 标签，并在回复中自动补全 `</INSERT>`，导致内容渗入文档。此问题已在 v0.2.0 中修复，请确保使用最新版本。

---

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)。

---

## 致谢

- [Markpilot](https://github.com/taichimaeda/markpilot) — 本插件基于 Markpilot fork 开发，感谢原作者 Taichi Maeda。
- [codemirror-copilot](https://github.com/asadm/codemirror-copilot) — CodeMirror 扩展实现的参考来源。

## 许可证

MIT License — Copyright © 2026 JiCheng
