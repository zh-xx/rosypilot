import { requestUrl } from 'obsidian';
import { PROVIDERS_BASE_URLS } from 'src/api/providers';
import RosyPilot from 'src/main';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';
import { LegalApplicationResult, LegalApplicator } from './applicator';
import { injectGhostText } from './ghost-text';

const ADAPT_SYSTEM_PROMPT =
	'你是法律写作助手。你生成的文字将直接插入在用户光标位置之后，所以不要重复光标前已有的任何文字。请直接续写光标前未完成的内容，以引号加冒号的形式（如：规定："……"）将法条最相关的原文嵌入句子中，优先引用原文，最小程度改写，风格与上文保持一致。只返回续写文字，不加任何说明。';
const CASE_ADAPT_SYSTEM_PROMPT =
	'你是法律写作助手。你生成的文字将直接插入在用户光标位置之后，所以不要重复光标前已有的任何文字。请直接续写光标前未完成的内容，围绕相关案例的裁判观点、裁判理由或关键事实进行衔接，优先引用案例原文中的关键表达，最小程度改写，风格与上文保持一致。只返回续写文字，不加任何说明。';

export class InsertAdaptedApplicator implements LegalApplicator {
	id = 'insert.adapted';
	label = '匹配原文';

	async apply(
		request: LegalCommandRequest,
		result: LegalResult,
		plugin: RosyPilot,
	): Promise<LegalApplicationResult> {
		const { settings } = plugin;
		const provider = settings.completions.provider;
		const apiKey = settings.providers[provider].apiKey;
		const model = settings.completions.model;

		if (!apiKey || !model)
			return { status: 'failed', reason: 'missing-llm-config' };

		const isCase = isCaseLikeResult(result);
		const userMessage = isCase
			? `【当前文档光标前文本】\n${request.prefix.slice(-300)}\n\n【相关案例】\n${formatCaseContext(result)}`
			: `【当前文档光标前文本】\n${request.prefix.slice(-300)}\n\n【相关法条】\n${result.title}\n${result.content}`;

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
					{
						role: 'system',
						content: isCase ? CASE_ADAPT_SYSTEM_PROMPT : ADAPT_SYSTEM_PROMPT,
					},
					{ role: 'user', content: userMessage },
				],
				max_tokens: 4096,
				temperature: 0.3,
			}),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) {
			return {
				status: 'failed',
				reason: 'http-error',
				message: `HTTP ${res.status}`,
			};
		}

		const body = res.json as {
			choices?: { message?: { content?: string | null } }[];
		};
		const adapted = body?.choices?.[0]?.message?.content?.trim() ?? '';

		if (adapted) {
			injectGhostText(request.editorView, adapted);
			return { status: 'success' };
		}

		return { status: 'failed', reason: 'empty-result' };
	}
}

function formatCaseContext(result: LegalResult): string {
	const meta = [
		result.metadata.caseNo,
		result.metadata.court,
		result.metadata.judgmentDate,
	]
		.filter(Boolean)
		.join(' · ');
	return [result.title, meta, result.content].filter(Boolean).join('\n');
}

function isCaseLikeResult(result: LegalResult): boolean {
	return result.type === 'case' || Boolean(result.metadata.caseNo);
}
