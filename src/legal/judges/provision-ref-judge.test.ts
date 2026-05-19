import { requestUrl } from 'obsidian';
import {
	findLastExactLegalRef,
	parseLegalRefResponse,
	parseLegalRouteResponse,
	ProvisionRefJudge,
} from './provision-ref-judge';

import type RosyPilot from 'src/main';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }), {
	virtual: true,
});

const mockedRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

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

describe('parseLegalRefResponse', () => {
	it.each([
		['null'],
		['NULL'],
		[''],
		['not json'],
		['{ "fgmc": "", "ftnum": "第五百一十一条" }'],
		['{ "fgmc": "中华人民共和国民法典", "ftnum": "" }'],
		['{ "fgmc": "中华人民共和国民法典" }'],
		['{ "fgmc": "法规名称", "ftnum": "第X条" }'],
		[
			'请返回格式：{"fgmc":"法规名称","ftnum":"第X条"}。但当前文本无具体引用，应返回 null。',
		],
	])('returns null for invalid response: %s', (content) => {
		expect(parseLegalRefResponse(content)).toBeNull();
	});

	it('parses pure JSON response', () => {
		expect(
			parseLegalRefResponse(
				'{ "fgmc": "中华人民共和国民法典", "ftnum": "第五百一十一条" }',
			),
		).toEqual({
			fgmc: '中华人民共和国民法典',
			ftnum: '第五百一十一条',
		});
	});

	it('parses fenced JSON response', () => {
		expect(
			parseLegalRefResponse(
				'```json\n{ "fgmc": "中华人民共和国公司法", "ftnum": "第八十八条第二款" }\n```',
			),
		).toEqual({
			fgmc: '中华人民共和国公司法',
			ftnum: '第八十八条第二款',
		});
	});

	it('parses JSON embedded in explanatory text', () => {
		expect(
			parseLegalRefResponse(
				'识别结果如下：{ "fgmc": "民法典", "ftnum": "第五百七十七条" }。',
			),
		).toEqual({
			fgmc: '民法典',
			ftnum: '第五百七十七条',
		});
	});

	it('uses the last item when LLM returns an array of legal refs', () => {
		expect(
			parseLegalRefResponse(
				'[{ "fgmc": "中华人民共和国民法典", "ftnum": "第五百一十一条" }, { "fgmc": "中华人民共和国公司法", "ftnum": "第八十八条第二款" }]',
			),
		).toEqual({
			fgmc: '中华人民共和国公司法',
			ftnum: '第八十八条第二款',
		});
	});

	it('uses the last object when LLM returns multiple embedded JSON objects', () => {
		expect(
			parseLegalRefResponse(
				'第一处：{ "fgmc": "中华人民共和国民法典", "ftnum": "第五百一十一条" }；第二处：{ "fgmc": "中华人民共和国公司法", "ftnum": "第八十八条第二款" }',
			),
		).toEqual({
			fgmc: '中华人民共和国公司法',
			ftnum: '第八十八条第二款',
		});
	});

	it('trims parsed fields', () => {
		expect(
			parseLegalRefResponse(
				'{ "fgmc": " 中华人民共和国民法典 ", "ftnum": " 第五百一十一条 " }',
			),
		).toEqual({
			fgmc: '中华人民共和国民法典',
			ftnum: '第五百一十一条',
		});
	});
});

describe('parseLegalRouteResponse', () => {
	it('parses fuzzy provision route', () => {
		expect(
			parseLegalRouteResponse(
				'{ "kind": "fuzzy-provision", "query": "合同违约责任的认定与赔偿" }',
			),
		).toEqual({
			kind: 'fuzzy-provision',
			query: '合同违约责任的认定与赔偿',
		});
	});

	it('keeps backward-compatible exact provision JSON', () => {
		expect(
			parseLegalRouteResponse(
				'{ "fgmc": "中华人民共和国民法典", "ftnum": "第五百一十一条" }',
			),
		).toEqual({
			kind: 'exact-provision',
			ref: {
				fgmc: '中华人民共和国民法典',
				ftnum: '第五百一十一条',
			},
		});
	});
});

describe('findLastExactLegalRef', () => {
	it('finds the last bracketed exact legal reference', () => {
		expect(
			findLastExactLegalRef(
				'关于履行地点约定不明的问题，《中华人民共和国民法典》第五百一十一条。另就股权转让责任，《中华人民共和国公司法》第八十八条第二款',
			),
		).toEqual({
			fgmc: '中华人民共和国公司法',
			ftnum: '第八十八条第二款',
		});
	});

	it('finds the last unbracketed exact legal reference', () => {
		expect(
			findLastExactLegalRef(
				'先看中华人民共和国民法典第五百一十一条，再看中华人民共和国民法典第五百七十七条',
			),
		).toEqual({
			fgmc: '中华人民共和国民法典',
			ftnum: '第五百七十七条',
		});
	});

	it('ignores text without exact article number', () => {
		expect(findLastExactLegalRef('关于合同编相关规定，')).toBeNull();
	});
});

describe('ProvisionRefJudge', () => {
	beforeEach(() => {
		mockedRequestUrl.mockReset();
	});

	it('returns exact-provision route from local exact ref without requesting LLM', async () => {
		const judge = new ProvisionRefJudge(
			createPlugin('deepseek-key', 'deepseek-chat'),
		);
		const route = await judge.judge(
			'关于履行地点约定不明的问题，《中华人民共和国民法典》第五百一十一条',
		);

		expect(route).toEqual({
			kind: 'exact-provision',
			ref: {
				fgmc: '中华人民共和国民法典',
				ftnum: '第五百一十一条',
			},
		});
		expect(judge.getDebugInfo()?.skippedReason).toBe(
			'matched by local exact legal ref extractor',
		);
		expect(mockedRequestUrl).not.toHaveBeenCalled();
	});

	it('returns exact-provision route from LLM content when local extractor misses', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				choices: [
					{
						message: {
							content:
								'{ "fgmc": "中华人民共和国民法典", "ftnum": "第五百一十一条" }',
						},
					},
				],
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const route = await new ProvisionRefJudge(
			createPlugin('deepseek-key', 'deepseek-chat'),
		).judge('关于履行地点约定不明的问题，民法典相关条款');

		expect(route).toEqual({
			kind: 'exact-provision',
			ref: {
				fgmc: '中华人民共和国民法典',
				ftnum: '第五百一十一条',
			},
		});
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
		expect(body.max_tokens).toBe(1024);
		expect(body.temperature).toBe(0);
		expect(body.messages[1].content).toContain('【当前句/段】');
		expect(body.messages[1].content).toContain('【光标前最近文本】');
		expect(body.messages[1].content).toContain('民法典相关条款');
	});

	it('returns the closest exact provision when prefix has multiple refs', async () => {
		const route = await new ProvisionRefJudge(
			createPlugin('deepseek-key', 'deepseek-chat'),
		).judge(
			'关于履行地点约定不明的问题，《中华人民共和国民法典》第五百一十一条。另就股权转让责任，《中华人民共和国公司法》第八十八条第二款',
		);

		expect(route).toEqual({
			kind: 'exact-provision',
			ref: {
				fgmc: '中华人民共和国公司法',
				ftnum: '第八十八条第二款',
			},
		});
		expect(mockedRequestUrl).not.toHaveBeenCalled();
	});

	it('returns none route when LLM content is null', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				choices: [{ message: { content: 'null' } }],
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const route = await new ProvisionRefJudge(
			createPlugin('deepseek-key', 'deepseek-chat'),
		).judge('根据合同编相关规定，');

		expect(route).toEqual({ kind: 'none' });
	});

	it('returns fuzzy-provision route from LLM content when no exact ref exists', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				choices: [
					{
						message: {
							content:
								'{ "kind": "fuzzy-provision", "query": "合同编相关规定" }',
						},
					},
				],
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const route = await new ProvisionRefJudge(
			createPlugin('deepseek-key', 'deepseek-chat'),
		).judge('根据合同编相关规定，');

		expect(route).toEqual({
			kind: 'fuzzy-provision',
			query: '合同编相关规定',
		});
	});

	it('uses reasoning content when message content is empty', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				choices: [
					{
						message: {
							content: '',
							reasoning_content:
								'{ "fgmc": "中华人民共和国民法典", "ftnum": "第五百七十七条" }',
						},
					},
				],
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const route = await new ProvisionRefJudge(
			createPlugin('deepseek-key', 'deepseek-chat'),
		).judge('民法典相关违约责任');

		expect(route).toEqual({
			kind: 'exact-provision',
			ref: {
				fgmc: '中华人民共和国民法典',
				ftnum: '第五百七十七条',
			},
		});
	});

	it('returns local exact ref without requesting LLM when api key or model is missing', async () => {
		await expect(
			new ProvisionRefJudge(createPlugin(undefined, 'deepseek-chat')).judge(
				'《民法典》第五百一十一条',
			),
		).resolves.toEqual({
			kind: 'exact-provision',
			ref: {
				fgmc: '民法典',
				ftnum: '第五百一十一条',
			},
		});
		await expect(
			new ProvisionRefJudge(createPlugin('deepseek-key')).judge(
				'《民法典》第五百一十一条',
			),
		).resolves.toEqual({
			kind: 'exact-provision',
			ref: {
				fgmc: '民法典',
				ftnum: '第五百一十一条',
			},
		});

		expect(mockedRequestUrl).not.toHaveBeenCalled();
	});

	it('returns none when LLM request fails', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 500,
			json: {},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const route = await new ProvisionRefJudge(
			createPlugin('deepseek-key', 'deepseek-chat'),
		).judge('民法典相关条款');

		expect(route).toEqual({ kind: 'none' });
	});
});
