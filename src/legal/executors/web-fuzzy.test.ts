import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';
import { WebFuzzyExecutor, WebFuzzySearchProvider } from './web-fuzzy';

import type RosyPilot from 'src/main';

const fuzzyRoute: LegalCommandRoute = {
	kind: 'fuzzy-provision',
	query: '履行地点约定不明',
};

const request = {
	commandId: 'complete-legal-provision',
	prefix: '',
	editor: {},
	editorView: {},
} as LegalCommandRequest;

const plugin = {} as RosyPilot;

function createProvider(): WebFuzzySearchProvider {
	return {
		id: 'tavily',
		label: 'Tavily',
		searchFuzzyProvisions: jest.fn().mockResolvedValue([
			{
				providerId: 'tavily',
				providerName: 'Tavily',
				url: 'https://example.com/civil-code-511',
				title: '民法典第511条',
				content: '合同履行地点不明确...',
				score: 0.98,
				raw: {
					title: '民法典第511条',
				},
			},
		]),
	};
}

describe('WebFuzzyExecutor', () => {
	it('requires fuzzy route and a web search provider', () => {
		const executor = new WebFuzzyExecutor(createProvider());
		const emptyExecutor = new WebFuzzyExecutor();

		expect(executor.canRun(request, fuzzyRoute, plugin)).toBe(true);
		expect(emptyExecutor.canRun(request, fuzzyRoute, plugin)).toBe(false);
		expect(executor.canRun(request, { kind: 'none' }, plugin)).toBe(false);
	});

	it('converts web fuzzy provider results to LegalResult', async () => {
		const provider = createProvider();
		const results = await new WebFuzzyExecutor(provider).run(
			request,
			fuzzyRoute,
			plugin,
		);

		expect(provider.searchFuzzyProvisions).toHaveBeenCalledWith(
			'履行地点约定不明',
		);
		expect(results).toEqual([
			expect.objectContaining({
				id: 'web:tavily:https://example.com/civil-code-511',
				type: 'web',
				title: '民法典第511条',
				content: '合同履行地点不明确...',
				source: {
					provider: 'tavily',
					name: 'Tavily',
					url: 'https://example.com/civil-code-511',
				},
				metadata: expect.objectContaining({
					score: 0.98,
					extractionKind: 'web-snippet',
				}),
			}),
		]);
	});
});
