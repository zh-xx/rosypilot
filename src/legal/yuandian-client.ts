import { requestUrl } from 'obsidian';

const BASE_URL = 'https://open.chineselaw.com';

export interface SemanticCompare {
	结论: string;
	语义相似度: number | null;
	说明: string;
	要点: string[];
	skipped?: boolean;
	skip_reason?: string;
	skip_message?: string;
}

export interface HallucinationRegulation {
	name: string;
	clause: string;
	content: string;
	extract_reg_id: string;
	url: string;
	think_tank_content: string;
	source_no_specific_clause?: boolean;
	law_exists?: boolean;
	think_tank_clause_missing?: boolean;
	publish_date: string;
	implement_date: string;
	validity_status: string;
	document_number: string;
	semantic_compare: SemanticCompare;
}

export interface HallucinationCase {
	name: string;
	case_number: string;
	content: string;
	url: string;
	think_tank_content: string;
	case_type: string;
	court: string;
	judgment_date: string;
	basic_facts: string;
	judgment_key_points: string;
	judgment_result: string;
	judgment_analysis: string;
	typical_significance: string;
	case_commentary: string;
}

export interface HallucinationDetectResponse {
	regulations: HallucinationRegulation[];
	cases: HallucinationCase[];
	highlighted_text: string;
	chat_model: string;
	request_id: string;
	semantic_compare_error?: string;
}

export interface ArticleDetail {
	id: string;
	fgmc: string;
	ft_num: string;
	ftmc: string;
	content: string;
	sxx: string;
	xljb_1: string;
	fbrq: string;
	ssrq: string;
}

export interface ArticleSearchItem {
	ftid: string;
	fgid: string;
	fgtitle: string[] | string;
	num: string;
	content: string;
	sxx: string;
	effect1: string;
	start?: number;
	end?: number;
	score: number;
}

export type YuandianCaseDetailType = 'ptal' | 'qwal';
export type YuandianCaseKeywordType = 'ptal' | 'qwal';

export interface CaseDetail {
	id: string;
	type?: string;
	ah?: string;
	title?: string;
	jbdw?: string;
	ajlb?: string;
	ajlx?: string;
	spcx?: string;
	wszl?: string;
	ay?: string[] | string;
	cprq?: string;
	xzqh_p?: string;
	xzqh_c?: string;
	yyft?: string[] | string;
	content?: string;
	dsr?: string;
	ssjl?: string;
	ajjbqk?: string;
	fxgc?: string;
	pjjg?: string;
	cmss?: string;
	url?: string;
}

export interface CaseKeywordSearchItem {
	id: string;
	type?: string;
	ah?: string;
	title?: string;
	ay?: string[] | string;
	jbdw?: string;
	ajlb?: string;
	xzqh_p?: string;
	wszl?: string;
	cprq?: string;
	content?: string;
	llm_content?: string;
	url?: string;
	score?: number;
}

export class YuandianClient {
	constructor(private apiKey: string) {}

	async fetchDetail(
		fgmc: string,
		ftnum: string,
	): Promise<ArticleDetail | null> {
		const res = await requestUrl({
			url: `${BASE_URL}/open/rh_ft_detail`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': this.apiKey,
			},
			body: JSON.stringify({ fgmc, ftnum }),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) {
			throw new Error(`HTTP ${res.status}`);
		}

		const body = res.json as {
			status: string;
			code: number;
			message: string;
			data: ArticleDetail | null;
		};

		if (body.code !== 200 && body.code !== 201) {
			throw new Error(body.message);
		}

		return body.data;
	}

	async searchArticles(query: string): Promise<ArticleSearchItem[]> {
		const res = await requestUrl({
			url: `${BASE_URL}/open/law_vector_search`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': this.apiKey,
			},
			body: JSON.stringify({
				query,
				rewrite_flag: true,
				fatiao_filter: { sxx: ['现行有效'] },
				return_num: 5,
			}),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) {
			throw new Error(`HTTP ${res.status}`);
		}

		const body = res.json as {
			msg: string;
			code: number;
			extra: { fatiao: ArticleSearchItem[] };
		};

		if (body.code !== 200 && body.code !== 201) {
			throw new Error(body.msg);
		}

		return body.extra?.fatiao ?? [];
	}

	async fetchCaseDetailsByAh(
		ah: string,
		type: YuandianCaseDetailType,
	): Promise<CaseDetail[]> {
		const params = new URLSearchParams({ ah, type });
		const res = await requestUrl({
			url: `${BASE_URL}/open/rh_case_details?${params.toString()}`,
			method: 'GET',
			headers: {
				Accept: 'application/json',
				'X-API-Key': this.apiKey,
			},
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) {
			throw new Error(`HTTP ${res.status}`);
		}

		const body = res.json as {
			status: string;
			code: number;
			message: string;
			data: CaseDetail[] | null;
		};

		if (body.code !== 200 && body.code !== 201) {
			throw new Error(body.message);
		}

		return body.data ?? [];
	}

	async searchCasesByKeyword(
		query: string,
		type: YuandianCaseKeywordType,
		topK = 5,
	): Promise<CaseKeywordSearchItem[]> {
		const endpoint = type === 'qwal' ? 'rh_qwal_search' : 'rh_ptal_search';
		const requestBody = {
			qw: query,
			search_mode: 'and',
			top_k: topK,
			...(type === 'ptal' ? { wszl: ['判决书', '裁定书'] } : {}),
		};
		const res = await requestUrl({
			url: `${BASE_URL}/open/${endpoint}`,
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json; charset=utf-8',
				'X-API-Key': this.apiKey,
			},
			body: JSON.stringify(requestBody),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) {
			throw new Error(`HTTP ${res.status}`);
		}

		const body = res.json as {
			status: string;
			code: number;
			message: string;
			data: { lst?: CaseKeywordSearchItem[] } | null;
		};

		if (body.code !== 200 && body.code !== 201) {
			throw new Error(body.message);
		}

		return body.data?.lst ?? [];
	}

	async detectHallucination(
		text: string,
	): Promise<HallucinationDetectResponse> {
		const res = await requestUrl({
			url: `${BASE_URL}/open/hall_detect`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-API-Key': this.apiKey,
			},
			body: JSON.stringify({ text }),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) {
			const body = res.json as
				| { success?: boolean; message?: string }
				| undefined;
			const msg = body?.message;
			throw new Error(
				msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`,
			);
		}

		const body = res.json as
			| HallucinationDetectResponse
			| { success: false; message: string };
		if ('success' in body && !(body as { success: boolean }).success) {
			throw new Error((body as { message: string }).message);
		}
		return body as HallucinationDetectResponse;
	}
}
