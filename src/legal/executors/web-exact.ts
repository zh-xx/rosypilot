import RosyPilot from 'src/main';
import { LegalRef } from '../detector';
import {
	LegalResultNormalizer,
	WebExactProvisionResultInput,
} from '../runtime/normalizer';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';
import { LegalCommandRoute } from '../runtime/route';
import { LegalExecutor } from './executor';

export interface WebExactSearchProvider {
	id: string;
	label: string;
	searchExactProvision(ref: LegalRef): Promise<WebExactProvisionResultInput[]>;
}

export class WebExactExecutor implements LegalExecutor {
	id = 'web.exact';
	label = '联网精确查条';
	private normalizer = new LegalResultNormalizer();

	constructor(private provider?: WebExactSearchProvider) {}

	canRun(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		_plugin: RosyPilot,
	): boolean {
		return route.kind === 'exact-provision' && this.provider !== undefined;
	}

	async run(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		_plugin: RosyPilot,
	): Promise<LegalResult[]> {
		if (route.kind !== 'exact-provision' || !this.provider) return [];
		const results = await this.provider.searchExactProvision(route.ref);
		return results.map((result) =>
			this.normalizer.fromWebExactProvision(result),
		);
	}
}
