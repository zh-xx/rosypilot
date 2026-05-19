import RosyPilot from 'src/main';
import { LegalResultNormalizer } from '../runtime/normalizer';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';
import { LegalCommandRoute } from '../runtime/route';
import { YuandianClient } from '../yuandian-client';
import { LegalExecutor } from './executor';

export class YuandianCaseExactExecutor implements LegalExecutor {
	id = 'yuandian.case.exact';
	label = '元典精确查案例';
	private normalizer = new LegalResultNormalizer();

	canRun(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		plugin: RosyPilot,
	): boolean {
		return (
			route.kind === 'exact-case' && !!plugin.settings.legal?.yuandianApiKey
		);
	}

	async run(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		plugin: RosyPilot,
	): Promise<LegalResult[]> {
		if (route.kind !== 'exact-case') return [];

		const key = plugin.settings.legal?.yuandianApiKey;
		if (!key) return [];

		const client = new YuandianClient(key);
		const [authoritative, ordinary] = await Promise.all([
			client.fetchCaseDetailsByAh(route.ref.ah, 'qwal'),
			client.fetchCaseDetailsByAh(route.ref.ah, 'ptal'),
		]);

		return [...authoritative, ...ordinary].map((item) =>
			this.normalizer.fromYuandianCaseDetail(item),
		);
	}
}
