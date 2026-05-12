import RosyPilot from 'src/main';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';

export interface LegalApplicator {
	id: string;
	label: string;
	apply(
		request: LegalCommandRequest,
		result: LegalResult,
		plugin: RosyPilot,
	): Promise<void> | void;
}
