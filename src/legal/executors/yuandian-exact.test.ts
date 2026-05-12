import { requestUrl } from 'obsidian';
import { YuandianExactExecutor } from './yuandian-exact';
import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';

import type RosyPilot from 'src/main';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }), {
	virtual: true,
});

const mockedRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

const exactRoute: LegalCommandRoute = {
	kind: 'exact-provision',
	ref: {
		fgmc: '中华人民共和国民法典',
		ftnum: '第五百一十一条',
	},
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

describe('YuandianExactExecutor', () => {
	beforeEach(() => {
		mockedRequestUrl.mockReset();
	});

	it('requires exact route and yuandian api key', () => {
		const executor = new YuandianExactExecutor();

		expect(executor.canRun(request, exactRoute, createPlugin('key'))).toBe(
			true,
		);
		expect(executor.canRun(request, exactRoute, createPlugin())).toBe(false);
		expect(
			executor.canRun(request, { kind: 'none' }, createPlugin('key')),
		).toBe(false);
	});

	it('converts yuandian article detail to LegalResult', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				code: 200,
				data: {
					id: 'article-1',
					fgmc: '中华人民共和国民法典',
					ft_num: '第五百一十一条',
					ftmc: '第五百一十一条',
					content: '当事人就有关合同内容约定不明确...',
					sxx: '现行有效',
					xljb_1: '法律',
					fbrq: '2020-05-28',
					ssrq: '2021-01-01',
				},
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const results = await new YuandianExactExecutor().run(
			request,
			exactRoute,
			createPlugin('yuandian-key'),
		);

		expect(mockedRequestUrl).toHaveBeenCalledWith(
			expect.objectContaining({
				url: 'https://open.chineselaw.com/open/rh_ft_detail',
				method: 'POST',
				headers: expect.objectContaining({
					'X-API-Key': 'yuandian-key',
				}),
				body: JSON.stringify({
					fgmc: '中华人民共和国民法典',
					ftnum: '第五百一十一条',
				}),
			}),
		);
		expect(results).toEqual([
			expect.objectContaining({
				id: 'yuandian:article-1',
				type: 'statute',
				title: '第五百一十一条',
				content: '当事人就有关合同内容约定不明确...',
				source: {
					provider: 'yuandian',
					name: '元典',
				},
				metadata: {
					lawName: '中华人民共和国民法典',
					articleNo: '第五百一十一条',
					effectiveStatus: '现行有效',
					category: '法律',
					publishDate: '2020-05-28',
					effectiveDate: '2021-01-01',
				},
			}),
		]);
	});

	it('returns empty results when yuandian has no article detail', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				code: 200,
				data: null,
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const results = await new YuandianExactExecutor().run(
			request,
			exactRoute,
			createPlugin('yuandian-key'),
		);

		expect(results).toEqual([]);
	});
});
