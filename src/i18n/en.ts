export const en: Record<string, string> = {
	// Providers
	'providers.heading': 'LLM Settings',
	'providers.select': 'LLM provider',
	'providers.select.desc': 'Select the model provider for inline completions.',
	'providers.deepseek.apiKey': 'DeepSeek API key',
	'providers.deepseek.apiKey.desc': 'Enter your DeepSeek API key.',
	'providers.deepseek.platform': 'DeepSeek Open Platform',
	'providers.deepseek.fetchModels': 'Fetch model list',
	'providers.deepseek.fetchModels.desc':
		'After entering your API key, click to fetch the available models for your account.',
	'providers.deepseek.fetchModels.btn': 'Fetch models',
	'providers.deepseek.fetchModels.success': 'Model list updated.',
	'providers.deepseek.fetchModels.fail.noKey':
		'Please enter your API key first.',
	'providers.deepseek.fetchModels.fail.invalid':
		'Invalid API key or network error. Please check and try again.',
	'providers.volcengine.apiKey': 'Volcengine API key',
	'providers.volcengine.apiKey.desc': 'Enter your Volcengine API key.',
	'providers.volcengine.platform': 'Volcengine Console',
	'providers.volcengine.fetchModels': 'Fetch model list',
	'providers.volcengine.fetchModels.desc':
		'After entering your API key, click to fetch the available models for your account.',
	'providers.volcengine.fetchModels.btn': 'Fetch models',
	'providers.volcengine.fetchModels.success': 'Model list updated.',
	'providers.volcengine.fetchModels.fail.noKey':
		'Please enter your API key first.',
	'providers.volcengine.fetchModels.fail.invalid':
		'Invalid API key or network error. Please check and try again.',
	'providers.glm.apiKey': 'Zhipu GLM API key',
	'providers.glm.apiKey.desc': 'Enter your Zhipu GLM API key.',
	'providers.glm.platform': 'Zhipu BigModel Open Platform',
	'providers.glm.fetchModels': 'Fetch model list',
	'providers.glm.fetchModels.desc':
		'After entering your API key, click to fetch the available models for your account.',
	'providers.glm.fetchModels.btn': 'Fetch models',
	'providers.glm.fetchModels.success': 'Model list updated.',
	'providers.glm.fetchModels.fail.noKey':
		'Please enter your API key first.',
	'providers.glm.fetchModels.fail.invalid':
		'Invalid API key or network error. Please check and try again.',

	// Inline completions
	'completions.heading': 'Completion Settings',
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
	'usage.chartLabel': 'Token usage',
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
	'completions.advanced.heading': 'Completion parameters',
	'completions.shortcuts.heading': 'Completion shortcuts',

	// Misc (cache + debug merged)
	'misc.heading': 'Debug and Usage',

	// About
	'about.heading': 'About',

	// Legal database
	'settings.legal.title': 'Legal Command Settings',
	'settings.legal.slashCommandRequirement': 'Slash commands requirement',
	'settings.legal.slashCommandRequirementDesc':
		'If typing / does not open the command list, enable Obsidian Settings → Core plugins → Slash commands. You can still run commands from Cmd/Ctrl+P by searching RosyPilot: Complete legal provision or RosyPilot: Complete legal case.',
	'settings.legal.apiKey': 'Yuandian API Key',
	'settings.legal.apiKeyDesc':
		'Used to search statutes, cases, and other legal materials.',
	'settings.legal.yuandianPlatform': 'Yuandian Open Platform',
	'settings.legal.tavilyApiKey': 'Tavily API Key',
	'settings.legal.tavilyApiKeyDesc':
		'Used for web search across statutes, cases, and other legal materials.',
	'settings.legal.tavilyPlatform': 'Tavily',
	'settings.legal.defaultRetrievalStrategy':
		'Default Legal Command retrieval strategy',
	'settings.legal.defaultRetrievalStrategyDesc':
		'Choose the default data source strategy for legal commands. Individual commands can override it below.',
	'settings.legal.commandOverrides.completeLegalProvision':
		'/Complete legal provision retrieval strategy',
	'settings.legal.commandOverrides.completeLegalProvisionDesc':
		'Inherits the global Legal Command strategy by default. Override only when this command needs a specific source.',
	'settings.legal.commandOverrides.completeLegalCase':
		'/Complete legal case retrieval strategy',
	'settings.legal.commandOverrides.completeLegalCaseDesc':
		'Inherits the global Legal Command strategy by default. Override only when this command needs a specific source.',
	'settings.legal.retrievalStrategy.inherit': 'Inherit global strategy',
	'settings.legal.retrievalStrategy.structuredFirst': 'Yuandian first',
	'settings.legal.retrievalStrategy.webFirst': 'Web search first',
	'settings.legal.retrievalStrategy.auto': 'Auto fallback',
	'settings.legal.retrievalStrategy.all': 'Compare multiple sources',
	'settings.legal.testConnection': 'Test connection',
	'settings.legal.testConnection.running': 'Testing...',
	'settings.legal.testConnection.noKey': 'Enter an API key first.',
	'settings.legal.testConnection.success': 'Connection test succeeded.',
	'settings.legal.testConnection.empty':
		'Connection succeeded, but the test query returned no data.',
	'settings.legal.testConnection.fail': 'Connection test failed:',
	'settings.legal.strategyStatus': 'Strategy status',
	'settings.legal.strategyStatus.none':
		'No source is currently available. Configure at least one API key.',
	'settings.legal.strategyStatus.yuandian.ready':
		'Exact provision lookup will use Yuandian.',
	'settings.legal.strategyStatus.yuandian.missing':
		'This strategy requires a Yuandian API key.',
	'settings.legal.strategyStatus.web.ready':
		'Exact provision lookup will use Tavily web search.',
	'settings.legal.strategyStatus.web.missing':
		'This strategy requires a Tavily API key.',
	'settings.legal.strategyStatus.auto.both':
		'Yuandian will run first; Tavily will be used if Yuandian fails or returns no result.',
	'settings.legal.strategyStatus.auto.yuandianOnly':
		'Only Yuandian is available; Tavily fallback is not configured.',
	'settings.legal.strategyStatus.auto.tavilyOnly':
		'Tavily is available; Yuandian is not configured.',
	'settings.legal.strategyStatus.all.both':
		'Yuandian and Tavily will both run for multi-source comparison.',
	'settings.legal.strategyStatus.all.yuandianOnly':
		'Only Yuandian results will be returned; Tavily is not configured.',
	'settings.legal.strategyStatus.all.tavilyOnly':
		'Only Tavily results will be returned; Yuandian is not configured.',

	// Legal slash command
	'legal.slashCommand.label': 'Complete legal provision',
	'legal.slashCommand.caseLabel': 'Complete legal case',
	'legal.slashCommand.hallucinationLabel': 'Verify legal references',

	// Legal panel
	'legal.panel.title': 'Legal Provisions',
	'legal.panel.loading': 'Searching…',
	'legal.panel.detecting': 'Analysing context…',
	'legal.panel.fetching': 'Fetching provision…',
	'legal.panel.fetchingCase': 'Fetching case…',
	'legal.panel.adapting': 'Adapting…',
	'legal.panel.insert.raw': 'Insert provision',
	'legal.panel.insert.caseRaw': 'Insert case',
	'legal.panel.insert.action': 'Insert',
	'legal.panel.insert.adapted': 'Adapted',
	'legal.panel.insert.format.content': 'Text',
	'legal.panel.insert.format.title-content': 'Title + text',
	'legal.panel.insert.format.quote-block': 'Quote block',
	'legal.panel.empty': 'No results found',
	'legal.panel.caseEmpty': 'No cases found',
	'legal.panel.error': 'Query failed. Check your API key.',
	'legal.panel.detail.label': 'Exact match',
	'legal.panel.search.label': 'Semantic results',
	'legal.panel.caseSearch.label': 'Related cases',
	'legal.panel.source': 'Source',

	'legal.panel.expand': 'Expand',
	'legal.panel.collapse': 'Collapse',
	'legal.panel.badge.yuandian': 'Yuandian',
	'legal.panel.badge.web': 'Web Search',
	'legal.panel.badge.webExtracted': 'Web extracted',
	'legal.panel.badge.webSnippet': 'Web snippet',
	'legal.panel.meta.lawName': 'Law',
	'legal.panel.meta.articleNo': 'Article',
	'legal.panel.meta.effectiveStatus': 'Status',
	'legal.panel.meta.category': 'Category',
	'legal.panel.meta.publishDate': 'Published',
	'legal.panel.meta.effectiveDate': 'Effective',
	'legal.panel.meta.caseNo': 'Case number',
	'legal.panel.meta.court': 'Court',
	'legal.panel.meta.cause': 'Cause of action',
	'legal.panel.meta.caseCategory': 'Case category',
	'legal.panel.meta.trialProcedure': 'Procedure',
	'legal.panel.meta.documentType': 'Document type',
	'legal.panel.meta.judgmentDate': 'Judgment date',
	'legal.panel.meta.caseSourceType': 'Case type',
	'legal.panel.meta.caseQuery': 'Query',
	'legal.panel.hallucination.detecting': 'Verifying legal references...',
	'legal.panel.hallucination.empty': 'No legal references found',
	'legal.panel.hallucination.noApiKey':
		'Please configure Yuandian API Key in settings first.',
	'legal.panel.hallucination.label': 'Hallucination Verify Report',
	'legal.panel.hallucination.verdict.consistent': 'Consistent',
	'legal.panel.hallucination.verdict.inconsistent': 'Inconsistent',
	'legal.panel.hallucination.verdict.unknown': 'Unknown',
	'legal.panel.hallucination.verdict.skipped': 'Skipped',
	'legal.panel.hallucination.case.found': 'Found',
	'legal.panel.hallucination.case.notFound': 'Not Found',
	'legal.panel.hallucination.meta.validityStatus': 'Validity',
	'legal.panel.hallucination.meta.publishDate': 'Published',
	'legal.panel.hallucination.meta.implementDate': 'Effective',
	'legal.panel.hallucination.type.fabricated': 'Law does not exist',
	'legal.panel.hallucination.type.clauseMissing': 'Clause not found',
	'legal.panel.hallucination.type.severeError': 'Content severely incorrect',
	'legal.panel.hallucination.type.misunderstanding': 'Misapplication',
	'legal.panel.hallucination.type.consistent': 'Content consistent',
	'legal.panel.hallucination.type.unknown': 'Unverifiable',
	'legal.panel.hallucination.authoritative': 'Authoritative text',
	'legal.panel.hallucination.explanation': 'Comparison note',
	'legal.panel.hallucination.keyPoints': 'Key comparison points',
	'legal.panel.hallucination.locate': 'Locate',
	'legal.panel.hallucination.locate.notFound': 'Text not found in document',
	'legal.panel.hallucination.analyze': 'AI Commentary',
	'legal.panel.hallucination.reanalyze': 'Re-analyze',
	'legal.panel.hallucination.analyzeLabel': 'AI Commentary',
	'legal.panel.hallucination.analyze.noLlm':
		'Please configure LLM API Key and model in settings first',
	'legal.notice.noApiKey':
		'Please set your Yuandian API Key in settings first.',
	'legal.notice.insertRaw.success':
		'Provision text is ready. Press Tab to insert it.',
	'legal.notice.insertCaseRaw.success':
		'Case text is ready. Press Tab to insert it.',
	'legal.notice.insertAdapted.success':
		'Context-matched provision text is ready. Press Tab to insert it.',
	'legal.notice.insertAdapted.missingLlmConfig':
		'Configure an API key and model in LLM Settings first.',
	'legal.notice.insertAdapted.empty': 'No context-matched text was generated.',
	'legal.notice.insert.failed': 'Failed to apply legal result:',
};
