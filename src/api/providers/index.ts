export type Provider = (typeof PROVIDERS)[number];

export const PROVIDERS = ['deepseek', 'volcengine', 'glm'] as const;

export const PROVIDERS_NAMES: Record<Provider, string> = {
	deepseek: 'DeepSeek',
	volcengine: '火山引擎',
	glm: '智谱 GLM',
};

export const PROVIDERS_BASE_URLS: Record<Provider, string> = {
	deepseek: 'https://api.deepseek.com',
	volcengine: 'https://ark.cn-beijing.volces.com/api/v3',
	glm: 'https://open.bigmodel.cn/api/paas/v4',
};

// DeepSeek prefix completion requires the /beta endpoint
export const PROVIDERS_COMPLETIONS_URLS: Record<Provider, string> = {
	deepseek: 'https://api.deepseek.com/beta',
	volcengine: 'https://ark.cn-beijing.volces.com/api/v3',
	glm: 'https://open.bigmodel.cn/api/paas/v4',
};

export const PROVIDERS_PLATFORM_URLS: Record<Provider, string> = {
	deepseek: 'https://platform.deepseek.com/',
	volcengine: 'https://console.volcengine.com/ark',
	glm: 'https://open.bigmodel.cn/',
};

export const DEFAULT_PROVIDER = 'deepseek' as Provider;
