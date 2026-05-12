import { ArticleDetail } from '../yuandian-client';
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
	raw: unknown;
}

export class LegalResultNormalizer {
	fromYuandianArticle(article: ArticleDetail): LegalResult {
		return {
			id: `yuandian:${article.id}`,
			type: 'statute',
			title: article.ftmc,
			content: article.content,
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
			},
			raw: input.raw,
		};
	}
}
