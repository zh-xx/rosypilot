import { requestUrl } from 'obsidian';
import { PROVIDERS_BASE_URLS } from 'src/api/providers';
import RosyPilot from 'src/main';
import { LegalJudgeDebugInfo } from '../debug';
import { LegalRef } from '../detector';
import { LegalCommandRoute } from '../runtime/route';

const EXTRACT_SYSTEM_PROMPT =
	'判断用户文本中距离光标最近的法律检索对象。若存在具体法条引用（同时有法规名称和具体条文编号），返回单个JSON对象：{"kind":"exact-provision","fgmc":"法规名称","ftnum":"第X条"}。若没有具体条文编号，但存在可检索的法律议题、请求权问题、争议焦点或“相关规定”类表达，返回：{"kind":"fuzzy-provision","query":"压缩后的法律检索问题"}。若不是法律问题或无法形成检索问题，返回 null。不要解释。';

const CONTEXT_WINDOW_SIZE = 800;
const CURRENT_SEGMENT_SIZE = 240;

const LAW_REF_PATTERN =
	/(?:《([^》\n]{2,120})》|([\u4e00-\u9fa5]{2,60}(?:法典|法|条例|规定|解释|办法|规则)))\s*(第[零〇一二三四五六七八九十百千万\d]+条(?:之[零〇一二三四五六七八九十百千万\d]+)?(?:第[零〇一二三四五六七八九十百千万\d]+款)?(?:第[零〇一二三四五六七八九十百千万\d]+项)?)/g;

export function findLastExactLegalRef(text: string): LegalRef | null {
	let last: LegalRef | null = null;
	for (const match of text.matchAll(LAW_REF_PATTERN)) {
		const fgmc = (match[1] ?? match[2] ?? '').trim();
		const ftnum = (match[3] ?? '').trim();
		const ref = normalizeParsedLegalRef({ fgmc, ftnum });
		if (ref) {
			last = ref;
		}
	}
	return last;
}

export function parseLegalRefResponse(content: string): LegalRef | null {
	const route = parseLegalRouteResponse(content);
	return route.kind === 'exact-provision' ? route.ref : null;
}

export function parseLegalRouteResponse(content: string): LegalCommandRoute {
	const normalized = content.trim();
	if (!normalized || normalized.toLowerCase() === 'null')
		return { kind: 'none' };

	const jsonText = extractJsonText(normalized);
	if (!jsonText || jsonText.toLowerCase() === 'null') return { kind: 'none' };

	try {
		const parsed = JSON.parse(jsonText) as
			| Partial<LegalRef & { kind: string; query: string }>
			| Partial<LegalRef & { kind: string; query: string }>[]
			| null;
		const route = normalizeParsedLegalRoute(parsed);
		if (route.kind !== 'none') {
			return route;
		}
	} catch {
		// Malformed JSON means no legal route was detected.
	}

	return parseLastEmbeddedLegalRoute(normalized);
}

function normalizeParsedLegalRoute(
	parsed:
		| Partial<LegalRef & { kind: string; query: string }>
		| Partial<LegalRef & { kind: string; query: string }>[]
		| null,
): LegalCommandRoute {
	if (Array.isArray(parsed)) {
		for (let i = parsed.length - 1; i >= 0; i--) {
			const route = normalizeParsedLegalRoute(parsed[i]);
			if (route.kind !== 'none') return route;
		}
		return { kind: 'none' };
	}

	const ref = normalizeParsedLegalRef(parsed);
	if (ref) {
		return { kind: 'exact-provision', ref };
	}

	if (
		parsed &&
		parsed.kind === 'fuzzy-provision' &&
		typeof parsed.query === 'string'
	) {
		const query = normalizeFuzzyQuery(parsed.query);
		if (query) {
			return { kind: 'fuzzy-provision', query };
		}
	}

	return { kind: 'none' };
}

function normalizeParsedLegalRef(
	parsed: Partial<LegalRef> | Partial<LegalRef>[] | null,
): LegalRef | null {
	if (Array.isArray(parsed)) {
		for (let i = parsed.length - 1; i >= 0; i--) {
			const ref = normalizeParsedLegalRef(parsed[i]);
			if (ref) return ref;
		}
		return null;
	}

	if (
		parsed &&
		typeof parsed.fgmc === 'string' &&
		typeof parsed.ftnum === 'string'
	) {
		const fgmc = cleanLawName(parsed.fgmc.trim());
		const ftnum = parsed.ftnum.trim();
		if (fgmc && ftnum && !isPlaceholderLegalRef(fgmc, ftnum)) {
			return { fgmc, ftnum };
		}
	}
	return null;
}

function cleanLawName(value: string): string {
	const nationalLawStart = value.lastIndexOf('中华人民共和国');
	if (nationalLawStart !== -1) {
		return value.slice(nationalLawStart);
	}

	const shortLawNames = [
		'劳动合同法',
		'民事诉讼法',
		'刑事诉讼法',
		'行政诉讼法',
		'公司法',
		'民法典',
		'刑法',
	];
	for (const lawName of shortLawNames) {
		const index = value.lastIndexOf(lawName);
		if (index !== -1) {
			return value.slice(index);
		}
	}

	return value;
}

function isPlaceholderLegalRef(fgmc: string, ftnum: string): boolean {
	return (
		fgmc === '法规名称' ||
		fgmc === '法律名称' ||
		ftnum === '第X条' ||
		ftnum === '第x条'
	);
}

function normalizeFuzzyQuery(value: string): string | null {
	const query = value.replace(/\s+/g, ' ').trim();
	if (
		query.length < 2 ||
		query === '法律检索问题' ||
		query === '检索问题' ||
		query === '相关规定'
	) {
		return null;
	}
	return query.slice(0, 120);
}

function parseLastEmbeddedLegalRoute(content: string): LegalCommandRoute {
	const objectMatches = content.match(
		/\{[^{}]*(?:"kind"|"fgmc"|"query")[^{}]*\}/g,
	);
	if (!objectMatches) return { kind: 'none' };

	for (let i = objectMatches.length - 1; i >= 0; i--) {
		try {
			const route = normalizeParsedLegalRoute(
				JSON.parse(objectMatches[i]) as Partial<
					LegalRef & { kind: string; query: string }
				>,
			);
			if (route.kind !== 'none') return route;
		} catch {
			// Keep scanning earlier object-shaped candidates.
		}
	}
	return { kind: 'none' };
}

function extractJsonText(content: string): string | null {
	const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fenced?.[1]) {
		return fenced[1].trim();
	}

	const objectStart = content.indexOf('{');
	const objectEnd = content.lastIndexOf('}');
	if (objectStart !== -1 && objectEnd > objectStart) {
		return content.slice(objectStart, objectEnd + 1).trim();
	}

	return content;
}

export class ProvisionRefJudge {
	private debugInfo: LegalJudgeDebugInfo | undefined;

	constructor(private plugin: RosyPilot) {}

	getDebugInfo(): LegalJudgeDebugInfo | undefined {
		return this.debugInfo;
	}

	async judge(prefix: string): Promise<LegalCommandRoute> {
		const context = this.buildContext(prefix);
		const localRef = findLastExactLegalRef(prefix.slice(-CONTEXT_WINDOW_SIZE));
		const route: LegalCommandRoute = localRef
			? {
					kind: 'exact-provision',
					ref: localRef,
				}
			: await this.detectLegalRoute(context);
		this.debugInfo = {
			...this.debugInfo,
			...(localRef
				? {
						prompt: context,
						rawResponse: 'local exact legal ref extractor',
						skippedReason: 'matched by local exact legal ref extractor',
					}
				: {}),
			parsedRoute: route,
		};
		return route;
	}

	private buildContext(prefix: string): string {
		const recentText = prefix.slice(-CONTEXT_WINDOW_SIZE);
		const currentSegment =
			this.getCurrentSegment(prefix).slice(-CURRENT_SEGMENT_SIZE);

		return [
			'【任务】',
			'判断光标前文本中最近一次法律检索对象。',
			'精准法条引用必须同时包含法规名称和具体条文编号；非精准引用是没有具体条文编号但可以检索相关法条的法律问题。',
			'',
			'【当前句/段】',
			currentSegment,
			'',
			'【光标前最近文本】',
			recentText,
		].join('\n');
	}

	private getCurrentSegment(prefix: string): string {
		const paragraphs = prefix.split(/\n\s*\n/);
		return paragraphs[paragraphs.length - 1] ?? prefix;
	}

	private async detectLegalRoute(text: string): Promise<LegalCommandRoute> {
		const { settings } = this.plugin;
		const provider = settings.completions.provider;
		const apiKey = settings.providers[provider].apiKey;
		const model = settings.completions.model;

		if (!apiKey || !model) {
			this.debugInfo = {
				prompt: text,
				skippedReason: 'missing api key or model',
			};
			return { kind: 'none' };
		}

		const baseURL = PROVIDERS_BASE_URLS[provider];
		const request = {
			model,
			messages: [
				{ role: 'system', content: EXTRACT_SYSTEM_PROMPT },
				{ role: 'user', content: text },
			],
			max_tokens: 1024,
			temperature: 0,
		};
		this.debugInfo = {
			request: {
				model,
				max_tokens: request.max_tokens,
				temperature: request.temperature,
			},
			prompt: text,
		};

		const res = await requestUrl({
			url: `${baseURL}/chat/completions`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify(request),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) {
			this.debugInfo = {
				...this.debugInfo,
				rawResponse: `HTTP ${res.status}`,
			};
			return { kind: 'none' };
		}

		const body = res.json as {
			choices?: {
				message?: { content?: string | null; reasoning_content?: string };
			}[];
		};
		const msg = body?.choices?.[0]?.message;
		const content =
			(msg?.content?.trim() || msg?.reasoning_content?.trim()) ?? '';
		this.debugInfo = {
			...this.debugInfo,
			rawResponse: content,
		};
		return parseLegalRouteResponse(content);
	}
}
