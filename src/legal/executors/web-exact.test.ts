import { WebExactExecutor, WebExactSearchProvider } from './web-exact';
import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';

import type RosyPilot from 'src/main';

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

const plugin = {} as RosyPilot;

function createProvider(): WebExactSearchProvider {
	return {
		id: 'tavily',
		label: 'Tavily',
		searchExactProvision: jest.fn().mockResolvedValue([
			{
				providerId: 'tavily',
				providerName: 'Tavily',
				url: 'https://example.com/civil-code-511',
				title: '中华人民共和国民法典 第五百一十一条',
				content: '当事人就有关合同内容约定不明确...',
				lawName: '中华人民共和国民法典',
				articleNo: '第五百一十一条',
				score: 0.92,
				raw: {
					title: '中华人民共和国民法典 第五百一十一条',
				},
			},
		]),
	};
}

describe('WebExactExecutor', () => {
	it('requires exact route and a web search provider', () => {
		const executor = new WebExactExecutor(createProvider());
		const emptyExecutor = new WebExactExecutor();

		expect(executor.canRun(request, exactRoute, plugin)).toBe(true);
		expect(emptyExecutor.canRun(request, exactRoute, plugin)).toBe(false);
		expect(executor.canRun(request, { kind: 'none' }, plugin)).toBe(false);
	});

	it('converts web provider results to LegalResult', async () => {
		const provider = createProvider();
		const results = await new WebExactExecutor(provider).run(
			request,
			exactRoute,
			plugin,
		);

		expect(provider.searchExactProvision).toHaveBeenCalledWith(exactRoute.ref);
		expect(results).toEqual([
			expect.objectContaining({
				id: 'web:tavily:https://example.com/civil-code-511',
				type: 'web',
				title: '中华人民共和国民法典 第五百一十一条',
				content: '当事人就有关合同内容约定不明确...',
				source: {
					provider: 'tavily',
					name: 'Tavily',
					url: 'https://example.com/civil-code-511',
				},
				metadata: {
					lawName: '中华人民共和国民法典',
					articleNo: '第五百一十一条',
					effectiveStatus: undefined,
					publishDate: undefined,
					effectiveDate: undefined,
					score: 0.92,
				},
			}),
		]);
	});
});
