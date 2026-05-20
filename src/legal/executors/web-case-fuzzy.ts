import RosyPilot from 'src/main';
import {
	LegalResultNormalizer,
	WebExactCaseResultInput,
} from '../runtime/normalizer';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';
import { LegalCommandRoute } from '../runtime/route';
import { LegalExecutor } from './executor';

export interface WebFuzzyCaseSearchProvider {
	id: string;
	label: string;
	searchFuzzyCases(query: string): Promise<WebExactCaseResultInput[]>;
}

export class WebCaseFuzzyExecutor implements LegalExecutor {
	id = 'web.case.fuzzy';
	label = '联网案例语义检索';
	private normalizer = new LegalResultNormalizer();

	constructor(private provider?: WebFuzzyCaseSearchProvider) {}

	canRun(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		_plugin: RosyPilot,
	): boolean {
		return route.kind === 'fuzzy-case' && this.provider !== undefined;
	}

	async run(
		_request: LegalCommandRequest,
		route: LegalCommandRoute,
		_plugin: RosyPilot,
	): Promise<LegalResult[]> {
		if (route.kind !== 'fuzzy-case' || !this.provider) return [];

		const results = await this.provider.searchFuzzyCases(route.query);
		return results.map((result) => this.normalizer.fromWebExactCase(result));
	}
}
