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
});
