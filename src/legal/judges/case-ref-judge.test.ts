import { findLastExactCaseRef, parseCaseRouteResponse } from './case-ref-judge';

jest.mock('obsidian', () => ({ requestUrl: jest.fn() }), {
	virtual: true,
});

describe('CaseRefJudge helpers', () => {
	it('detects exact case number from full-width parentheses', () => {
		expect(findLastExactCaseRef('参见（2023）京0101民初123号，')).toEqual({
			ah: '（2023）京0101民初123号',
		});
	});

	it('normalizes half-width parentheses and spaces', () => {
		expect(findLastExactCaseRef('参考 ( 2023 ) 京0101民初123号')).toEqual({
			ah: '（2023）京0101民初123号',
		});
	});

	it('normalizes bracket variants and internal spaces', () => {
		expect(findLastExactCaseRef('参见〔2023〕京0101民初123号')).toEqual({
			ah: '（2023）京0101民初123号',
		});
		expect(findLastExactCaseRef('可参考（2023） 京 0101 民初 123 号')).toEqual({
			ah: '（2023）京0101民初123号',
		});
	});

	it('uses the latest case number before cursor', () => {
		expect(
			findLastExactCaseRef(
				'先看（2020）晋01民终5849号，后看（2024）浙0203刑初567号',
			),
		).toEqual({
			ah: '（2024）浙0203刑初567号',
		});
	});

	it('returns none for non-case text and titles without case numbers', () => {
		expect(findLastExactCaseRef('今天下午开会讨论材料，')).toBeNull();
		expect(findLastExactCaseRef('交通银行信用卡纠纷一审民事判决书')).toBeNull();
	});

	it('parses LLM exact-case JSON response', () => {
		expect(
			parseCaseRouteResponse(
				'{"kind":"exact-case","ah":"(2023) 京0101民初123号"}',
			),
		).toEqual({
			kind: 'exact-case',
			ref: { ah: '（2023）京0101民初123号' },
		});
		expect(parseCaseRouteResponse('null')).toEqual({ kind: 'none' });
	});

	it('parses LLM fuzzy-case JSON response', () => {
		expect(
			parseCaseRouteResponse(
				'{"kind":"fuzzy-case","query":"信用卡纠纷中利息费用上限"}',
			),
		).toEqual({
			kind: 'fuzzy-case',
			query: '信用卡纠纷中利息费用上限',
		});
	});
});
