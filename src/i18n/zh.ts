export const zh: Record<string, string> = {
	// Providers
	'providers.heading': '服务提供商',
	'providers.select': '模型供应商',
	'providers.select.desc': '选择行内补全使用的模型供应商。',
	'providers.deepseek.apiKey': 'DeepSeek API 密钥',
	'providers.deepseek.apiKey.desc': '输入你的 DeepSeek API 密钥。',
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
	'providers.volcengine.fetchModels': '获取模型列表',
	'providers.volcengine.fetchModels.desc':
		'输入 API 密钥后点击获取，自动拉取当前账号可用的模型列表。',
	'providers.volcengine.fetchModels.btn': '获取模型',
	'providers.volcengine.fetchModels.success': '模型列表已更新。',
	'providers.volcengine.fetchModels.fail.noKey': '请先输入 API Key。',
	'providers.volcengine.fetchModels.fail.invalid':
		'API Key 无效或网络错误，请检查后重试。',

	// Inline completions
	'completions.heading': '行内补全',
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
	'completions.advanced.heading': '高级设置',
	'completions.shortcuts.heading': '快捷键',

	// Misc (cache + debug merged)
	'misc.heading': '其他',

	// About
	'about.heading': '关于',
};
