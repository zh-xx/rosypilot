import { ItemView, WorkspaceLeaf } from 'obsidian';
import { t } from 'src/i18n';
import { LegalResult } from './runtime/result';
import { ArticleSearchItem } from './yuandian-client';

export const LEGAL_PANEL_VIEW_TYPE = 'rosypilot-legal-panel';

export class LegalPanelView extends ItemView {
	private container!: HTMLElement;

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
				{
					title: result.title,
					content: result.content,
					meta: this.buildResultMeta(result),
				},
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
				title,
				content: item.content,
				meta: [item.effect1, item.sxx].filter(Boolean).join('  ·  '),
			});
		}
	}

	private renderItem(
		parent: HTMLElement,
		{ title, content, meta }: { title: string; content: string; meta: string },
		callbacks?: { onRaw: () => void; onAdapted: () => Promise<void> },
	): void {
		const card = parent.createDiv('rosypilot-legal-item');
		card.createDiv('rosypilot-legal-item-title').setText(title);
		card.createDiv('rosypilot-legal-item-content').setText(content);
		if (meta) {
			card.createDiv('rosypilot-legal-item-meta').setText(meta);
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

	private buildResultMeta(result: LegalResult): string {
		const source = result.source.name ?? result.source.provider;
		return [
			`${t('legal.panel.source')}：${source}`,
			result.metadata.lawName,
			result.metadata.articleNo,
			result.metadata.effectiveStatus,
			result.metadata.category,
			result.metadata.publishDate,
			result.metadata.effectiveDate,
		]
			.filter(Boolean)
			.join('  ·  ');
	}
}
