import { t } from 'src/i18n';
import { LegalResult } from './runtime/result';

const WEB_CONTENT_PREVIEW_LENGTH = 200;

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
}

export class LegalResultPresenter {
	present(result: LegalResult): LegalDisplayResult {
		const isYuandian = result.source.provider === 'yuandian';
		const isWeb = result.type === 'web';
		const content = this.cleanContent(result.content);
		const collapsible = isWeb && content.length > WEB_CONTENT_PREVIEW_LENGTH;

		return {
			badge: this.buildBadge(result),
			badgeKind: isYuandian ? 'trusted' : isWeb ? 'web' : 'generic',
			title: result.title,
			content,
			previewContent: collapsible
				? content.slice(0, WEB_CONTENT_PREVIEW_LENGTH).trimEnd() + '...'
				: content,
			collapsible,
			sourceUrl: result.source.url,
			metaRows: this.buildMetaRows(result),
		};
	}

	private buildBadge(result: LegalResult): string {
		if (result.source.provider === 'yuandian') {
			return t('legal.panel.badge.yuandian');
		}
		if (result.type === 'web') {
			const name = result.source.name ?? result.source.provider;
			return `${name} · ${t('legal.panel.badge.web')}`;
		}
		return result.source.name ?? result.source.provider;
	}

	private buildMetaRows(result: LegalResult): LegalDisplayMetaRow[] {
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
