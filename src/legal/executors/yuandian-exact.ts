import RosyPilot from 'src/main';
import { LegalResultNormalizer } from '../runtime/normalizer';
import { YuandianClient } from '../yuandian-client';
import { LegalExecutor } from './executor';
import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';
import { LegalResult } from '../runtime/result';

export class YuandianExactExecutor implements LegalExecutor {
	id = 'yuandian.exact';
	label = '元典精确查条';
	private normalizer = new LegalResultNormalizer();

	canRun(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		plugin: RosyPilot,
	): boolean {
		return (
			route.kind === 'exact-provision' &&
			!!plugin.settings.legal?.yuandianApiKey
		);
	}

	async run(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		plugin: RosyPilot,
	): Promise<LegalResult[]> {
		if (route.kind !== 'exact-provision') return [];

		const key = plugin.settings.legal?.yuandianApiKey;
		if (!key) return [];

		const client = new YuandianClient(key);
		const article = await client.fetchDetail(route.ref.fgmc, route.ref.ftnum);
		if (!article) return [];

		return [this.normalizer.fromYuandianArticle(article)];
	}
}
