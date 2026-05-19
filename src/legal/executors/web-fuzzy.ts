import RosyPilot from 'src/main';
import {
	LegalResultNormalizer,
	WebExactProvisionResultInput,
} from '../runtime/normalizer';
import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';
import { LegalResult } from '../runtime/result';
import { LegalExecutor } from './executor';

export interface WebFuzzySearchProvider {
	id: string;
	label: string;
	searchFuzzyProvisions(query: string): Promise<WebExactProvisionResultInput[]>;
}

export class WebFuzzyExecutor implements LegalExecutor {
	id = 'web.fuzzy';
	label = '联网语义检索';
	private normalizer = new LegalResultNormalizer();

	constructor(private provider?: WebFuzzySearchProvider) {}

	canRun(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		_plugin: RosyPilot,
	): boolean {
		return route.kind === 'fuzzy-provision' && this.provider !== undefined;
	}

	async run(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		_plugin: RosyPilot,
	): Promise<LegalResult[]> {
		if (route.kind !== 'fuzzy-provision' || !this.provider) return [];

		const results = await this.provider.searchFuzzyProvisions(route.query);
		return results.map((result) =>
			this.normalizer.fromWebExactProvision(result),
		);
	}
}
