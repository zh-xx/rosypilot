import { t } from 'src/i18n';
import { LegalResult } from './runtime/result';

const WEB_CONTENT_PREVIEW_LENGTH = 200;
const CASE_CONTENT_PREVIEW_LENGTH = 600;

export interface LegalDisplayMetaRow {
	label: string;
	value: string;
}

export interface LegalDisplayResult {
	badge: string;
	badgeKind: 'trusted' | 'web' | 'generic';
	title: string;
	content: string;
	previewContent: string;
	collapsible: boolean;
	sourceUrl?: string;
	metaRows: LegalDisplayMetaRow[];
	rawInsertLabel: string;
}

export class LegalResultPresenter {
	present(result: LegalResult): LegalDisplayResult {
		const isYuandian = result.source.provider === 'yuandian';
		const isWeb = result.type === 'web';
		const isCase = isCaseLikeResult(result);
		const content = this.cleanContent(result.content);
		const previewLength = isCase
			? CASE_CONTENT_PREVIEW_LENGTH
			: WEB_CONTENT_PREVIEW_LENGTH;
		const collapsible = (isWeb || isCase) && content.length > previewLength;

		return {
			badge: this.buildBadge(result),
			badgeKind: isYuandian ? 'trusted' : isWeb ? 'web' : 'generic',
			title: result.title,
			content,
			previewContent: collapsible
				? content.slice(0, previewLength).trimEnd() + '...'
				: content,
			collapsible,
			sourceUrl: result.source.url,
			metaRows: this.buildMetaRows(result),
			rawInsertLabel: isCase
				? t('legal.panel.insert.caseRaw')
				: t('legal.panel.insert.raw'),
		};
	}

	private buildBadge(result: LegalResult): string {
		if (result.source.provider === 'yuandian') {
			return t('legal.panel.badge.yuandian');
		}
		if (result.type === 'web') {
			const name = result.source.name ?? result.source.provider;
			const webKind =
				result.metadata.extractionKind === 'llm-extracted'
					? t('legal.panel.badge.webExtracted')
					: t('legal.panel.badge.webSnippet');
			return `${name} · ${webKind}`;
		}
		return result.source.name ?? result.source.provider;
	}

	private buildMetaRows(result: LegalResult): LegalDisplayMetaRow[] {
		if (isCaseLikeResult(result)) {
			return [
				{ label: t('legal.panel.meta.caseNo'), value: result.metadata.caseNo },
				{ label: t('legal.panel.meta.court'), value: result.metadata.court },
				{ label: t('legal.panel.meta.cause'), value: result.metadata.cause },
				{
					label: t('legal.panel.meta.caseCategory'),
					value: result.metadata.caseCategory,
				},
				{
					label: t('legal.panel.meta.trialProcedure'),
					value: result.metadata.trialProcedure,
				},
				{
					label: t('legal.panel.meta.documentType'),
					value: result.metadata.documentType,
				},
				{
					label: t('legal.panel.meta.judgmentDate'),
					value: result.metadata.judgmentDate,
				},
				{
					label: t('legal.panel.meta.caseSourceType'),
					value: result.metadata.caseSourceType,
				},
			].filter((row): row is LegalDisplayMetaRow => Boolean(row.value));
		}

		return [
			{ label: t('legal.panel.meta.lawName'), value: result.metadata.lawName },
			{
				label: t('legal.panel.meta.articleNo'),
				value: result.metadata.articleNo,
			},
			{
				label: t('legal.panel.meta.effectiveStatus'),
				value: result.metadata.effectiveStatus,
			},
			{
				label: t('legal.panel.meta.category'),
				value: result.metadata.category,
			},
			{
				label: t('legal.panel.meta.publishDate'),
				value: result.metadata.publishDate,
			},
			{
				label: t('legal.panel.meta.effectiveDate'),
				value: result.metadata.effectiveDate,
			},
		].filter((row): row is LegalDisplayMetaRow => Boolean(row.value));
	}

	private cleanContent(content: string): string {
		return content
			.split('\n')
			.map((line) =>
				line.replace(/^[\s\u3000]+/g, '').replace(/[ \t\u3000]+$/g, ''),
			)
			.join('\n')
			.replace(/\n{3,}/g, '\n\n')
			.trim();
	}
}

function isCaseLikeResult(result: LegalResult): boolean {
	return result.type === 'case' || Boolean(result.metadata.caseNo);
}
