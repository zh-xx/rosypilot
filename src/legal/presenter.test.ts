import { LegalResultPresenter } from './presenter';
import { LegalResult } from './runtime/result';

jest.mock('src/i18n', () => ({
	t: (key: string) =>
		({
			'legal.panel.badge.yuandian': '元典',
			'legal.panel.badge.web': 'Web Search',
			'legal.panel.badge.webExtracted': '网页抽取',
			'legal.panel.badge.webSnippet': '网页片段',
			'legal.panel.meta.lawName': '法规名称',
			'legal.panel.meta.articleNo': '条文编号',
			'legal.panel.meta.effectiveStatus': '效力状态',
			'legal.panel.meta.category': '法规类型',
			'legal.panel.meta.publishDate': '发布日期',
			'legal.panel.meta.effectiveDate': '施行日期',
		})[key] ?? key,
}));

function createResult(overrides: Partial<LegalResult> = {}): LegalResult {
	return {
		id: 'yuandian:1',
		type: 'statute',
		title: '第五百一十一条',
		content: '　　第一行\n\t第二行\n\n\n　　第三行',
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
		raw: {},
		...overrides,
	};
}

describe('LegalResultPresenter', () => {
	it('marks yuandian as trusted source and cleans content indentation', () => {
		const display = new LegalResultPresenter().present(createResult());

		expect(display.badge).toBe('元典');
		expect(display.badgeKind).toBe('trusted');
		expect(display.content).toBe('第一行\n第二行\n\n第三行');
		expect(display.collapsible).toBe(false);
		expect(display.metaRows).toEqual([
			{ label: '法规名称', value: '中华人民共和国民法典' },
			{ label: '条文编号', value: '第五百一十一条' },
			{ label: '效力状态', value: '现行有效' },
			{ label: '法规类型', value: '法律' },
			{ label: '发布日期', value: '2020-05-28' },
			{ label: '施行日期', value: '2021-01-01' },
		]);
	});

	it('marks web snippet results and keeps source url', () => {
		const longContent = 'a'.repeat(650);
		const display = new LegalResultPresenter().present(
			createResult({
				id: 'web:1',
				type: 'web',
				content: longContent,
				source: {
					provider: 'tavily',
					name: 'Tavily',
					url: 'https://example.com/legal',
				},
				metadata: {
					lawName: '中华人民共和国民法典',
					articleNo: '第五百一十一条',
				},
			}),
		);

		expect(display.badge).toBe('Tavily · 网页片段');
		expect(display.badgeKind).toBe('web');
		expect(display.collapsible).toBe(true);
		expect(display.previewContent).toHaveLength(203);
		expect(display.sourceUrl).toBe('https://example.com/legal');
	});

	it('marks LLM extracted web results', () => {
		const display = new LegalResultPresenter().present(
			createResult({
				id: 'web:1',
				type: 'web',
				source: {
					provider: 'tavily',
					name: 'Tavily',
				},
				metadata: {
					extractionKind: 'llm-extracted',
				},
			}),
		);

		expect(display.badge).toBe('Tavily · 网页抽取');
	});
});
