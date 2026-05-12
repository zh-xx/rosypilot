import { requestUrl } from 'obsidian';
import {
	cleanWebSnippet,
	WebProvisionExtractor,
} from './web-provision-extractor';
import { WebExactProvisionResultInput } from '../runtime/normalizer';

import type RosyPilot from 'src/main';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }), {
	virtual: true,
});

const mockedRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

const ref = {
	fgmc: '中华人民共和国民法典',
	ftnum: '第五百一十一条',
};

const input: WebExactProvisionResultInput = {
	providerId: 'tavily',
	providerName: 'Tavily',
	url: 'https://example.com/civil-code-511',
	title: '中华人民共和国民法典 第五百一十一条',
	content:
		'<main>导航 | 中华人民共和国民法典 第五百一十一条 当事人就有关合同内容约定不明确...</main>',
	lawName: ref.fgmc,
	articleNo: ref.ftnum,
	raw: {},
};

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

describe('WebProvisionExtractor', () => {
	beforeEach(() => {
		mockedRequestUrl.mockReset();
	});

	it('cleans noisy web snippets before extraction', () => {
		expect(
			cleanWebSnippet(
				'<style>.x{}</style><p> A&nbsp; </p>\n| B | C |\n\n\n　D　',
			),
		).toBe('A&nbsp;\nB C\nD');
	});

	it('extracts target provision content using the configured LLM', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				choices: [
					{
						message: {
							content:
								'{"title":"中华人民共和国民法典第五百一十一条","content":"第五百一十一条 当事人就有关合同内容约定不明确..."}',
						},
					},
				],
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		const extraction = await new WebProvisionExtractor(
			createPlugin('deepseek-key', 'deepseek-chat'),
		).extract(ref, input);

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
		expect(extraction).toEqual({
			title: '中华人民共和国民法典第五百一十一条',
			content: '第五百一十一条 当事人就有关合同内容约定不明确...',
		});
	});

	it('returns null when LLM config is missing or extraction is invalid', async () => {
		expect(
			await new WebProvisionExtractor(
				createPlugin(undefined, 'deepseek-chat'),
			).extract(ref, input),
		).toBeNull();

		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: {
				choices: [{ message: { content: 'null' } }],
			},
		} as Awaited<ReturnType<typeof requestUrl>>);

		expect(
			await new WebProvisionExtractor(
				createPlugin('deepseek-key', 'deepseek-chat'),
			).extract(ref, input),
		).toBeNull();
	});
});
