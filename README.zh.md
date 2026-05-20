# RosyPilot

[English](https://github.com/zh-xx/rosypilot/blob/main/README.md) | 中文

为 Obsidian 法律写作场景打造的 AI 辅助插件。在起草合同、法律意见书、诉状时提供智能行内补全，并支持一键查询法条原文并插入文档。

> 基于 [Markpilot](https://github.com/taichimaeda/markpilot) 开发（MIT，Copyright © 2024 Taichi Maeda）。

---

## 安装

设置 → 第三方插件 → 浏览 → 搜索 **RosyPilot** → 安装并启用。

手动安装：从[最新 Release](https://github.com/zh-xx/rosypilot/releases/latest) 下载 `main.js`、`manifest.json`、`styles.css`，复制到 `<Vault>/.obsidian/plugins/rosypilot/`，然后在设置中启用。

---

## 快速开始

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 获取 API Key。
2. 打开 **设置 → RosyPilot → 服务商 → DeepSeek**，填入 Key，点击**获取模型列表**。
3. 在**行内补全**中，服务商选 **DeepSeek**，模型选 `deepseek-v4-flash`。
4. 开始写作，幽灵文字出现后按 `Tab` 接受，`Esc` 忽略。

---

## 功能

### 行内补全

停止输入片刻后，插件自动根据光标处的 Markdown 上下文生成续写建议，以幽灵文字展示：

| 上下文        | 补全策略                                   |
| ------------- | ------------------------------------------ |
| `heading`     | 基于文档大纲结构（章节层级）补全标题       |
| `paragraph`   | 提取祖先标题链定位章节，滑动窗口截取上下文 |
| `list-item`   | 识别完整列表结构，仅续写当前项，不生成新项 |
| `block-quote` | 续写引用块原文，不加入新论述               |
| `code-block`  | 识别编程语言，生成对应代码                 |
| `math-block`  | 仅输出 LaTeX                               |

支持 DeepSeek 和火山引擎（豆包），在设置中一键切换，模型列表自动拉取。

### `/补全法条`

将光标置于法条引用之后（如 `《民法典》第五百一十一条`），通过斜杠菜单（` /`）或命令面板（`Cmd+P`）触发。插件识别法规名称和条文编号，查询数据源，在右侧面板展示原文；可选**直接插入**原文或**匹配上下文改写后插入**。

如果输入 `/` 后没有弹出命令列表，请在 **Obsidian 设置 → 核心插件** 中开启 **斜杠命令**。未开启时，仍可通过命令面板 `Cmd/Ctrl+P` 搜索「RosyPilot: 补全法条」或「RosyPilot: 补全案例」使用。

数据源支持元典（结构化法律数据库）和 Tavily（联网检索），默认策略为 `auto`——元典优先，不可用时自动回退到联网检索，也可手动切换为仅用其中一种或同时展示两者结果。

---

## 配置速查

| 设置项          | 默认值              | 说明                                                                      |
| --------------- | ------------------- | ------------------------------------------------------------------------- |
| 服务商          | DeepSeek            | 支持 DeepSeek、火山引擎（豆包）                                           |
| 模型            | `deepseek-v4-flash` | 填入 API Key 后自动拉取                                                   |
| 等待时间        | 500 ms              | 停止输入后触发补全的延迟                                                  |
| 上下文窗口      | 512 字符            | 光标前后截取的字符数                                                      |
| 接受快捷键      | `Tab`               | 可自定义                                                                  |
| 月度 Token 上限 | 10,000,000          | 达到上限后自动停止                                                        |
| 元典 API Key    | —                   | 精确法条查询数据源（[open.chineselaw.com](https://open.chineselaw.com/)） |
| Tavily API Key  | —                   | 联网检索数据源（[tavily.com](https://tavily.com)）                        |
| 默认检索策略    | `auto`              | `auto` / `structured-first` / `web-first` / `all`                         |

**火山引擎配置：** 在[控制台](https://console.volcengine.com/ark)创建推理接入点，填入 API Key 后将接入点 ID 作为模型名使用。

---

## 常见问题

**按 `Tab` 无法接受补全** — 其他插件（如 Outliner）可能优先捕获了 `Tab` 键。可在设置中更改接受快捷键，或将 RosyPilot 设为最后启用的插件。

**文档中出现 `</INSERT>` 标签** — 已在 v0.2.0 修复，请更新至最新版本。

**补全没有触发** — 检查行内补全总开关是否开启、月度 Token 是否达到上限，以及当前文件是否匹配了忽略规则。

---

仅支持桌面端。文档片段会发送至所选服务商，请勿在保密文件中使用。API 费用自理。

[CHANGELOG.md](https://github.com/zh-xx/rosypilot/blob/main/CHANGELOG.md) · MIT License — Copyright © 2026 JiCheng
