import { requestUrl } from 'obsidian';
import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';
import {
	rankYuandianSemanticArticles,
	YuandianSemanticExecutor,
} from './yuandian-semantic';

import type RosyPilot from 'src/main';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }), {
	virtual: true,
});

const mockedRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

const fuzzyRoute: LegalCommandRoute = {
	kind: 'fuzzy-provision',
	query: '合同违约责任的认定与赔偿',
};

const request = {
	commandId: 'complete-legal-provision',
	prefix: '',
	editor: {},
	editorView: {},
} as LegalCommandRequest;

function createPlugin(apiKey?: string): RosyPilot {
	return {
		settings: {
			legal: {
				yuandianApiKey: apiKey,
			},
		},
	} as RosyPilot;
}

describe('YuandianSemanticExecutor', () => {
	beforeEach(() => {
		mockedRequestUrl.mockReset();
	});

	it('requires fuzzy route and yuandian api key', () => {
		const executor = new YuandianSemanticExecutor();

		expect(executor.canRun(request, fuzzyRoute, createPlugin('key'))).toBe(
			true,
		);
		expect(executor.canRun(request, fuzzyRoute, createPlugin())).toBe(false);
		expect(
			executor.canRun(request, { kind: 'none' }, createPlugin('key')),
		).toBe(false);
	});

	it('queries law vector search and converts article candidates', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				code: 201,
				msg: '成功',
				extra: {
					fatiao: [
						{
							ftid: 'civil-code-584',
							fgid: 'civil-code',
							fgtitle: '中华人民共和国民法典',
							num: '第五百八十四条',
							content: '　当事人一方不履行合同义务...',
							sxx: '现行有效',
							effect1: '法律',
							start: 20210101,
							score: 1.134,
						},
					],
				},
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const results = await new YuandianSemanticExecutor().run(
			request,
			fuzzyRoute,
			createPlugin('yuandian-key'),
		);

		expect(mockedRequestUrl).toHaveBeenCalledWith(
			expect.objectContaining({
				url: 'https://open.chineselaw.com/open/law_vector_search',
				method: 'POST',
				headers: expect.objectContaining({
					'X-API-Key': 'yuandian-key',
				}),
				body: JSON.stringify({
					query: '合同违约责任的认定与赔偿',
					rewrite_flag: true,
					fatiao_filter: { sxx: ['现行有效'] },
					return_num: 5,
				}),
				throw: false,
			}),
		);
		expect(results).toEqual([
			expect.objectContaining({
				id: 'yuandian:civil-code-584',
				type: 'statute',
				title: '中华人民共和国民法典第五百八十四条',
				content: '当事人一方不履行合同义务...',
				source: {
					provider: 'yuandian',
					name: '元典',
				},
				metadata: expect.objectContaining({
					lawName: '中华人民共和国民法典',
					articleNo: '第五百八十四条',
					effectiveStatus: '现行有效',
					category: '法律',
					effectiveDate: '2021-01-01',
					score: 1.134,
				}),
			}),
		]);
	});

	it('ranks formal sources before practice materials while keeping broad recall', () => {
		const ranked = rankYuandianSemanticArticles([
			{
				ftid: 'digest-8',
				fgid: 'digest',
				fgtitle: '最高人民法院知识产权法庭裁判要旨摘要(2021)',
				num: '第八条',
				content: '裁判要旨',
				sxx: '现行有效',
				effect1: '司法解释',
				score: 1.5,
			},
			{
				ftid: 'civil-code-511',
				fgid: 'civil-code',
				fgtitle: '中华人民共和国民法典',
				num: '第五百一十一条',
				content: '履行地点约定不明',
				sxx: '现行有效',
				effect1: '法律',
				score: 1.1,
			},
			{
				ftid: 'local-rule-1',
				fgid: 'local-rule',
				fgtitle: '地方规范性文件',
				num: '第一条',
				content: '地方文件',
				sxx: '现行有效',
				effect1: '地方规范性文件',
				score: 1.2,
			},
		]);

		expect(ranked.map((item) => item.ftid)).toEqual([
			'civil-code-511',
			'local-rule-1',
			'digest-8',
		]);
	});
});
