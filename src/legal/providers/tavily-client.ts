import { requestUrl } from 'obsidian';
import { LegalRef } from '../detector';
import {
	WebExactCaseResultInput,
	WebExactProvisionResultInput,
} from '../runtime/normalizer';
import { WebExactCaseSearchProvider } from '../executors/web-case-exact';
import { WebFuzzyCaseSearchProvider } from '../executors/web-case-fuzzy';
import { WebExactSearchProvider } from '../executors/web-exact';
import { WebFuzzySearchProvider } from '../executors/web-fuzzy';

const BASE_URL = 'https://api.tavily.com/search';

interface TavilySearchResult {
	title?: string;
	url?: string;
	content?: string;
	score?: number;
	raw_content?: string;
}

interface TavilySearchResponse {
	results?: TavilySearchResult[];
}

export class TavilyClient {
	constructor(private apiKey: string) {}

	async search(query: string): Promise<TavilySearchResult[]> {
		const res = await requestUrl({
			url: BASE_URL,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify({
				query,
				search_depth: 'basic',
				topic: 'general',
				max_results: 3,
				include_answer: false,
				include_raw_content: false,
			}),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) {
			throw new Error(`HTTP ${res.status}`);
		}

		const body = res.json as TavilySearchResponse;
		return body.results ?? [];
	}
}

export class TavilyExactProvider implements WebExactSearchProvider {
	id = 'tavily';
	label = 'Tavily';

	constructor(private client: TavilyClient) {}

	async searchExactProvision(
		ref: LegalRef,
	): Promise<WebExactProvisionResultInput[]> {
		const query = `${ref.fgmc} ${ref.ftnum} 法条 原文`;
		const results = await this.client.search(query);
		return results
			.filter((result) => result.title || result.content || result.raw_content)
			.map((result) => ({
				providerId: this.id,
				providerName: this.label,
				url: result.url,
				title: result.title ?? `${ref.fgmc}${ref.ftnum}`,
				content: result.raw_content ?? result.content ?? '',
				lawName: ref.fgmc,
				articleNo: ref.ftnum,
				score: result.score,
				raw: result,
			}));
	}
}

export class TavilyFuzzyProvider implements WebFuzzySearchProvider {
	id = 'tavily';
	label = 'Tavily';

	constructor(private client: TavilyClient) {}

	async searchFuzzyProvisions(
		query: string,
	): Promise<WebExactProvisionResultInput[]> {
		const results = await this.client.search(`${query} 相关法条 原文`);
		return results
			.filter((result) => result.title || result.content || result.raw_content)
			.map((result) => ({
				providerId: this.id,
				providerName: this.label,
				url: result.url,
				title: result.title ?? query,
				content: result.raw_content ?? result.content ?? '',
				provisionQuery: query,
				score: result.score,
				raw: result,
			}));
	}
}

export class TavilyExactCaseProvider implements WebExactCaseSearchProvider {
	id = 'tavily';
	label = 'Tavily';

	constructor(private client: TavilyClient) {}

	async searchExactCase(ah: string): Promise<WebExactCaseResultInput[]> {
		const results = await this.client.search(`${ah} 裁判文书 案例 原文`);
		return results
			.filter((result) => result.title || result.content || result.raw_content)
			.map((result) => ({
				providerId: this.id,
				providerName: this.label,
				url: result.url,
				title: result.title ?? ah,
				content: result.raw_content ?? result.content ?? '',
				caseNo: ah,
				score: result.score,
				raw: result,
			}));
	}
}

export class TavilyFuzzyCaseProvider implements WebFuzzyCaseSearchProvider {
	id = 'tavily';
	label = 'Tavily';

	constructor(private client: TavilyClient) {}

	async searchFuzzyCases(query: string): Promise<WebExactCaseResultInput[]> {
		const results = await this.client.search(`${query} 类案 裁判观点 裁判文书`);
		return results
			.filter((result) => result.title || result.content || result.raw_content)
			.map((result) => ({
				providerId: this.id,
				providerName: this.label,
				url: result.url,
				title: result.title ?? query,
				content: result.raw_content ?? result.content ?? '',
				caseQuery: query,
				score: result.score,
				raw: result,
			}));
	}
}
