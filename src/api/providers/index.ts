export type Provider = (typeof PROVIDERS)[number];

export const PROVIDERS = ['deepseek', 'volcengine'] as const;

export const PROVIDERS_NAMES: Record<Provider, string> = {
	deepseek: 'DeepSeek',
	volcengine: '火山引擎',
};

export const PROVIDERS_BASE_URLS: Record<Provider, string> = {
	deepseek: 'https://api.deepseek.com',
	volcengine: 'https://ark.cn-beijing.volces.com/api/v3',
};

export const DEFAULT_PROVIDER = 'deepseek' as Provider;
