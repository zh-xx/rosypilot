# Changelog

All notable changes to RosyPilot will be documented in this file.

## [0.2.0] - 2026-04-15

### 新增 / 改进

- 新增火山引擎（Volcengine）Provider 支持，可在设置界面切换 DeepSeek / 火山引擎
- 新增"获取模型"按钮，自动拉取当前 Provider 可用模型列表
- 新增关于区块（插件名、版本号、作者、版权声明）
- 新增本月用量进度条，默认月度限额调整为 10,000,000 tokens
- 用量图表横坐标简化为 M/D 格式
- 设置界面重组：行内补全拆为核心项 / 高级设置 / 快捷键，缓存与调试合并为"其他"

### 修复

- 修复豆包等模型将 `<INSERT>` 视为 XML 标签、在回复末尾附加 `</INSERT>` 导致标签混入文档的问题

### 移除

- 移除 Few-shot 功能（示例文件、类型定义、Settings 字段及 UI 开关）
- 移除忽略文件 / 忽略标签功能

### 内部

- Settings 版本升至 `2.3.0`，含完整迁移链

## [0.1.0] - 2026-04-14

### 初始版本

基于 [Markpilot](https://github.com/taichimaeda/markpilot)（MIT License, Copyright © 2024 Taichi Maeda）进行二次开发。

**核心功能**

- 6 种上下文的内联补全：`heading`、`paragraph`、`list-item`、`block-quote`、`math-block`、`code-block`
- 结构化 Prompt 系统：`<SECTION>` / `<CONTEXT>` / `<LIST>` / `<OUTLINE>` / `<CHILDREN>` / `<CONTENT>` 语义标签
- Assistant prefill 强制 `<INSERT>` 格式，消除模型前置废话
- Heading 补全：基于文档大纲结构（outline + children + content 三段式）
- Paragraph 补全：自动提取祖先标题链作为章节定位，滑动窗口截取上下文
- List-item 补全：识别完整列表结构，仅续写当前项，禁止生成新列表项，修复光标紧贴标记符的检测问题
- Block-quote 补全：续写引用块原文，不加入自己论述
- Code-block 补全：识别编程语言，生成对应语言代码
- Math-block 补全：仅输出 LaTeX 代码

**系统提示词**

- 全部改写为中文，面向中文法律写作场景

**调试面板**

- 支持展示章节路径（`§章节名`）
- 支持 Context Info 块显示完整 section 路径

**插件身份**

- 从 Markpilot 改名为 RosyPilot
- id: `rosypilot`，作者: JiCheng
