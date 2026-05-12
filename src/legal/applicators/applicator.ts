import RosyPilot from 'src/main';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';

export type LegalApplicationResult =
	| { status: 'success' }
	| {
			status: 'failed';
			reason: 'missing-llm-config' | 'http-error' | 'empty-result' | 'error';
			message?: string;
	  };

export interface LegalApplicator {
	id: string;
	label: string;
	apply(
		request: LegalCommandRequest,
		result: LegalResult,
		plugin: RosyPilot,
	): Promise<LegalApplicationResult> | LegalApplicationResult;
}
