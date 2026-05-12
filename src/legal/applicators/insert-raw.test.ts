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

	it('injects title and content as ghost text', () => {
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
});
