import { ItemView, WorkspaceLeaf } from 'obsidian';
import { t } from 'src/i18n';
import {
	LegalDisplayMetaRow,
	LegalDisplayResult,
	LegalResultPresenter,
} from './presenter';
import { LegalResult } from './runtime/result';
import { ArticleSearchItem } from './yuandian-client';

export const LEGAL_PANEL_VIEW_TYPE = 'rosypilot-legal-panel';

export class LegalPanelView extends ItemView {
	private container!: HTMLElement;
	private presenter = new LegalResultPresenter();

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return LEGAL_PANEL_VIEW_TYPE;
	}

	getDisplayText(): string {
		return t('legal.panel.title');
	}

	getIcon(): string {
		return 'scale';
	}

	onOpen(): Promise<void> {
		this.container = this.contentEl.createDiv('rosypilot-legal-panel');
		this.container
			.createDiv('rosypilot-legal-empty')
			.setText(t('legal.panel.empty'));
		return Promise.resolve();
	}

	onClose(): Promise<void> {
		return Promise.resolve();
	}

	setLoading(msg?: string): void {
		this.container.empty();
		this.container
			.createDiv('rosypilot-legal-status')
			.setText(msg ?? t('legal.panel.loading'));
	}

	setError(msg: string): void {
		this.container.empty();
		this.container.createDiv('rosypilot-legal-status').setText(msg);
	}

	setDetail(
		result: LegalResult,
		callbacks?: { onRaw: () => void; onAdapted: () => Promise<void> },
	): void {
		this.setDetails([result], callbacks?.onRaw, callbacks?.onAdapted);
	}

	setDetails(
		results: LegalResult[],
		onRaw?: (result: LegalResult) => void,
		onAdapted?: (result: LegalResult) => Promise<void>,
	): void {
		this.container.empty();

		if (results.length === 0) {
			this.container
				.createDiv('rosypilot-legal-status')
				.setText(t('legal.panel.empty'));
			return;
		}

		const label = this.container.createDiv('rosypilot-legal-label');
		label.setText(t('legal.panel.detail.label'));

		for (const result of results) {
			const callbacks =
				onRaw && onAdapted
					? {
							onRaw: () => onRaw(result),
							onAdapted: () => onAdapted(result),
						}
					: undefined;

			this.renderItem(
				this.container,
				this.presenter.present(result),
				callbacks,
			);
		}
	}

	setSearchResults(items: ArticleSearchItem[]): void {
		this.container.empty();

		if (items.length === 0) {
			this.container
				.createDiv('rosypilot-legal-status')
				.setText(t('legal.panel.empty'));
			return;
		}

		const label = this.container.createDiv('rosypilot-legal-label');
		label.setText(t('legal.panel.search.label'));

		for (const item of items) {
			const fgtitle = Array.isArray(item.fgtitle)
				? item.fgtitle.join('')
				: item.fgtitle ?? '';
			const title = fgtitle ? fgtitle + item.num : item.num;
			this.renderItem(this.container, {
				badge: t('legal.panel.badge.yuandian'),
				badgeKind: 'trusted',
				title,
				content: item.content,
				previewContent: item.content,
				collapsible: false,
				metaRows: [
					{ label: t('legal.panel.meta.category'), value: item.effect1 },
					{
						label: t('legal.panel.meta.effectiveStatus'),
						value: item.sxx,
					},
				].filter((row): row is LegalDisplayMetaRow => Boolean(row.value)),
			});
		}
	}

	private renderItem(
		parent: HTMLElement,
		display: LegalDisplayResult,
		callbacks?: { onRaw: () => void; onAdapted: () => Promise<void> },
	): void {
		const card = parent.createDiv('rosypilot-legal-item');
		card.addClass(`rosypilot-legal-item-${display.badgeKind}`);
		const badge = card.createDiv('rosypilot-legal-source-badge');
		badge.addClass(`rosypilot-legal-source-badge-${display.badgeKind}`);
		badge.setText(display.badge);
		card.createDiv('rosypilot-legal-item-title').setText(display.title);
		if (display.sourceUrl) {
			const source = card.createDiv('rosypilot-legal-source-url');
			source.createSpan({ text: `${t('legal.panel.url')}：` });
			const link = source.createEl('a', {
				text: display.sourceUrl,
			});
			link.href = display.sourceUrl;
			link.target = '_blank';
			link.rel = 'noopener noreferrer';
		}

		const content = card.createDiv('rosypilot-legal-item-content');
		content.setText(display.previewContent);
		if (display.collapsible) {
			const toggle = card.createEl('button', {
				cls: 'rosypilot-legal-link-btn',
				text: t('legal.panel.expand'),
			});
			let expanded = false;
			toggle.addEventListener('click', () => {
				expanded = !expanded;
				content.setText(expanded ? display.content : display.previewContent);
				toggle.setText(
					expanded ? t('legal.panel.collapse') : t('legal.panel.expand'),
				);
			});
		}

		if (display.metaRows.length > 0) {
			const meta = card.createDiv('rosypilot-legal-item-meta');
			for (const row of display.metaRows) {
				const item = meta.createDiv('rosypilot-legal-meta-row');
				item.createSpan({
					cls: 'rosypilot-legal-meta-label',
					text: `${row.label}：`,
				});
				item.createSpan({
					cls: 'rosypilot-legal-meta-value',
					text: row.value,
				});
			}
		}
		if (callbacks) {
			const actions = card.createDiv('rosypilot-legal-item-actions');

			const rawBtn = actions.createEl('button', {
				cls: 'rosypilot-legal-btn',
				text: t('legal.panel.insert.raw'),
			});
			rawBtn.addEventListener('click', callbacks.onRaw);

			const adaptedBtn = actions.createEl('button', {
				cls: 'rosypilot-legal-btn',
				text: t('legal.panel.insert.adapted'),
			});
			adaptedBtn.addEventListener('click', () => {
				if (adaptedBtn.disabled) return;
				adaptedBtn.disabled = true;
				adaptedBtn.empty();
				adaptedBtn.createSpan({ cls: 'rosypilot-legal-btn-spinner' });
				void callbacks.onAdapted().finally(() => {
					adaptedBtn.disabled = false;
					adaptedBtn.empty();
					adaptedBtn.setText(t('legal.panel.insert.adapted'));
				});
			});
		}
	}
}
