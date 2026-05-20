import { requestUrl } from 'obsidian';
import { PROVIDERS_BASE_URLS } from 'src/api/providers';
import RosyPilot from 'src/main';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';
import { LegalApplicationResult, LegalApplicator } from './applicator';
import { injectGhostText } from './ghost-text';

const ADAPT_SYSTEM_PROMPT =
	'你是法律写作助手。你生成的文字将直接插入在用户光标位置之后，所以不要重复光标前已有的任何文字。请直接续写光标前未完成的内容，以引号加冒号的形式（如：规定："……"）将法条最相关的原文嵌入句子中，优先引用原文，最小程度改写，风格与上文保持一致。只返回续写文字，不加任何说明。';
const FUZZY_PROVISION_ADAPT_SYSTEM_PROMPT =
	'你是法律写作助手。用户当前选择的是检索得到的相关法律材料，不一定是已经写明的精确法条。你生成的文字将直接插入在用户光标位置之后，所以不要重复光标前已有的任何文字。请根据当前上下文和候选材料，生成一句自然衔接的法律写作内容，并且必须自然交代观点来源；规范条文应写明法规/条文来源，裁判要旨、案例摘要或司法观点应写明材料标题或可用来源。不要强行使用“规定：”格式，不要把案例材料说成法条规定，不要虚构法条名、案号或来源。优先引用候选材料中的关键原文，最小程度改写。只返回续写文字，不加任何说明。';
const CASE_ADAPT_SYSTEM_PROMPT =
	'你是法律写作助手。你生成的文字将直接插入在用户光标位置之后，所以不要重复光标前已有的任何文字。请直接续写光标前未完成的内容，围绕相关案例的裁判观点、裁判理由或关键事实进行衔接，优先引用案例原文中的关键表达，最小程度改写，风格与上文保持一致。只返回续写文字，不加任何说明。';
const FUZZY_CASE_ADAPT_SYSTEM_PROMPT =
	'你是法律写作助手。用户当前选择的是相关案例或类案检索结果，不是已经写明案号的精确案例。你生成的文字将直接插入在用户光标位置之后，所以不要重复光标前已有的任何文字；如果光标前已经出现“类似案例中”“相关类案中”等表达，直接承接裁判观点，不要再次重复这些短语。请围绕候选案例的裁判观点、裁判理由或关键事实自然续写，并且必须自然交代观点来源；优先使用案例标题、案号、法院、裁判日期、网页来源中已经提供的信息。优先引用候选材料中的关键表达，避免长篇介绍来源。不要使用“法条规定”等法条专属措辞，不要虚构案号、法院或裁判日期。只返回续写文字，不加任何说明。';

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

		const matchKind = getAdaptMatchKind(result);
		const userMessage =
			matchKind === 'case' || matchKind === 'fuzzy-case'
				? formatCaseUserMessage(request, result)
				: formatProvisionUserMessage(request, result);

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
						content: getAdaptSystemPrompt(matchKind),
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

function formatCaseUserMessage(
	request: LegalCommandRequest,
	result: LegalResult,
): string {
	const query = result.metadata.caseQuery
		? `【检索问题】\n${result.metadata.caseQuery}\n\n`
		: '';
	return `【当前文档光标前文本】\n${request.prefix.slice(-300)}\n\n${query}【相关案例】\n${formatCaseContext(result)}`;
}

function formatProvisionUserMessage(
	request: LegalCommandRequest,
	result: LegalResult,
): string {
	const query = result.metadata.provisionQuery
		? `【检索问题】\n${result.metadata.provisionQuery}\n\n`
		: '';
	return `【当前文档光标前文本】\n${request.prefix.slice(-300)}\n\n${query}【相关法律材料】\n${result.title}\n${result.content}`;
}

function getAdaptSystemPrompt(
	matchKind: 'provision' | 'fuzzy-provision' | 'case' | 'fuzzy-case',
): string {
	if (matchKind === 'fuzzy-case') return FUZZY_CASE_ADAPT_SYSTEM_PROMPT;
	if (matchKind === 'case') return CASE_ADAPT_SYSTEM_PROMPT;
	if (matchKind === 'fuzzy-provision')
		return FUZZY_PROVISION_ADAPT_SYSTEM_PROMPT;
	return ADAPT_SYSTEM_PROMPT;
}

function getAdaptMatchKind(
	result: LegalResult,
): 'provision' | 'fuzzy-provision' | 'case' | 'fuzzy-case' {
	if (isCaseLikeResult(result)) {
		return result.metadata.caseQuery ? 'fuzzy-case' : 'case';
	}
	return result.metadata.provisionQuery ? 'fuzzy-provision' : 'provision';
}

function isCaseLikeResult(result: LegalResult): boolean {
	return (
		result.type === 'case' ||
		Boolean(result.metadata.caseNo) ||
		Boolean(result.metadata.caseQuery)
	);
}
