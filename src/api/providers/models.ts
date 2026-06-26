import { Provider } from '.';

export const DEFAULT_MODELS: Record<Provider, string> = {
	deepseek: '',
	volcengine: '',
	glm: '',
};

// 预设候选模型：用户尚未「获取模型列表」或拉取失败时，模型下拉仍可从中选择，
// 避免因 fetchedModels 为空导致下拉被禁用而卡死。用户成功 fetch 后，真实列表会覆盖这些值。
export const FALLBACK_MODELS: Partial<Record<Provider, string[]>> = {
	glm: [
		'glm-4.5',
		'glm-4.5-air',
		'glm-4-plus',
		'glm-4-long',
		'glm-4',
		'glm-4-air',
		'glm-4-flash',
		'glm-4-flashx',
	],
};
