export const zh: Record<string, string> = {
	// Providers
	'providers.heading': 'LLM 设置',
	'providers.select': 'LLM 服务商',
	'providers.select.desc': '选择行内补全使用的模型供应商。',
	'providers.deepseek.apiKey': 'DeepSeek API 密钥',
	'providers.deepseek.apiKey.desc': '输入你的 DeepSeek API 密钥。',
	'providers.deepseek.platform': 'DeepSeek 开放平台',
	'providers.deepseek.fetchModels': '获取模型列表',
	'providers.deepseek.fetchModels.desc':
		'输入 API 密钥后点击获取，自动拉取当前账号可用的模型列表。',
	'providers.deepseek.fetchModels.btn': '获取模型',
	'providers.deepseek.fetchModels.success': '模型列表已更新。',
	'providers.deepseek.fetchModels.fail.noKey': '请先输入 API Key。',
	'providers.deepseek.fetchModels.fail.invalid':
		'API Key 无效或网络错误，请检查后重试。',
	'providers.volcengine.apiKey': '火山引擎 API 密钥',
	'providers.volcengine.apiKey.desc': '输入你的火山引擎 API 密钥。',
	'providers.volcengine.platform': '火山引擎控制台',
	'providers.volcengine.fetchModels': '获取模型列表',
	'providers.volcengine.fetchModels.desc':
		'输入 API 密钥后点击获取，自动拉取当前账号可用的模型列表。',
	'providers.volcengine.fetchModels.btn': '获取模型',
	'providers.volcengine.fetchModels.success': '模型列表已更新。',
	'providers.volcengine.fetchModels.fail.noKey': '请先输入 API Key。',
	'providers.volcengine.fetchModels.fail.invalid':
		'API Key 无效或网络错误，请检查后重试。',

	// Inline completions
	'completions.heading': '补全设置',
	'completions.enable': '启用行内补全',
	'completions.enable.desc': '开启后启用行内补全功能。',
	'completions.model': '模型',
	'completions.model.desc': '选择行内补全使用的模型。',
	'completions.model.empty': '请先获取模型列表',
	'completions.maxTokens': '最大 Token 数',
	'completions.maxTokens.desc': '设置行内补全的最大 token 数。',
	'completions.temperature': '温度',
	'completions.temperature.desc': '设置行内补全的温度参数。',
	'completions.waitTime': '等待时间',
	'completions.waitTime.desc': '向服务器请求行内补全前的等待时间（毫秒）。',
	'completions.windowSize': '窗口大小',
	'completions.windowSize.desc':
		'设置行内补全的窗口大小，即光标周围用于获取补全的字符数。',
	'completions.acceptKey': '接受快捷键',
	'completions.acceptKey.desc':
		'设置接受行内补全的快捷键。可用键值：https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values',
	'completions.rejectKey': '拒绝快捷键',
	'completions.rejectKey.desc':
		'设置拒绝行内补全的快捷键。可用键值：https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values',

	// Cache
	'cache.heading': '缓存',
	'cache.enable': '启用缓存',
	'cache.enable.desc': '开启后启用内存缓存。缓存数据将在重启后失效。',

	// Debug
	'debug.heading': '调试',
	'debug.enable': '启用调试面板',
	'debug.enable.desc':
		'开启后在右侧边栏显示调试面板，展示每次补全的提示词、请求参数和 API 响应。',

	// Usage
	'usage.heading': '用量',
	'usage.monthlyLimit': '每月限额（Token）',
	'usage.monthlyLimit.desc':
		'设置每月 token 用量限额。达到限额后，插件将停止行内补全。',
	'usage.monthlyTokens': '本月 Token 用量',
	'usage.monthlyTokens.desc': '以下是本月行内补全的估算 token 用量。',
	'usage.chartLabel': 'Token 用量',
	'usage.limitReached.completions':
		'已达到每月 token 用量限额，请提高限额以继续使用行内补全。',

	// Commands
	'command.enableCompletions': '启用行内补全',
	'command.disableCompletions': '停用行内补全',
	'command.toggleCompletions': '切换行内补全',
	'command.enableCache': '启用缓存',
	'command.disableCache': '停用缓存',
	'command.toggleCache': '切换缓存',

	// Notices
	'notice.completions.enabled': '行内补全已启用。',
	'notice.completions.disabled': '行内补全已停用。',
	'notice.cache.enabled': '缓存已启用。',
	'notice.cache.disabled': '缓存已停用。',
	'notice.fetchCompletions.fail':
		'补全请求失败，请检查 API 密钥或 API 地址是否正确。',

	// Ribbon
	'ribbon.toggleCompletions': '切换行内补全',

	// Completions sub-headings
	'completions.advanced.heading': '补全参数',
	'completions.shortcuts.heading': '补全快捷键',

	// Misc (cache + debug merged)
	'misc.heading': '调试与用量',

	// About
	'about.heading': '关于',

	// Legal database
	'settings.legal.title': 'Legal Command 设置',
	'settings.legal.apiKey': '元典 API Key',
	'settings.legal.apiKeyDesc': '用于检索规范和案例等。',
	'settings.legal.yuandianPlatform': '元典开放平台',
	'settings.legal.tavilyApiKey': 'Tavily API Key',
	'settings.legal.tavilyApiKeyDesc': '用于联网检索规范、案例和其他法律资料等。',
	'settings.legal.tavilyPlatform': 'Tavily',
	'settings.legal.defaultRetrievalStrategy': 'Legal Command 默认检索策略',
	'settings.legal.defaultRetrievalStrategyDesc':
		'用于法律命令的默认数据来源选择。具体命令可以在下方单独覆盖。',
	'settings.legal.commandOverrides.completeLegalProvision': '/补全法条检索策略',
	'settings.legal.commandOverrides.completeLegalProvisionDesc':
		'默认继承 Legal Command 全局策略；仅在该命令需要特殊来源时单独修改。',
	'settings.legal.retrievalStrategy.inherit': '继承全局策略',
	'settings.legal.retrievalStrategy.structuredFirst': '元典优先',
	'settings.legal.retrievalStrategy.webFirst': '联网检索优先',
	'settings.legal.retrievalStrategy.auto': '自动 fallback',
	'settings.legal.retrievalStrategy.all': '多来源对照',
	'settings.legal.testConnection': '测试连接',
	'settings.legal.testConnection.running': '测试中...',
	'settings.legal.testConnection.noKey': '请先填写 API Key。',
	'settings.legal.testConnection.success': '连接测试成功。',
	'settings.legal.testConnection.empty': '连接成功，但测试查询未返回数据。',
	'settings.legal.testConnection.fail': '连接测试失败：',
	'settings.legal.strategyStatus': '策略状态',
	'settings.legal.strategyStatus.none':
		'当前没有可用来源，请至少配置一个 API Key。',
	'settings.legal.strategyStatus.yuandian.ready':
		'当前将使用元典检索精准法条。',
	'settings.legal.strategyStatus.yuandian.missing':
		'当前策略需要元典 API Key。',
	'settings.legal.strategyStatus.web.ready': '当前将使用 Tavily 进行联网检索。',
	'settings.legal.strategyStatus.web.missing': '当前策略需要 Tavily API Key。',
	'settings.legal.strategyStatus.auto.both':
		'将优先使用元典；元典失败或无结果时 fallback 到 Tavily。',
	'settings.legal.strategyStatus.auto.yuandianOnly':
		'将仅使用元典；Tavily 未配置，无法联网 fallback。',
	'settings.legal.strategyStatus.auto.tavilyOnly':
		'将使用 Tavily；元典未配置，无法优先查询元典。',
	'settings.legal.strategyStatus.all.both':
		'将同时使用元典和 Tavily 做多来源对照。',
	'settings.legal.strategyStatus.all.yuandianOnly':
		'将仅返回元典结果；Tavily 未配置。',
	'settings.legal.strategyStatus.all.tavilyOnly':
		'将仅返回 Tavily 结果；元典未配置。',

	// Legal slash command
	'legal.slashCommand.label': '补全法条',

	// Legal panel
	'legal.panel.title': '法条',
	'legal.panel.loading': '查询中…',
	'legal.panel.detecting': '正在分析上下文…',
	'legal.panel.fetching': '正在查询法条…',
	'legal.panel.adapting': '正在改写…',
	'legal.panel.insert.raw': '插入法条',
	'legal.panel.insert.action': '插入',
	'legal.panel.insert.adapted': '匹配原文',
	'legal.panel.insert.format.content': '正文',
	'legal.panel.insert.format.title-content': '标题+正文',
	'legal.panel.insert.format.quote-block': '引用块',
	'legal.panel.empty': '未找到相关法条',
	'legal.panel.error': '查询失败，请检查 API 密钥',
	'legal.panel.detail.label': '精确匹配',
	'legal.panel.search.label': '语义相关',
	'legal.panel.source': '来源',

	'legal.panel.expand': '展开全文',
	'legal.panel.collapse': '收起全文',
	'legal.panel.badge.yuandian': '元典',
	'legal.panel.badge.web': 'Web Search',
	'legal.panel.badge.webExtracted': '网页抽取',
	'legal.panel.badge.webSnippet': '网页片段',
	'legal.panel.meta.lawName': '法规名称',
	'legal.panel.meta.articleNo': '条文编号',
	'legal.panel.meta.effectiveStatus': '效力状态',
	'legal.panel.meta.category': '法规类型',
	'legal.panel.meta.publishDate': '发布日期',
	'legal.panel.meta.effectiveDate': '施行日期',
	'legal.notice.noApiKey': '请先在设置中填写元典 API Key',
	'legal.notice.insertRaw.success': '已生成法条原文，按 Tab 插入。',
	'legal.notice.insertAdapted.success':
		'已生成匹配上下文的法条文本，按 Tab 插入。',
	'legal.notice.insertAdapted.missingLlmConfig':
		'请先在 LLM 设置中配置 API Key 和模型。',
	'legal.notice.insertAdapted.empty': '匹配原文未生成可插入内容。',
	'legal.notice.insert.failed': '应用法条结果失败：',
};
