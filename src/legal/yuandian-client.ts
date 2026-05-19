import { requestUrl } from 'obsidian';

const BASE_URL = 'https://open.chineselaw.com';

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
}
