import RosyPilot from 'src/main';
import {
	LegalResultNormalizer,
	WebExactCaseResultInput,
} from '../runtime/normalizer';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';
import { LegalCommandRoute } from '../runtime/route';
import { LegalExecutor } from './executor';

export interface WebExactCaseSearchProvider {
	id: string;
	label: string;
	searchExactCase(ah: string): Promise<WebExactCaseResultInput[]>;
}

export class WebCaseExactExecutor implements LegalExecutor {
	id = 'web.case.exact';
	label = '联网精确查案例';
	private normalizer = new LegalResultNormalizer();

	constructor(private provider?: WebExactCaseSearchProvider) {}

	canRun(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		_plugin: RosyPilot,
	): boolean {
		return route.kind === 'exact-case' && this.provider !== undefined;
	}

	async run(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		_plugin: RosyPilot,
	): Promise<LegalResult[]> {
		if (route.kind !== 'exact-case' || !this.provider) return [];

		const results = await this.provider.searchExactCase(route.ref.ah);
		return results.map((result) => this.normalizer.fromWebExactCase(result));
	}
}
