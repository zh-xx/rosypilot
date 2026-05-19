import { requestUrl } from 'obsidian';
import { PROVIDERS_BASE_URLS } from 'src/api/providers';
import RosyPilot from 'src/main';
import { LegalJudgeDebugInfo } from '../debug';
import { LegalCommandRoute } from '../runtime/route';

const EXTRACT_SYSTEM_PROMPT =
	'判断用户文本中距离光标最近的案例检索对象。若存在明确案号，返回单个JSON对象：{"kind":"exact-case","ah":"案号"}。若没有明确案号，返回 null。不要解释，不要根据案件标题猜测案号。';

const CONTEXT_WINDOW_SIZE = 800;
const CURRENT_SEGMENT_SIZE = 240;

const CASE_NUMBER_PATTERN =
	/[（(〔［【\x5B]\s*(\d{4})\s*[）)〕］】\x5D]\s*([^\n，。；;、：“”"'《》]{2,80}?号)/g;

export function findLastExactCaseRef(text: string): { ah: string } | null {
	let last: { ah: string } | null = null;
	for (const match of text.matchAll(CASE_NUMBER_PATTERN)) {
		const ah = normalizeCaseNumber(`${match[1]}${match[2]}`);
		if (ah) {
			last = { ah };
		}
	}
	return last;
}

export function parseCaseRouteResponse(content: string): LegalCommandRoute {
	const normalized = content.trim();
	if (!normalized || normalized.toLowerCase() === 'null')
		return { kind: 'none' };

	const jsonText = extractJsonText(normalized);
	if (!jsonText || jsonText.toLowerCase() === 'null') return { kind: 'none' };

	try {
		const parsed = JSON.parse(jsonText) as
			| Partial<{ kind: string; ah: string }>
			| Partial<{ kind: string; ah: string }>[]
			| null;
		const route = normalizeParsedCaseRoute(parsed);
		if (route.kind !== 'none') return route;
	} catch {
		// Malformed JSON means no exact case route was detected.
	}

	return parseLastEmbeddedCaseRoute(normalized);
}

function normalizeParsedCaseRoute(
	parsed:
		| Partial<{ kind: string; ah: string }>
		| Partial<{ kind: string; ah: string }>[]
		| null,
): LegalCommandRoute {
	if (Array.isArray(parsed)) {
		for (let i = parsed.length - 1; i >= 0; i--) {
			const route = normalizeParsedCaseRoute(parsed[i]);
			if (route.kind !== 'none') return route;
		}
		return { kind: 'none' };
	}

	if (parsed && parsed.kind === 'exact-case' && typeof parsed.ah === 'string') {
		const ah = normalizeCaseNumber(parsed.ah);
		if (ah) return { kind: 'exact-case', ref: { ah } };
	}

	return { kind: 'none' };
}

function normalizeCaseNumber(value: string): string | null {
	const compact = value
		.replace(/[({〔［【]/g, '（')
		.replace(/\x5B/g, '（')
		.replace(/[)}〕］】]/g, '）')
		.replace(/\x5D/g, '）')
		.replace(/\s+/g, '')
		.trim();
	const withoutOuterParens = compact.match(/^（?(\d{4})）?(.+号)$/);
	if (!withoutOuterParens) return null;

	const body = withoutOuterParens[2];
	if (body.length < 3 || /案号|xxxx|xxx|某/.test(body)) return null;
	return `（${withoutOuterParens[1]}）${body}`;
}

function parseLastEmbeddedCaseRoute(content: string): LegalCommandRoute {
	const objectMatches = content.match(/\{[^{}]*(?:"kind"|"ah")[^{}]*\}/g);
	if (!objectMatches) return { kind: 'none' };

	for (let i = objectMatches.length - 1; i >= 0; i--) {
		try {
			const route = normalizeParsedCaseRoute(
				JSON.parse(objectMatches[i]) as Partial<{ kind: string; ah: string }>,
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

export class CaseRefJudge {
	private debugInfo: LegalJudgeDebugInfo | undefined;

	constructor(private plugin: RosyPilot) {}

	getDebugInfo(): LegalJudgeDebugInfo | undefined {
		return this.debugInfo;
	}

	async judge(prefix: string): Promise<LegalCommandRoute> {
		const context = this.buildContext(prefix);
		const localRef = findLastExactCaseRef(prefix.slice(-CONTEXT_WINDOW_SIZE));
		const route: LegalCommandRoute = localRef
			? { kind: 'exact-case', ref: localRef }
			: await this.detectCaseRoute(context);
		this.debugInfo = {
			...this.debugInfo,
			...(localRef
				? {
						prompt: context,
						rawResponse: 'local exact case ref extractor',
						skippedReason: 'matched by local exact case ref extractor',
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
			'判断光标前文本中最近一次案例检索对象。',
			'精准案例引用必须包含明确案号；没有案号时不要根据标题、当事人或案由猜测。',
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

	private async detectCaseRoute(text: string): Promise<LegalCommandRoute> {
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
			max_tokens: 512,
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
		return parseCaseRouteResponse(content);
	}
}
