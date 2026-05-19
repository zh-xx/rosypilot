import { requestUrl } from 'obsidian';
import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';
import { YuandianCaseExactExecutor } from './yuandian-case-exact';

import type RosyPilot from 'src/main';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }), {
	virtual: true,
});

const mockedRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

const route: LegalCommandRoute = {
	kind: 'exact-case',
	ref: { ah: '（2023）京0101民初123号' },
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

describe('YuandianCaseExactExecutor', () => {
	beforeEach(() => {
		mockedRequestUrl.mockReset();
	});

	it('requires exact-case route and yuandian api key', () => {
		const executor = new YuandianCaseExactExecutor();

		expect(executor.canRun(request, route, createPlugin('key'))).toBe(true);
		expect(executor.canRun(request, route, createPlugin())).toBe(false);
		expect(
			executor.canRun(request, { kind: 'none' }, createPlugin('key')),
		).toBe(false);
	});

	it('queries qwal and ptal and returns authoritative cases first', async () => {
		mockedRequestUrl
			.mockResolvedValueOnce({
				status: 200,
				json: {
					code: 200,
					status: 'success',
					message: '请求成功',
					data: [
						{
							id: 'qwal-1',
							type: '权威案例',
							ah: '（2023）京0101民初123号',
							title: '权威案例标题',
							jbdw: '最高人民法院',
							ay: '买卖合同纠纷',
							ajlb: '民事案件',
							spcx: '二审案件',
							wszl: '判决书',
							cprq: '2023年03月22日',
							content: ' 权威案例正文 ',
							url: '/ydzk/caseDetail/qwcase/qwal-1',
						},
					],
				},
			} as Awaited<ReturnType<typeof requestUrl>>)
			.mockResolvedValueOnce({
				status: 200,
				json: {
					code: 200,
					status: 'success',
					message: '请求成功',
					data: [
						{
							id: 'ptal-1',
							type: '普通案例',
							ah: '（2023）京0101民初123号',
							title: '普通案例标题',
							jbdw: '北京市东城区人民法院',
							ay: ['信用卡纠纷'],
							ajlb: '民事案件',
							spcx: '一审案件',
							wszl: '判决书',
							cprq: '2023年03月22日',
							content: ' 普通案例正文 ',
							url: '/ydzk/caseDetail/case/ptal-1',
						},
					],
				},
			} as Awaited<ReturnType<typeof requestUrl>>);

		const results = await new YuandianCaseExactExecutor().run(
			request,
			route,
			createPlugin('yuandian-key'),
		);

		expect(mockedRequestUrl).toHaveBeenCalledTimes(2);
		expect(mockedRequestUrl).toHaveBeenNthCalledWith(
			1,
			expect.objectContaining({
				url: expect.stringContaining('type=qwal'),
				method: 'GET',
				headers: expect.objectContaining({
					'X-API-Key': 'yuandian-key',
				}),
				throw: false,
			}),
		);
		expect(mockedRequestUrl).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({
				url: expect.stringContaining('type=ptal'),
			}),
		);
		expect(results.map((result) => result.title)).toEqual([
			'权威案例标题',
			'普通案例标题',
		]);
		expect(results[0]).toEqual(
			expect.objectContaining({
				id: 'yuandian:case:qwal-1',
				type: 'case',
				content: '权威案例正文',
				source: expect.objectContaining({
					provider: 'yuandian',
					name: '元典',
					url: 'https://www.chineselaw.com/ydzk/caseDetail/qwcase/qwal-1',
				}),
				metadata: expect.objectContaining({
					caseNo: '（2023）京0101民初123号',
					court: '最高人民法院',
					cause: '买卖合同纠纷',
					caseSourceType: '权威案例',
				}),
			}),
		);
		expect(results[1].metadata.cause).toBe('信用卡纠纷');
	});

	it('returns an empty list when both case libraries are empty', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				code: 200,
				status: 'success',
				message: '未查询到相关内容',
				data: null,
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const results = await new YuandianCaseExactExecutor().run(
			request,
			route,
			createPlugin('yuandian-key'),
		);

		expect(results).toEqual([]);
	});
});
