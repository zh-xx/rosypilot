import { setCompletionsEffect } from 'src/editor/state';
import { InsertRawApplicator } from './insert-raw';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';

import type RosyPilot from 'src/main';

const dispatch = jest.fn();

const request = {
	commandId: 'complete-legal-provision',
	prefix: '',
	editor: {},
	editorView: {
		dispatch,
	},
} as unknown as LegalCommandRequest;

function createRequest(prefix: string): LegalCommandRequest {
	return {
		...request,
		prefix,
	} as LegalCommandRequest;
}

const result: LegalResult = {
	id: 'yuandian:article-1',
	type: 'statute',
	title: '第五百一十一条',
	content: '当事人就有关合同内容约定不明确...',
	source: {
		provider: 'yuandian',
		name: '元典',
	},
	metadata: {},
	raw: {},
};

const caseResult: LegalResult = {
	id: 'yuandian:case-1',
	type: 'case',
	title: '信用卡纠纷一审民事判决书',
	content: '本院认为，被告与原告形成合同关系。',
	source: {
		provider: 'yuandian',
		name: '元典',
	},
	metadata: {
		caseNo: '（2023）京0101民初123号',
		court: '北京市东城区人民法院',
		judgmentDate: '2023年03月22日',
	},
	raw: {},
};

const fuzzyWebCaseResult: LegalResult = {
	id: 'web:tavily:case:fuzzy-1',
	type: 'web',
	title: '违约金过高调整类案',
	content:
		'裁判观点认为，违约金是否过高应结合实际损失、履行情况和过错程度判断。',
	source: {
		provider: 'tavily',
		name: 'Tavily',
		url: 'https://example.com/case',
	},
	metadata: {
		caseQuery: '违约金 过高 调整',
	},
	raw: {},
};

describe('InsertRawApplicator', () => {
	beforeEach(() => {
		dispatch.mockReset();
	});

	it('injects title and content by default', () => {
		const application = new InsertRawApplicator().apply(
			request,
			result,
			{} as RosyPilot,
		);

		const transaction = dispatch.mock.calls[0][0] as {
			effects: {
				is: (effect: unknown) => boolean;
				value: { completions: string };
			}[];
		};
		const effect = transaction.effects[0];

		expect(effect.is(setCompletionsEffect)).toBe(true);
		expect(effect.value.completions).toBe(
			'第五百一十一条\n当事人就有关合同内容约定不明确...',
		);
		expect(application).toEqual({ status: 'success' });
	});

	it('supports content-only and quote-block formats', () => {
		new InsertRawApplicator().apply(
			request,
			result,
			{} as RosyPilot,
			'content',
		);
		new InsertRawApplicator().apply(
			request,
			result,
			{} as RosyPilot,
			'quote-block',
		);

		const contentOnly = dispatch.mock.calls[0][0] as {
			effects: { value: { completions: string } }[];
		};
		const quoteBlock = dispatch.mock.calls[1][0] as {
			effects: { value: { completions: string } }[];
		};

		expect(contentOnly.effects[0].value.completions).toBe(
			'当事人就有关合同内容约定不明确...',
		);
		expect(quoteBlock.effects[0].value.completions).toBe(
			'> 第五百一十一条\n> 当事人就有关合同内容约定不明确...',
		);
	});

	it('starts quote block on a new line when current line already has text', () => {
		new InsertRawApplicator().apply(
			createRequest('根据民法典第一百八十四条'),
			result,
			{} as RosyPilot,
			'quote-block',
		);

		const transaction = dispatch.mock.calls[0][0] as {
			effects: { value: { completions: string } }[];
		};

		expect(transaction.effects[0].value.completions).toBe(
			'\n> 第五百一十一条\n> 当事人就有关合同内容约定不明确...',
		);
	});

	it('includes case metadata when inserting case results', () => {
		new InsertRawApplicator().apply(
			{ ...request, commandId: 'complete-legal-case' },
			caseResult,
			{} as RosyPilot,
			'title-content',
		);

		const transaction = dispatch.mock.calls[0][0] as {
			effects: { value: { completions: string } }[];
		};

		expect(transaction.effects[0].value.completions).toBe(
			'信用卡纠纷一审民事判决书\n（2023）京0101民初123号 · 北京市东城区人民法院 · 2023年03月22日\n\n本院认为，被告与原告形成合同关系。',
		);
	});

	it('uses case formatting for fuzzy web case results', () => {
		new InsertRawApplicator().apply(
			{ ...request, commandId: 'complete-legal-case' },
			fuzzyWebCaseResult,
			{} as RosyPilot,
			'title-content',
		);

		const transaction = dispatch.mock.calls[0][0] as {
			effects: { value: { completions: string } }[];
		};

		expect(transaction.effects[0].value.completions).toBe(
			'违约金过高调整类案\n裁判观点认为，违约金是否过高应结合实际损失、履行情况和过错程度判断。',
		);
	});
});
