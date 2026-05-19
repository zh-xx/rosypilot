import RosyPilot from 'src/main';
import { LegalResultNormalizer } from '../runtime/normalizer';
import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';
import { LegalResult } from '../runtime/result';
import { ArticleSearchItem, YuandianClient } from '../yuandian-client';
import { LegalExecutor } from './executor';

export class YuandianSemanticExecutor implements LegalExecutor {
	id = 'yuandian.semantic';
	label = '元典语义检索';
	private normalizer = new LegalResultNormalizer();

	canRun(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		plugin: RosyPilot,
	): boolean {
		return (
			route.kind === 'fuzzy-provision' &&
			!!plugin.settings.legal?.yuandianApiKey
		);
	}

	async run(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		plugin: RosyPilot,
	): Promise<LegalResult[]> {
		if (route.kind !== 'fuzzy-provision') return [];

		const key = plugin.settings.legal?.yuandianApiKey;
		if (!key) return [];

		const client = new YuandianClient(key);
		const articles = await client.searchArticles(route.query);
		return rankYuandianSemanticArticles(articles).map((article) =>
			this.normalizer.fromYuandianArticleSearchItem(article),
		);
	}
}

const EFFECT_LEVEL_RANK: Record<string, number> = {
	宪法: 0,
	法律: 1,
	司法解释: 2,
	行政法规: 3,
	监察法规: 4,
	部门规章: 5,
	地方性法规: 6,
	地方政府规章: 7,
	立法机关工作文件: 8,
	行政机关工作文件: 9,
	地方司法文件: 10,
	地方规范性文件: 11,
	党内法规: 12,
	军事法规规章: 13,
	自治条例和单行条例: 14,
	行业: 15,
	'行业/团体规范': 15,
	地方律协规定: 16,
};

const PRACTICE_MATERIAL_PATTERN = /裁判要旨|案例|指引|纪要|摘要/;

export function rankYuandianSemanticArticles(
	articles: ArticleSearchItem[],
): ArticleSearchItem[] {
	return [...articles].sort((a, b) => {
		const rankDiff = semanticRank(a) - semanticRank(b);
		if (rankDiff !== 0) return rankDiff;
		return (b.score ?? 0) - (a.score ?? 0);
	});
}

function semanticRank(article: ArticleSearchItem): number {
	const effectRank = EFFECT_LEVEL_RANK[article.effect1] ?? 50;
	const title = articleTitle(article);
	const practicePenalty = PRACTICE_MATERIAL_PATTERN.test(title) ? 100 : 0;
	return effectRank + practicePenalty;
}

function articleTitle(article: ArticleSearchItem): string {
	const lawName = Array.isArray(article.fgtitle)
		? article.fgtitle.join('')
		: article.fgtitle;
	return `${lawName}${article.num}`;
}
