import {
	TavilyClient,
	TavilyExactCaseProvider,
	TavilyExactProvider,
	TavilyFuzzyProvider,
} from './tavily-client';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }), {
	virtual: true,
});

describe('TavilyExactProvider', () => {
	it('builds exact provision query and converts Tavily results', async () => {
		const client = {
			search: jest.fn().mockResolvedValue([
				{
					title: '中华人民共和国民法典 第五百一十一条',
					url: 'https://example.com/civil-code-511',
					content: '网页摘要',
					raw_content: '当事人就有关合同内容约定不明确...',
					score: 0.91,
				},
				{
					url: 'https://example.com/no-title',
					content: '备用摘要',
				},
				{},
			]),
		} as unknown as TavilyClient;

		const results = await new TavilyExactProvider(client).searchExactProvision({
			fgmc: '中华人民共和国民法典',
			ftnum: '第五百一十一条',
		});

		expect(client.search).toHaveBeenCalledWith(
			'中华人民共和国民法典 第五百一十一条 法条 原文',
		);
		expect(results).toEqual([
			{
				providerId: 'tavily',
				providerName: 'Tavily',
				url: 'https://example.com/civil-code-511',
				title: '中华人民共和国民法典 第五百一十一条',
				content: '当事人就有关合同内容约定不明确...',
				lawName: '中华人民共和国民法典',
				articleNo: '第五百一十一条',
				score: 0.91,
				raw: {
					title: '中华人民共和国民法典 第五百一十一条',
					url: 'https://example.com/civil-code-511',
					content: '网页摘要',
					raw_content: '当事人就有关合同内容约定不明确...',
					score: 0.91,
				},
			},
			{
				providerId: 'tavily',
				providerName: 'Tavily',
				url: 'https://example.com/no-title',
				title: '中华人民共和国民法典第五百一十一条',
				content: '备用摘要',
				lawName: '中华人民共和国民法典',
				articleNo: '第五百一十一条',
				score: undefined,
				raw: {
					url: 'https://example.com/no-title',
					content: '备用摘要',
				},
			},
		]);
	});
});

describe('TavilyFuzzyProvider', () => {
	it('builds fuzzy provision query and converts Tavily results', async () => {
		const client = {
			search: jest.fn().mockResolvedValue([
				{
					title: '民法典第511条',
					url: 'https://example.com/civil-code-511',
					content: '履行地点约定不明时...',
					score: 0.98,
				},
				{},
			]),
		} as unknown as TavilyClient;

		const results = await new TavilyFuzzyProvider(client).searchFuzzyProvisions(
			'履行地点约定不明',
		);

		expect(client.search).toHaveBeenCalledWith(
			'履行地点约定不明 相关法条 原文',
		);
		expect(results).toEqual([
			{
				providerId: 'tavily',
				providerName: 'Tavily',
				url: 'https://example.com/civil-code-511',
				title: '民法典第511条',
				content: '履行地点约定不明时...',
				score: 0.98,
				raw: {
					title: '民法典第511条',
					url: 'https://example.com/civil-code-511',
					content: '履行地点约定不明时...',
					score: 0.98,
				},
			},
		]);
	});
});

describe('TavilyExactCaseProvider', () => {
	it('builds exact case query and converts Tavily results', async () => {
		const client = {
			search: jest.fn().mockResolvedValue([
				{
					title: '案例详情',
					url: 'https://example.com/case',
					content: '裁判文书摘要',
					score: 0.87,
				},
				{},
			]),
		} as unknown as TavilyClient;

		const results = await new TavilyExactCaseProvider(client).searchExactCase(
			'（2023）京0101民初123号',
		);

		expect(client.search).toHaveBeenCalledWith(
			'（2023）京0101民初123号 裁判文书 案例 原文',
		);
		expect(results).toEqual([
			{
				providerId: 'tavily',
				providerName: 'Tavily',
				url: 'https://example.com/case',
				title: '案例详情',
				content: '裁判文书摘要',
				caseNo: '（2023）京0101民初123号',
				score: 0.87,
				raw: {
					title: '案例详情',
					url: 'https://example.com/case',
					content: '裁判文书摘要',
					score: 0.87,
				},
			},
		]);
	});
});
