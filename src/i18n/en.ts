export const en: Record<string, string> = {
	// Providers
	'providers.heading': 'Providers',
	'providers.select': 'Provider',
	'providers.select.desc': 'Select the model provider for inline completions.',
	'providers.deepseek.apiKey': 'DeepSeek API Key',
	'providers.deepseek.apiKey.desc': 'Enter your DeepSeek API key.',
	'providers.deepseek.fetchModels': 'Fetch model list',
	'providers.deepseek.fetchModels.desc':
		'After entering your API key, click to fetch the available models for your account.',
	'providers.deepseek.fetchModels.btn': 'Fetch models',
	'providers.deepseek.fetchModels.success': 'Model list updated.',
	'providers.deepseek.fetchModels.fail.noKey':
		'Please enter your API key first.',
	'providers.deepseek.fetchModels.fail.invalid':
		'Invalid API key or network error. Please check and try again.',
	'providers.volcengine.apiKey': 'Volcengine API Key',
	'providers.volcengine.apiKey.desc': 'Enter your Volcengine API key.',
	'providers.volcengine.fetchModels': 'Fetch model list',
	'providers.volcengine.fetchModels.desc':
		'After entering your API key, click to fetch the available models for your account.',
	'providers.volcengine.fetchModels.btn': 'Fetch models',
	'providers.volcengine.fetchModels.success': 'Model list updated.',
	'providers.volcengine.fetchModels.fail.noKey':
		'Please enter your API key first.',
	'providers.volcengine.fetchModels.fail.invalid':
		'Invalid API key or network error. Please check and try again.',

	// Inline completions
	'completions.heading': 'Inline completions',
	'completions.enable': 'Enable inline completions',
	'completions.enable.desc': 'Turn this on to enable inline completions.',
	'completions.model': 'Model',
	'completions.model.desc': 'Select the model for inline completions.',
	'completions.model.empty': 'Fetch model list first',
	'completions.maxTokens': 'Max tokens',
	'completions.maxTokens.desc': 'Set the max tokens for inline completions.',
	'completions.temperature': 'Temperature',
	'completions.temperature.desc': 'Set the temperature for inline completions.',
	'completions.waitTime': 'Wait time',
	'completions.waitTime.desc':
		'Time in milliseconds to wait before fetching inline completions from the server.',
	'completions.windowSize': 'Window size',
	'completions.windowSize.desc':
		'Set the window size for inline completions. The window size is the number of characters around the cursor used to obtain inline completions.',
	'completions.acceptKey': 'Accept key',
	'completions.acceptKey.desc':
		'Set the key to accept inline completions. Available keys: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values',
	'completions.rejectKey': 'Reject key',
	'completions.rejectKey.desc':
		'Set the key to reject inline completions. Available keys: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values',

	// Cache
	'cache.heading': 'Cache',
	'cache.enable': 'Enable caching',
	'cache.enable.desc':
		'Turn this on to enable memory caching. The cached data will be invalidated on startup.',

	// Debug
	'debug.heading': 'Debug',
	'debug.enable': 'Enable debug panel',
	'debug.enable.desc':
		'Turn this on to show a debug panel in the right sidebar. It displays the prompt, request parameters, and API response for each completion.',

	// Usage
	'usage.heading': 'Usage',
	'usage.monthlyLimit': 'Monthly limit (tokens)',
	'usage.monthlyLimit.desc':
		'Set the monthly token limit. When this limit is reached, the plugin will disable inline completions.',
	'usage.monthlyTokens': 'Monthly token usage',
	'usage.monthlyTokens.desc':
		'Below you can find the estimated token usage for inline completions this month.',
	'usage.chartLabel': 'Token Usage',
	'usage.limitReached.completions':
		'Monthly token limit reached. Please increase the limit to keep using inline completions.',

	// Commands
	'command.enableCompletions': 'Enable inline completions',
	'command.disableCompletions': 'Disable inline completions',
	'command.toggleCompletions': 'Toggle inline completions',
	'command.enableCache': 'Enable cache',
	'command.disableCache': 'Disable cache',
	'command.toggleCache': 'Toggle cache',

	// Notices
	'notice.completions.enabled': 'Inline completions enabled.',
	'notice.completions.disabled': 'Inline completions disabled.',
	'notice.cache.enabled': 'Cache enabled.',
	'notice.cache.disabled': 'Cache disabled.',
	'notice.fetchCompletions.fail':
		'Failed to fetch completions. Make sure your API key or API URL is correct.',

	// Ribbon
	'ribbon.toggleCompletions': 'Toggle inline completions',

	// Completions sub-headings
	'completions.advanced.heading': 'Advanced',
	'completions.shortcuts.heading': 'Shortcuts',

	// Misc (cache + debug merged)
	'misc.heading': 'Other',

	// About
	'about.heading': 'About',
};
