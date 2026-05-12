import RosyPilot from 'src/main';
import { LegalCommandRequest } from '../runtime/request';
import { LegalCommandRoute } from '../runtime/route';
import { LegalResult } from '../runtime/result';

export interface LegalExecutor {
	id: string;
	label: string;
	canRun(
		request: LegalCommandRequest,
		route: LegalCommandRoute,
		plugin: RosyPilot,
	): boolean;
	run(
		request: LegalCommandRequest,
		route: LegalCommandRoute,
		plugin: RosyPilot,
	): Promise<LegalResult[]>;
}
