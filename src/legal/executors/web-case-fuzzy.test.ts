import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';
import {
	WebFuzzyCaseSearchProvider,
	WebCaseFuzzyExecutor,
} from './web-case-fuzzy';

import type RosyPilot from 'src/main';

const route: LegalCommandRoute = {
	kind: 'fuzzy-case',
	query: '违约金过高调整',
};

const request = {
	commandId: 'complete-legal-case',
	prefix: '',
	editor: {},
	editorView: {},
} as LegalCommandRequest;

describe('WebCaseFuzzyExecutor', () => {
	it('requires fuzzy-case route and provider', () => {
		const provider: WebFuzzyCaseSearchProvider = {
			id: 'tavily',
			label: 'Tavily',
			searchFuzzyCases: jest.fn(),
		};

		expect(
			new WebCaseFuzzyExecutor(provider).canRun(
				request,
				route,
				{} as RosyPilot,
			),
		).toBe(true);
		expect(
			new WebCaseFuzzyExecutor().canRun(request, route, {} as RosyPilot),
		).toBe(false);
		expect(
			new WebCaseFuzzyExecutor(provider).canRun(
				request,
				{ kind: 'none' },
				{} as RosyPilot,
			),
		).toBe(false);
	});

	it('queries fuzzy cases and normalizes web results', async () => {
		const provider: WebFuzzyCaseSearchProvider = {
			id: 'tavily',
			label: 'Tavily',
			searchFuzzyCases: jest.fn().mockResolvedValue([
				{
					providerId: 'tavily',
					providerName: 'Tavily',
					url: 'https://example.com/case',
					title: '违约金调整案例',
					content: '违约金过高可以调整...',
					caseQuery: '违约金过高调整',
					score: 0.88,
					raw: { title: '违约金调整案例' },
				},
			]),
		};

		const results = await new WebCaseFuzzyExecutor(provider).run(
			request,
			route,
			{} as RosyPilot,
		);

		expect(provider.searchFuzzyCases).toHaveBeenCalledWith('违约金过高调整');
		expect(results).toEqual([
			expect.objectContaining({
				id: 'web:tavily:case:https://example.com/case',
				type: 'web',
				title: '违约金调整案例',
				content: '违约金过高可以调整...',
				metadata: expect.objectContaining({
					caseQuery: '违约金过高调整',
					extractionKind: 'web-snippet',
					score: 0.88,
				}),
			}),
		]);
	});
});
