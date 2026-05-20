import { requestUrl } from 'obsidian';
import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';
import { YuandianCaseKeywordExecutor } from './yuandian-case-keyword';

import type RosyPilot from 'src/main';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }), {
	virtual: true,
});

const mockedRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

const route: LegalCommandRoute = {
	kind: 'fuzzy-case',
	query: '信用卡纠纷中利息费用上限',
};

const request = {
	commandId: 'complete-legal-case',
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

describe('YuandianCaseKeywordExecutor', () => {
	beforeEach(() => {
		mockedRequestUrl.mockReset();
	});

	it('requires fuzzy-case route and yuandian api key', () => {
		const executor = new YuandianCaseKeywordExecutor();

		expect(executor.canRun(request, route, createPlugin('key'))).toBe(true);
		expect(executor.canRun(request, route, createPlugin())).toBe(false);
		expect(
			executor.canRun(request, { kind: 'none' }, createPlugin('key')),
		).toBe(false);
	});

	it('queries qwal first and supplements with ptal when authoritative results are insufficient', async () => {
		mockedRequestUrl
			.mockResolvedValueOnce({
				status: 200,
				json: {
					code: 200,
					status: 'success',
					message: '请求成功',
					data: {
						total: 1,
						lst: [
							{
								id: 'qwal-1',
								type: '参考案例',
								ah: '（2024）吉7502民初22号',
								title: '某银行诉孟某荣信用卡纠纷案',
								jbdw: '和龙林区基层法院',
								ay: ['银行卡纠纷'],
								ajlb: '民事案件',
								wszl: '判决书',
								cprq: '2024年03月29日',
								content:
									'裁判要旨：信用卡透支交易本质上是金融机构向持卡人出借款项。',
								url: '/ydzk/caseDetail/qwcase/qwal-1',
								score: 20.68,
							},
						],
					},
				},
			} as Awaited<ReturnType<typeof requestUrl>>)
			.mockResolvedValueOnce({
				status: 200,
				json: {
					code: 200,
					status: 'success',
					message: '请求成功',
					data: {
						total: 1,
						lst: [
							{
								id: 'ptal-1',
								type: '普通案例',
								ah: '（2024）桂1302民初744号',
								title: '信用卡纠纷一审民事判决书',
								jbdw: '来宾市兴宾区人民法院',
								ay: ['信用卡纠纷'],
								ajlb: '民事案件',
								wszl: '判决书',
								cprq: '2024年10月09日',
								content: '本院认为，利息和违约金的总额以年利率24%为上限计算。',
								url: '/ydzk/caseDetail/case/ptal-1',
								score: 22.33,
							},
						],
					},
				},
			} as Awaited<ReturnType<typeof requestUrl>>);

		const results = await new YuandianCaseKeywordExecutor().run(
			request,
			route,
			createPlugin('yuandian-key'),
		);

		expect(mockedRequestUrl).toHaveBeenCalledTimes(2);
		expect(mockedRequestUrl).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				url: 'https://open.chineselaw.com/open/rh_qwal_search',
				method: 'POST',
				headers: expect.objectContaining({
					'X-API-Key': 'yuandian-key',
				}),
				body: JSON.stringify({
					qw: '信用卡纠纷中利息费用上限',
					search_mode: 'and',
					top_k: 5,
				}),
				throw: false,
			}),
		);
		expect(mockedRequestUrl).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				url: 'https://open.chineselaw.com/open/rh_ptal_search',
				body: JSON.stringify({
					qw: '信用卡纠纷中利息费用上限',
					search_mode: 'and',
					top_k: 5,
					wszl: ['判决书', '裁定书'],
				}),
			}),
		);
		expect(results).toEqual([
			expect.objectContaining({
				id: 'yuandian:case:qwal-1',
				type: 'case',
				title: '某银行诉孟某荣信用卡纠纷案',
				content: '裁判要旨：信用卡透支交易本质上是金融机构向持卡人出借款项。',
				metadata: expect.objectContaining({
					caseNo: '（2024）吉7502民初22号',
					caseSourceType: '参考案例',
					caseQuery: '信用卡纠纷中利息费用上限',
					score: 20.68,
				}),
			}),
			expect.objectContaining({
				id: 'yuandian:case:ptal-1',
				title: '信用卡纠纷一审民事判决书',
				metadata: expect.objectContaining({
					caseSourceType: '普通案例',
				}),
			}),
		]);
	});

	it('does not query ptal when qwal returns enough results', async () => {
		mockedRequestUrl.mockResolvedValueOnce({
			status: 200,
			json: {
				code: 200,
				status: 'success',
				message: '请求成功',
				data: {
					total: 3,
					lst: ['1', '2', '3'].map((id) => ({
						id,
						type: '参考案例',
						title: `案例${id}`,
						content: `内容${id}`,
					})),
				},
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const results = await new YuandianCaseKeywordExecutor().run(
			request,
			route,
			createPlugin('yuandian-key'),
		);

		expect(mockedRequestUrl).toHaveBeenCalledTimes(1);
		expect(results).toHaveLength(3);
	});
});
