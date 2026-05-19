import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';
import {
	WebExactCaseSearchProvider,
	WebCaseExactExecutor,
} from './web-case-exact';

import type RosyPilot from 'src/main';

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

describe('WebCaseExactExecutor', () => {
	it('requires exact-case route and provider', () => {
		const provider: WebExactCaseSearchProvider = {
			id: 'tavily',
			label: 'Tavily',
			searchExactCase: jest.fn(),
		};

		expect(
			new WebCaseExactExecutor(provider).canRun(
				request,
				route,
				{} as RosyPilot,
			),
		).toBe(true);
		expect(
			new WebCaseExactExecutor().canRun(request, route, {} as RosyPilot),
		).toBe(false);
		expect(
			new WebCaseExactExecutor(provider).canRun(
				request,
				{ kind: 'none' },
				{} as RosyPilot,
			),
		).toBe(false);
	});

	it('queries exact case and normalizes web results', async () => {
		const provider: WebExactCaseSearchProvider = {
			id: 'tavily',
			label: 'Tavily',
			searchExactCase: jest.fn().mockResolvedValue([
				{
					providerId: 'tavily',
					providerName: 'Tavily',
					url: 'https://example.com/case',
					title: '案例网页标题',
					content: '案例网页摘要',
					caseNo: '（2023）京0101民初123号',
					score: 0.8,
					raw: { title: '案例网页标题' },
				},
			]),
		};

		const results = await new WebCaseExactExecutor(provider).run(
			request,
			route,
			{} as RosyPilot,
		);

		expect(provider.searchExactCase).toHaveBeenCalledWith(
			'（2023）京0101民初123号',
		);
		expect(results).toEqual([
			expect.objectContaining({
				id: 'web:tavily:case:https://example.com/case',
				type: 'web',
				title: '案例网页标题',
				content: '案例网页摘要',
				metadata: expect.objectContaining({
					caseNo: '（2023）京0101民初123号',
					extractionKind: 'web-snippet',
					score: 0.8,
				}),
			}),
		]);
	});
});
