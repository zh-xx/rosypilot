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
	const content = isCaseLikeResult(result)
		? formatCaseContent(result)
		: result.content;
	if (format === 'content') return content;
	if (format === 'quote-block') {
		const linePrefix = getCurrentLinePrefix(request.prefix);
		return `${linePrefix.trim() ? '\n' : ''}${formatQuoteBlock(result, content)}`;
	}
	return `${result.title}\n${content}`;
}

function getCurrentLinePrefix(prefix: string): string {
	return prefix.slice(prefix.lastIndexOf('\n') + 1);
}

function formatQuoteBlock(result: LegalResult, content: string): string {
	return [result.title, content]
		.join('\n')
		.split('\n')
		.map((line) => `> ${line}`)
		.join('\n');
}

function formatCaseContent(result: LegalResult): string {
	const meta = [
		result.metadata.caseNo,
		result.metadata.court,
		result.metadata.judgmentDate,
	]
		.filter(Boolean)
		.join(' · ');
	return [meta, result.content].filter(Boolean).join('\n\n');
}

function isCaseLikeResult(result: LegalResult): boolean {
	return (
		result.type === 'case' ||
		Boolean(result.metadata.caseNo) ||
		Boolean(result.metadata.caseQuery)
	);
}
