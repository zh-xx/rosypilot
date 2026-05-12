import RosyPilot from 'src/main';
import { LegalCommandRequest } from '../runtime/request';
import { LegalResult } from '../runtime/result';
import { LegalApplicationResult, LegalApplicator } from './applicator';
import { injectGhostText } from './ghost-text';

export type RawInsertFormat = 'content' | 'title-content' | 'quote-block';

export class InsertRawApplicator implements LegalApplicator {
	id = 'insert.raw';
	label = '插入原文';

	apply(
		request: LegalCommandRequest,
		result: LegalResult,
		_plugin: RosyPilot,
		format: RawInsertFormat = 'title-content',
	): LegalApplicationResult {
		injectGhostText(
			request.editorView,
			formatRawInsert(request, result, format),
		);
		return { status: 'success' };
	}
}

function formatRawInsert(
	request: LegalCommandRequest,
	result: LegalResult,
	format: RawInsertFormat,
): string {
	if (format === 'content') return result.content;
	if (format === 'quote-block') {
		const linePrefix = getCurrentLinePrefix(request.prefix);
		return `${linePrefix.trim() ? '\n' : ''}${formatQuoteBlock(result)}`;
	}
	return `${result.title}\n${result.content}`;
}

function getCurrentLinePrefix(prefix: string): string {
	return prefix.slice(prefix.lastIndexOf('\n') + 1);
}

function formatQuoteBlock(result: LegalResult): string {
	return [result.title, result.content]
		.join('\n')
		.split('\n')
		.map((line) => `> ${line}`)
		.join('\n');
}
