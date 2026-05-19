import { ArticleDetail, ArticleSearchItem } from '../yuandian-client';
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
