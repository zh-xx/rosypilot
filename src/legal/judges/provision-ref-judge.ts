import { requestUrl } from 'obsidian';
import { PROVIDERS_BASE_URLS } from 'src/api/providers';
import RosyPilot from 'src/main';
import { LegalJudgeDebugInfo } from '../debug';
import { LegalRef } from '../detector';
import { LegalCommandRoute } from '../runtime/route';

const EXTRACT_SYSTEM_PROMPT =
	'从用户文本中提取距离光标最近的一处具体法条引用。只有同时存在法规名称和具体条文编号时，才返回单个JSON对象：{"fgmc":"法规名称","ftnum":"第X条"}。如果存在多处具体法条引用，只返回最后一处/最近一处，禁止返回数组。无具体引用时返回 null。不要解释。';

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
	const normalized = content.trim();
	if (!normalized || normalized.toLowerCase() === 'null') return null;

	const jsonText = extractJsonText(normalized);
	if (!jsonText || jsonText.toLowerCase() === 'null') return null;

	try {
		const parsed = JSON.parse(jsonText) as
			| Partial<LegalRef>
			| Partial<LegalRef>[]
			| null;
		const ref = normalizeParsedLegalRef(parsed);
		if (ref) {
			return ref;
		}
	} catch {
		// Malformed JSON means no exact legal reference was detected.
	}

	return parseLastEmbeddedLegalRef(normalized);
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

function parseLastEmbeddedLegalRef(content: string): LegalRef | null {
	const objectMatches = content.match(/\{[^{}]*"fgmc"[^{}]*"ftnum"[^{}]*\}/g);
	if (!objectMatches) return null;

	for (let i = objectMatches.length - 1; i >= 0; i--) {
		try {
			const ref = normalizeParsedLegalRef(
				JSON.parse(objectMatches[i]) as Partial<LegalRef>,
			);
			if (ref) return ref;
		} catch {
			// Keep scanning earlier object-shaped candidates.
		}
	}
	return null;
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
		const ref = localRef ?? (await this.detectLegalRef(context));
		const route: LegalCommandRoute = ref
			? {
					kind: 'exact-provision',
					ref,
				}
			: { kind: 'none' };
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
			'判断光标前文本中最近一次法条引用是否为精准法条引用。',
			'精准法条引用必须同时包含法规名称和具体条文编号。',
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

	private async detectLegalRef(text: string): Promise<LegalRef | null> {
		const { settings } = this.plugin;
		const provider = settings.completions.provider;
		const apiKey = settings.providers[provider].apiKey;
		const model = settings.completions.model;

		if (!apiKey || !model) {
			this.debugInfo = {
				prompt: text,
				skippedReason: 'missing api key or model',
			};
			return null;
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
			return null;
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
		return parseLegalRefResponse(content);
	}
}
