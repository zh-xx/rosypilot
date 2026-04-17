# Changelog

All notable changes to RosyPilot will be documented in this file.

## [0.2.4] - 2026-04-17

### 修复

- 修复接受补全后立刻绕过 debounce 强制触发下一次请求的问题（移除 `force()` 机制）：接受补全后，下一次补全严格等待 `waitTime` 毫秒再触发，不再出现连续链式触发
- 修复光标移动到不应触发补全的位置（词中间、多选区、空前缀）时，已在队列中的 debounce 计时器未被取消、仍发出 API 请求的问题
- 调试面板新增 Clear 按钮，可一键清空所有补全记录

## [0.2.3] - 2026-04-17

### 修复

- 修复中文输入法（IME）组合期间触发补全请求的问题：`compositionstart` 到 `compositionend` 之间的文档变化不再触发补全，`compositionstart` 时同时取消已进入 debounce 队列的待发请求
- 修复 temperature / waitTime 滑块因 `setValue` 在 `setLimits` 之前调用，导致值被 HTML range input 默认步长截断后写回设置（重开设置面板显示默认值）的问题
- 修复首次安装时 `DEFAULT_SETTINGS` 被引用赋值污染的问题，现改用 `structuredClone` 复制
- 修复 `loadSettings()` 对 `providers` 字段仅一层浅合并的问题：现对每个 provider 子对象进行二层合并，确保新增字段（如 `fetchedModels`）在旧数据中被正确补齐
- 修复设置界面 model 下拉在无可用模型时未调用 `setValue` 的问题

## [0.2.2] - 2026-04-16

### 修复

- 修复调试面板标题违反 Obsidian sentence case 规范的问题（"RosyPilot debug" → "Completion debug"）

## [0.2.1] - 2026-04-16

### 修复

- 修复调试面板条目无法展开的问题（toggle 逻辑错误）
- 修复内联样式改为 CSS class 后 toggle 方向反转的 bug
- 修复 `loadData()` 返回值类型推断，消除潜在运行时错误
- 修复 `setTimeout` 回调中 Promise 未正确处理的问题

### 代码质量

- 引入 `eslint-plugin-obsidianmd`，对齐 Obsidian 官方代码审查标准
- 消除所有 `any` 类型，使用泛型和具体类型替代
- 修复浮动 Promise、多余 `await`、`console.log` 等 lint 问题

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
