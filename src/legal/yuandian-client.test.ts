import { requestUrl } from 'obsidian';
import { YuandianClient } from './yuandian-client';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }), {
	virtual: true,
});

const mockedRequestUrl = requestUrl as jest.MockedFunction<typeof requestUrl>;

const CONSISTENT_REGULATION = {
	name: '中华人民共和国民法典',
	clause: '第五百一十一条',
	content: '用户原文引用',
	extract_reg_id: 'reg-1',
	url: 'https://open.chineselaw.com/law/1',
	think_tank_content:
		'当事人就有关合同内容约定不明确，依照本法第五百一十条的规定仍不能确定的…',
	publish_date: '2020-05-28',
	implement_date: '2021-01-01',
	validity_status: '现行有效',
	document_number: '主席令第45号',
	semantic_compare: {
		结论: '一致',
		语义相似度: 0.95,
		说明: '内容高度吻合',
		要点: [],
	},
};

const INCONSISTENT_REGULATION = {
	...CONSISTENT_REGULATION,
	semantic_compare: {
		结论: '不一致',
		语义相似度: 0.15,
		说明: '条文内容与权威来源差异较大',
		要点: ['要点一', '要点二'],
	},
};

const FOUND_CASE = {
	name: '张某诉某公司案',
	case_number: '（2023）京0101民初123号',
	content: '用户原文',
	url: 'https://open.chineselaw.com/case/1',
	think_tank_content: '法院认定……',
	case_type: 'ptal',
	court: '北京市东城区人民法院',
	judgment_date: '2023-03-22',
	basic_facts: '',
	judgment_key_points: '',
	judgment_result: '',
	judgment_analysis: '',
	typical_significance: '',
	case_commentary: '',
};

function makeSuccessResponse(
	overrides: Partial<{
		regulations: unknown[];
		cases: unknown[];
	}> = {},
) {
	return {
		status: 200,
		json: {
			regulations: overrides.regulations ?? [CONSISTENT_REGULATION],
			cases: overrides.cases ?? [],
			highlighted_text: '',
			chat_model: 'gpt-4',
			request_id: 'req-1',
		},
	};
}

describe('YuandianClient.detectHallucination', () => {
	beforeEach(() => {
		mockedRequestUrl.mockReset();
	});

	it('sends text to hall_detect with X-API-Key header', async () => {
		mockedRequestUrl.mockResolvedValue(makeSuccessResponse() as never);

		await new YuandianClient('test-key').detectHallucination('测试文本');

		expect(mockedRequestUrl).toHaveBeenCalledWith(
			expect.objectContaining({
				url: 'https://open.chineselaw.com/open/hall_detect',
				method: 'POST',
				headers: expect.objectContaining({ 'X-API-Key': 'test-key' }),
				body: JSON.stringify({ text: '测试文本' }),
			}),
		);
	});

	it('returns regulations and cases from successful response', async () => {
		mockedRequestUrl.mockResolvedValue(
			makeSuccessResponse({
				regulations: [CONSISTENT_REGULATION],
				cases: [FOUND_CASE],
			}) as never,
		);

		const result = await new YuandianClient('key').detectHallucination('text');

		expect(result.regulations).toHaveLength(1);
		expect(result.regulations[0].name).toBe('中华人民共和国民法典');
		expect(result.cases).toHaveLength(1);
		expect(result.cases[0].case_number).toBe('（2023）京0101民初123号');
	});

	it('throws on non-200 HTTP status with message from body', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 401,
			json: { success: false, message: 'API Key 缺失' },
		} as never);

		await expect(
			new YuandianClient('bad-key').detectHallucination('text'),
		).rejects.toThrow('HTTP 401: API Key 缺失');
	});

	it('throws on non-200 HTTP status without body message', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 500,
			json: undefined,
		} as never);

		await expect(
			new YuandianClient('key').detectHallucination('text'),
		).rejects.toThrow('HTTP 500');
	});

	it('throws when response body has success: false', async () => {
		mockedRequestUrl.mockResolvedValue({
			status: 200,
			json: { success: false, message: '系统繁忙' },
		} as never);

		await expect(
			new YuandianClient('key').detectHallucination('text'),
		).rejects.toThrow('系统繁忙');
	});

	it('returns empty arrays when no regulations or cases are found', async () => {
		mockedRequestUrl.mockResolvedValue(
			makeSuccessResponse({ regulations: [], cases: [] }) as never,
		);

		const result = await new YuandianClient('key').detectHallucination('text');

		expect(result.regulations).toHaveLength(0);
		expect(result.cases).toHaveLength(0);
	});

	it('preserves semantic_compare fields in regulation result', async () => {
		mockedRequestUrl.mockResolvedValue(
			makeSuccessResponse({ regulations: [INCONSISTENT_REGULATION] }) as never,
		);

		const result = await new YuandianClient('key').detectHallucination('text');
		const reg = result.regulations[0];

		expect(reg.semantic_compare.结论).toBe('不一致');
		expect(reg.semantic_compare.语义相似度).toBe(0.15);
		expect(reg.semantic_compare.要点).toEqual(['要点一', '要点二']);
	});
});
