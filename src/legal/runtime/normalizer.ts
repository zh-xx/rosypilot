import {
	ArticleDetail,
	ArticleSearchItem,
	CaseDetail,
} from '../yuandian-client';
import { LegalResult } from './result';

export interface WebExactProvisionResultInput {
	providerId: string;
	providerName: string;
	url?: string;
	title: string;
	content: string;
	lawName?: string;
	articleNo?: string;
	effectiveStatus?: string;
	publishDate?: string;
	effectiveDate?: string;
	score?: number;
	extractionKind?: 'llm-extracted' | 'web-snippet';
	raw: unknown;
}

export interface WebExactCaseResultInput {
	providerId: string;
	providerName: string;
	url?: string;
	title: string;
	content: string;
	caseNo?: string;
	score?: number;
	raw: unknown;
}

export class LegalResultNormalizer {
	fromYuandianArticle(article: ArticleDetail): LegalResult {
		return {
			id: `yuandian:${article.id}`,
			type: 'statute',
			title: article.ftmc.trim(),
			content: cleanYuandianContent(article.content),
			source: {
				provider: 'yuandian',
				name: '元典',
			},
			metadata: {
				lawName: article.fgmc,
				articleNo: article.ft_num,
				effectiveStatus: article.sxx,
				category: article.xljb_1,
				publishDate: article.fbrq,
				effectiveDate: article.ssrq,
			},
			raw: article,
		};
	}

	fromYuandianArticleSearchItem(item: ArticleSearchItem): LegalResult {
		const lawName = Array.isArray(item.fgtitle)
			? item.fgtitle.join('')
			: item.fgtitle;
		const articleNo = item.num;

		return {
			id: `yuandian:${item.ftid || `${item.fgid}:${articleNo}`}`,
			type: 'statute',
			title: `${lawName}${articleNo}`,
			content: cleanYuandianContent(item.content),
			source: {
				provider: 'yuandian',
				name: '元典',
			},
			metadata: {
				lawName,
				articleNo,
				effectiveStatus: item.sxx,
				category: item.effect1,
				effectiveDate: formatYuandianDate(item.start),
				score: item.score,
			},
			raw: item,
		};
	}

	fromWebExactProvision(input: WebExactProvisionResultInput): LegalResult {
		return {
			id: `web:${input.providerId}:${input.url ?? input.title}`,
			type: 'web',
			title: input.title,
			content: input.content,
			source: {
				provider: input.providerId,
				name: input.providerName,
				url: input.url,
			},
			metadata: {
				lawName: input.lawName,
				articleNo: input.articleNo,
				effectiveStatus: input.effectiveStatus,
				publishDate: input.publishDate,
				effectiveDate: input.effectiveDate,
				score: input.score,
				extractionKind: input.extractionKind ?? 'web-snippet',
			},
			raw: input.raw,
		};
	}

	fromYuandianCaseDetail(item: CaseDetail): LegalResult {
		const title = cleanYuandianContent(item.title ?? item.ah ?? '案例详情');
		const content = cleanYuandianContent(
			item.content ||
				[item.fxgc, item.pjjg, item.cmss, item.ajjbqk, item.ssjl]
					.filter(Boolean)
					.join('\n\n'),
		);
		const cause = Array.isArray(item.ay) ? item.ay.join('、') : item.ay;

		return {
			id: `yuandian:case:${item.id || item.ah || title}`,
			type: 'case',
			title,
			content,
			source: {
				provider: 'yuandian',
				name: '元典',
				url: normalizeYuandianCaseUrl(item.url),
			},
			metadata: {
				caseNo: item.ah,
				court: item.jbdw,
				cause,
				caseCategory: item.ajlb || item.ajlx,
				trialProcedure: item.spcx,
				documentType: item.wszl,
				judgmentDate: item.cprq,
				caseSourceType: item.type,
			},
			raw: item,
		};
	}

	fromWebExactCase(input: WebExactCaseResultInput): LegalResult {
		return {
			id: `web:${input.providerId}:case:${input.url ?? input.title}`,
			type: 'web',
			title: input.title,
			content: input.content,
			source: {
				provider: input.providerId,
				name: input.providerName,
				url: input.url,
			},
			metadata: {
				caseNo: input.caseNo,
				score: input.score,
				extractionKind: 'web-snippet',
			},
			raw: input.raw,
		};
	}
}

function cleanYuandianContent(content: string): string {
	return content
		.split('\n')
		.map((line) =>
			line.replace(/^[\s\u3000]+/g, '').replace(/[ \t\u3000]+$/g, ''),
		)
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function formatYuandianDate(
	value: number | string | undefined,
): string | undefined {
	const raw = String(value ?? '');
	if (!/^\d{8}$/.test(raw) || raw === '99999999') {
		return undefined;
	}
	return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function normalizeYuandianCaseUrl(url: string | undefined): string | undefined {
	if (!url) return undefined;
	if (/^https?:\/\//i.test(url)) return url;
	return `https://www.chineselaw.com${url.startsWith('/') ? url : `/${url}`}`;
}
