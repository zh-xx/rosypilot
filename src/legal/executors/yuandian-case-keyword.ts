import RosyPilot from 'src/main';
import { CaseKeywordSearchItem, YuandianClient } from '../yuandian-client';
import { LegalResultNormalizer } from '../runtime/normalizer';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';
import { LegalCommandRoute } from '../runtime/route';
import { LegalExecutor } from './executor';

const TOP_K = 5;
const MIN_AUTHORITATIVE_RESULTS = 3;

export class YuandianCaseKeywordExecutor implements LegalExecutor {
	id = 'yuandian.case.keyword';
	label = '元典案例关键词检索';
	private normalizer = new LegalResultNormalizer();

	canRun(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		plugin: RosyPilot,
	): boolean {
		return (
			route.kind === 'fuzzy-case' && !!plugin.settings.legal?.yuandianApiKey
		);
	}

	async run(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		plugin: RosyPilot,
	): Promise<LegalResult[]> {
		if (route.kind !== 'fuzzy-case') return [];

		const key = plugin.settings.legal?.yuandianApiKey;
		if (!key) return [];

		const client = new YuandianClient(key);
		const authoritative = await client.searchCasesByKeyword(
			route.query,
			'qwal',
			TOP_K,
		);
		const ordinary =
			authoritative.length >= MIN_AUTHORITATIVE_RESULTS
				? []
				: await client.searchCasesByKeyword(route.query, 'ptal', TOP_K);

		return dedupeCaseKeywordItems([...authoritative, ...ordinary]).map((item) =>
			this.normalizer.fromYuandianCaseKeywordSearchItem(item, route.query),
		);
	}
}

function dedupeCaseKeywordItems(
	items: CaseKeywordSearchItem[],
): CaseKeywordSearchItem[] {
	const seen = new Set<string>();
	const results: CaseKeywordSearchItem[] = [];
	for (const item of items) {
		const key = item.id || item.ah || item.title;
		if (!key || seen.has(key)) continue;
		seen.add(key);
		results.push(item);
	}
	return results;
}
