import { requestUrl } from 'obsidian';
import { PROVIDERS_BASE_URLS } from 'src/api/providers';
import RosyPilot from 'src/main';
import { LegalRef } from '../detector';
import { WebExactProvisionResultInput } from '../runtime/normalizer';

const EXTRACT_SYSTEM_PROMPT =
	'你是法律信息抽取助手。请只根据用户提供的网页片段抽取目标法条原文，不得补写、推测或改写。只有网页片段中明确包含目标法规名称和目标条文编号，并且能找到对应条文内容时，才返回JSON对象：{"title":"法规名称+条文编号","content":"条文原文"}。如果无法确认，返回 null。不要解释。';

export interface WebProvisionExtraction {
	title: string;
	content: string;
}

export class WebProvisionExtractor {
	constructor(private plugin: RosyPilot) {}

	async extract(
		ref: LegalRef,
		input: WebExactProvisionResultInput,
	): Promise<WebProvisionExtraction | null> {
		const { settings } = this.plugin;
		const provider = settings.completions.provider;
		const apiKey = settings.providers[provider].apiKey;
		const model = settings.completions.model;

		if (!apiKey || !model) return null;

		const snippet = cleanWebSnippet(input.content);
		if (!snippet) return null;

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
					{ role: 'system', content: EXTRACT_SYSTEM_PROMPT },
					{
						role: 'user',
						content: buildExtractionPrompt(ref, input, snippet),
					},
				],
				max_tokens: 2048,
				temperature: 0,
			}),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) return null;

		const body = res.json as {
			choices?: { message?: { content?: string | null } }[];
		};
		const content = body?.choices?.[0]?.message?.content?.trim() ?? '';
		return parseExtractionResponse(content, ref);
	}
}

export function cleanWebSnippet(content: string): string {
	return content
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\|/g, ' ')
		.replace(/[\t\r\f\v]+/g, ' ')
		.replace(/[ \u3000]{2,}/g, ' ')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function buildExtractionPrompt(
	ref: LegalRef,
	input: WebExactProvisionResultInput,
	snippet: string,
): string {
	return [
		`【目标法规名称】${ref.fgmc}`,
		`【目标条文编号】${ref.ftnum}`,
		`【网页标题】${input.title}`,
		`【网页地址】${input.url ?? ''}`,
		`【网页片段】\n${snippet.slice(0, 6000)}`,
	].join('\n\n');
}

function parseExtractionResponse(
	response: string,
	ref: LegalRef,
): WebProvisionExtraction | null {
	if (!response || response.toLowerCase() === 'null') return null;
	const jsonText = extractJsonText(response);
	if (!jsonText) return null;

	try {
		const parsed = JSON.parse(jsonText) as {
			title?: unknown;
			content?: unknown;
		};
		if (
			typeof parsed.title !== 'string' ||
			typeof parsed.content !== 'string'
		) {
			return null;
		}
		const title = parsed.title.trim();
		const content = parsed.content.trim();
		if (!title || !content) return null;
		if (!title.includes(ref.ftnum) && !content.includes(ref.ftnum)) return null;
		return { title, content };
	} catch {
		return null;
	}
}

function extractJsonText(content: string): string | null {
	const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
	if (fenced) return fenced[1].trim();

	const objectStart = content.indexOf('{');
	const objectEnd = content.lastIndexOf('}');
	if (objectStart !== -1 && objectEnd > objectStart) {
		return content.slice(objectStart, objectEnd + 1).trim();
	}

	return null;
}
