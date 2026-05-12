import { requestUrl } from 'obsidian';
import { PROVIDERS_BASE_URLS } from 'src/api/providers';
import RosyPilot from 'src/main';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';
import { LegalApplicator } from './applicator';
import { injectGhostText } from './ghost-text';

const ADAPT_SYSTEM_PROMPT =
	'你是法律写作助手。你生成的文字将直接插入在用户光标位置之后，所以不要重复光标前已有的任何文字。请直接续写光标前未完成的内容，以引号加冒号的形式（如：规定："……"）将法条最相关的原文嵌入句子中，优先引用原文，最小程度改写，风格与上文保持一致。只返回续写文字，不加任何说明。';

export class InsertAdaptedApplicator implements LegalApplicator {
	id = 'insert.adapted';
	label = '匹配原文';

	async apply(
		request: LegalCommandRequest,
		result: LegalResult,
		plugin: RosyPilot,
	): Promise<void> {
		const { settings } = plugin;
		const provider = settings.completions.provider;
		const apiKey = settings.providers[provider].apiKey;
		const model = settings.completions.model;

		if (!apiKey || !model) return;

		const userMessage = `【当前文档光标前文本】\n${request.prefix.slice(-300)}\n\n【相关法条】\n${result.title}\n${result.content}`;

		const baseURL = PROVIDERS_BASE_URLS[provider];
		const res = await requestUrl({
			url: `${baseURL}/chat/completions`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'system', content: ADAPT_SYSTEM_PROMPT },
					{ role: 'user', content: userMessage },
				],
				max_tokens: 4096,
				temperature: 0.3,
			}),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) return;

		const body = res.json as {
			choices?: { message?: { content?: string | null } }[];
		};
		const adapted = body?.choices?.[0]?.message?.content?.trim() ?? '';

		if (adapted) {
			injectGhostText(request.editorView, adapted);
		}
	}
}
