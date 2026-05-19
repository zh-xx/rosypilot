import { requestUrl } from 'obsidian';
import { setCompletionsEffect } from 'src/editor/state';
import { InsertAdaptedApplicator } from './insert-adapted';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';

import type RosyPilot from 'src/main';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }), {
	virtual: true,
});

const mockedRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;
const dispatch = jest.fn();

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
	title:
		'交通银行股份有限公司太平洋信用卡中心北京分中心与李冬兵信用卡纠纷一审民事判决书',
	content: '本院认为，被告与原告形成合同关系...',
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

function createRequest(prefix: string): LegalCommandRequest {
	return {
		commandId: 'complete-legal-provision',
		prefix,
		editor: {},
		editorView: {
			dispatch,
		},
	} as unknown as LegalCommandRequest;
}

function createPlugin(apiKey?: string, model?: string): RosyPilot {
	return {
		settings: {
			completions: {
				provider: 'deepseek',
				model,
			},
			providers: {
				deepseek: {
					apiKey,
				},
			},
		},
	} as RosyPilot;
}

describe('InsertAdaptedApplicator', () => {
	beforeEach(() => {
		mockedRequestUrl.mockReset();
		dispatch.mockReset();
	});

	it('requests adapted text and injects returned content as ghost text', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				choices: [
					{
						message: {
							content: '规定："当事人就有关合同内容约定不明确..."',
						},
					},
				],
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const application = await new InsertAdaptedApplicator().apply(
			createRequest(
				'关于履行地点约定不明的问题，《中华人民共和国民法典》第五百一十一条',
			),
			result,
			createPlugin('deepseek-key', 'deepseek-chat'),
		);

		expect(mockedRequestUrl).toHaveBeenCalledWith(
			expect.objectContaining({
				url: 'https://api.deepseek.com/chat/completions',
				method: 'POST',
				headers: expect.objectContaining({
					Authorization: 'Bearer deepseek-key',
				}),
				throw: false,
			}),
		);

		const body = JSON.parse(
			(mockedRequestUrl.mock.calls[0][0] as { body: string }).body,
		) as {
			model: string;
			messages: { role: string; content: string }[];
			max_tokens: number;
			temperature: number;
		};
		expect(body.model).toBe('deepseek-chat');
		expect(body.max_tokens).toBe(4096);
		expect(body.temperature).toBe(0.3);
		expect(body.messages[1].content).toContain(
			'关于履行地点约定不明的问题，《中华人民共和国民法典》第五百一十一条',
		);
		expect(body.messages[1].content).toContain('第五百一十一条');
		expect(body.messages[1].content).toContain(
			'当事人就有关合同内容约定不明确...',
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
			'规定："当事人就有关合同内容约定不明确..."',
		);
		expect(application).toEqual({ status: 'success' });
	});

	it('does not request LLM when api key or model is missing', async () => {
		const missingKey = await new InsertAdaptedApplicator().apply(
			createRequest('prefix'),
			result,
			createPlugin(undefined, 'deepseek-chat'),
		);
		const missingModel = await new InsertAdaptedApplicator().apply(
			createRequest('prefix'),
			result,
			createPlugin('deepseek-key'),
		);

		expect(mockedRequestUrl).not.toHaveBeenCalled();
		expect(dispatch).not.toHaveBeenCalled();
		expect(missingKey).toEqual({
			status: 'failed',
			reason: 'missing-llm-config',
		});
		expect(missingModel).toEqual({
			status: 'failed',
			reason: 'missing-llm-config',
		});
	});

	it('uses case prompt and context for case results', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				choices: [
					{
						message: {
							content: '该案认为，被告与原告形成合同关系。',
						},
					},
				],
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const application = await new InsertAdaptedApplicator().apply(
			createRequest('类似案例可参见（2023）京0101民初123号，'),
			caseResult,
			createPlugin('deepseek-key', 'deepseek-chat'),
		);

		const body = JSON.parse(
			(mockedRequestUrl.mock.calls[0][0] as { body: string }).body,
		) as {
			messages: { role: string; content: string }[];
		};

		expect(body.messages[0].content).toContain('相关案例');
		expect(body.messages[0].content).toContain('裁判观点');
		expect(body.messages[0].content).not.toContain('法条最相关的原文');
		expect(body.messages[1].content).toContain('【相关案例】');
		expect(body.messages[1].content).toContain('（2023）京0101民初123号');
		expect(body.messages[1].content).toContain('北京市东城区人民法院');
		expect(application).toEqual({ status: 'success' });
	});

	it('does not inject ghost text when LLM returns empty content', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				choices: [{ message: { content: '   ' } }],
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const application = await new InsertAdaptedApplicator().apply(
			createRequest('prefix'),
			result,
			createPlugin('deepseek-key', 'deepseek-chat'),
		);

		expect(dispatch).not.toHaveBeenCalled();
		expect(application).toEqual({
			status: 'failed',
			reason: 'empty-result',
		});
	});

	it('returns http error when LLM request fails', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 401,
			json: {},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const application = await new InsertAdaptedApplicator().apply(
			createRequest('prefix'),
			result,
			createPlugin('deepseek-key', 'deepseek-chat'),
		);

		expect(dispatch).not.toHaveBeenCalled();
		expect(application).toEqual({
			status: 'failed',
			reason: 'http-error',
			message: 'HTTP 401',
		});
	});
});
