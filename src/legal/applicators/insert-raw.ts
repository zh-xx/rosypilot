import RosyPilot from 'src/main';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';
import { LegalApplicationResult, LegalApplicator } from './applicator';
import { injectGhostText } from './ghost-text';

export class InsertRawApplicator implements LegalApplicator {
	id = 'insert.raw';
	label = '插入原文';

	apply(
		request: LegalCommandRequest,
		result: LegalResult,
		_plugin: RosyPilot,
	): LegalApplicationResult {
		injectGhostText(request.editorView, `${result.title}\n${result.content}`);
		return { status: 'success' };
	}
}
