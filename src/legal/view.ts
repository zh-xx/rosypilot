import { ItemView, WorkspaceLeaf } from 'obsidian';
import { t } from 'src/i18n';
import { appendDomainLink } from './view-utils';
import {
	LegalDisplayMetaRow,
	LegalDisplayResult,
	LegalResultPresenter,
} from './presenter';
import { RawInsertFormat } from './applicators/insert-raw';
import { LegalResult } from './runtime/result';
import {
	HallucinationDetectResponse,
	HallucinationRegulation,
	HallucinationCase,
} from './yuandian-client';
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
		onRaw?: (result: LegalResult, format: RawInsertFormat) => void,
		onAdapted?: (result: LegalResult) => Promise<void>,
		labelText: string = t('legal.panel.detail.label'),
	): void {
		this.container.empty();

		if (results.length === 0) {
			this.container
				.createDiv('rosypilot-legal-status')
				.setText(t('legal.panel.empty'));
			return;
		}

		const label = this.container.createDiv('rosypilot-legal-label');
		label.setText(labelText);

		for (const result of results) {
			const callbacks =
				onRaw && onAdapted
					? {
							onRaw: (format: RawInsertFormat) => onRaw(result, format),
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
				rawInsertLabel: t('legal.panel.insert.raw'),
			});
		}
	}

	setHallucinationReport(
		response: HallucinationDetectResponse,
		callbacks?: {
			onLocate: (searchText: string) => void;
			onAnalyze: (
				item: HallucinationRegulation | HallucinationCase,
				kind: 'regulation' | 'case',
			) => Promise<string>;
		},
	): void {
		this.container.empty();

		const label = this.container.createDiv('rosypilot-legal-label');
		label.setText(t('legal.panel.hallucination.label'));

		for (const reg of response.regulations) {
			this.renderHallucinationRegulation(this.container, reg, callbacks);
		}
		for (const c of response.cases) {
			this.renderHallucinationCase(this.container, c, callbacks);
		}
	}

	private renderHallucinationRegulation(
		parent: HTMLElement,
		reg: HallucinationRegulation,
		callbacks?: {
			onLocate: (searchText: string) => void;
			onAnalyze: (
				item: HallucinationRegulation | HallucinationCase,
				kind: 'regulation' | 'case',
			) => Promise<string>;
		},
	): void {
		const verdict = reg.semantic_compare?.skipped
			? t('legal.panel.hallucination.verdict.skipped')
			: reg.semantic_compare?.结论 ??
				t('legal.panel.hallucination.verdict.unknown');

		const verdictClass = this.verdictClass(verdict);
		const title = reg.source_no_specific_clause
			? reg.name
			: [reg.name, reg.clause].filter(Boolean).join('');

		const card = parent.createDiv('rosypilot-legal-item');
		card.addClass('rosypilot-legal-item-trusted');

		// Header: verdict badge + hallucination type tag
		const header = card.createDiv('rosypilot-hallucination-header');
		const badge = header.createDiv('rosypilot-legal-source-badge');
		badge.addClass('rosypilot-legal-source-badge-trusted');
		badge.addClass(verdictClass);
		badge.setText(verdict);

		const typeInfo = this.hallucinationType(reg);
		header
			.createSpan({ cls: 'rosypilot-hallucination-type', text: typeInfo.label })
			.addClass(typeInfo.cls);

		// Source URL
		if (reg.url) {
			const sourceRow = card.createDiv('rosypilot-legal-source-url');
			sourceRow.createSpan({
				cls: 'rosypilot-legal-source-label',
				text: `${t('legal.panel.source')}：`,
			});
			appendDomainLink(sourceRow, reg.url);
		}

		// Title
		card.createDiv('rosypilot-legal-item-title').setText(title);

		// Authoritative text
		if (reg.think_tank_content) {
			card
				.createDiv('rosypilot-legal-section-label')
				.setText(t('legal.panel.hallucination.authoritative'));
			card
				.createDiv('rosypilot-legal-item-content')
				.setText(reg.think_tank_content);
		}

		// Comparison explanation
		const explanation = reg.semantic_compare?.说明;
		if (explanation) {
			card
				.createDiv('rosypilot-legal-section-label')
				.setText(t('legal.panel.hallucination.explanation'));
			card.createDiv('rosypilot-legal-item-content').setText(explanation);
		}

		// Key points
		const keyPoints = reg.semantic_compare?.要点;
		if (keyPoints?.length) {
			card
				.createDiv('rosypilot-legal-section-label')
				.setText(t('legal.panel.hallucination.keyPoints'));
			const list = card.createEl('ul', { cls: 'rosypilot-legal-key-points' });
			for (const point of keyPoints) {
				list.createEl('li').setText(point);
			}
		}

		// Meta rows
		const metaRows: LegalDisplayMetaRow[] = [
			{
				label: t('legal.panel.hallucination.meta.validityStatus'),
				value: reg.validity_status,
			},
			{
				label: t('legal.panel.hallucination.meta.publishDate'),
				value: reg.publish_date,
			},
			{
				label: t('legal.panel.hallucination.meta.implementDate'),
				value: reg.implement_date,
			},
		].filter((row): row is LegalDisplayMetaRow => Boolean(row.value));

		if (metaRows.length > 0) {
			const meta = card.createDiv('rosypilot-legal-item-meta');
			for (const row of metaRows) {
				const item = meta.createDiv('rosypilot-legal-meta-row');
				item.createSpan({
					cls: 'rosypilot-legal-meta-label',
					text: `${row.label}：`,
				});
				item.createSpan({ cls: 'rosypilot-legal-meta-value', text: row.value });
			}
		}

		// Actions + analysis section
		if (callbacks) {
			const analysisSection = card.createDiv(
				'rosypilot-legal-analysis-section',
			);
			const actions = card.createDiv('rosypilot-legal-item-actions');

			const locateText = reg.clause || reg.name;
			const locateBtn = actions.createEl('button', {
				cls: 'rosypilot-legal-segment-btn',
				text: t('legal.panel.hallucination.locate'),
			});
			locateBtn.addEventListener('click', () => callbacks.onLocate(locateText));

			this.createAnalyzeButton(actions, analysisSection, () =>
				callbacks.onAnalyze(reg, 'regulation'),
			);
		}
	}

	private renderHallucinationCase(
		parent: HTMLElement,
		c: HallucinationCase,
		callbacks?: {
			onLocate: (searchText: string) => void;
			onAnalyze: (
				item: HallucinationRegulation | HallucinationCase,
				kind: 'regulation' | 'case',
			) => Promise<string>;
		},
	): void {
		const found = Boolean(c.url || c.think_tank_content);
		const badgeText = found
			? t('legal.panel.hallucination.case.found')
			: t('legal.panel.hallucination.case.notFound');
		const verdictClass = found
			? 'rosypilot-legal-verdict-consistent'
			: 'rosypilot-legal-verdict-unknown';

		const title = [c.case_number, c.name].filter(Boolean).join(' ');

		const card = parent.createDiv('rosypilot-legal-item');

		// Header: found/not-found badge
		const header = card.createDiv('rosypilot-hallucination-header');
		const badge = header.createDiv('rosypilot-legal-source-badge');
		badge.addClass(verdictClass);
		badge.setText(badgeText);

		// Source URL
		if (c.url) {
			const sourceRow = card.createDiv('rosypilot-legal-source-url');
			sourceRow.createSpan({
				cls: 'rosypilot-legal-source-label',
				text: `${t('legal.panel.source')}：`,
			});
			appendDomainLink(sourceRow, c.url);
		}

		// Title
		card.createDiv('rosypilot-legal-item-title').setText(title);

		// Database content
		const content = c.think_tank_content || c.content || '';
		if (content) {
			if (c.think_tank_content) {
				card
					.createDiv('rosypilot-legal-section-label')
					.setText(t('legal.panel.hallucination.authoritative'));
			}
			card.createDiv('rosypilot-legal-item-content').setText(content);
		}

		// Meta rows
		const metaRows: LegalDisplayMetaRow[] = [
			{ label: t('legal.panel.meta.court'), value: c.court },
			{ label: t('legal.panel.meta.judgmentDate'), value: c.judgment_date },
		].filter((row): row is LegalDisplayMetaRow => Boolean(row.value));

		if (metaRows.length > 0) {
			const meta = card.createDiv('rosypilot-legal-item-meta');
			for (const row of metaRows) {
				const item = meta.createDiv('rosypilot-legal-meta-row');
				item.createSpan({
					cls: 'rosypilot-legal-meta-label',
					text: `${row.label}：`,
				});
				item.createSpan({ cls: 'rosypilot-legal-meta-value', text: row.value });
			}
		}

		// Actions + analysis section
		if (callbacks) {
			const analysisSection = card.createDiv(
				'rosypilot-legal-analysis-section',
			);
			const actions = card.createDiv('rosypilot-legal-item-actions');

			const locateText = c.case_number || c.name;
			const locateBtn = actions.createEl('button', {
				cls: 'rosypilot-legal-segment-btn',
				text: t('legal.panel.hallucination.locate'),
			});
			locateBtn.addEventListener('click', () => callbacks.onLocate(locateText));

			this.createAnalyzeButton(actions, analysisSection, () =>
				callbacks.onAnalyze(c, 'case'),
			);
		}
	}

	private hallucinationType(reg: HallucinationRegulation): {
		label: string;
		cls: string;
	} {
		if (reg.law_exists === false) {
			return {
				label: t('legal.panel.hallucination.type.fabricated'),
				cls: 'rosypilot-hallucination-type-fabricated',
			};
		}
		if (reg.think_tank_clause_missing) {
			return {
				label: t('legal.panel.hallucination.type.clauseMissing'),
				cls: 'rosypilot-hallucination-type-clause-missing',
			};
		}
		if (reg.semantic_compare?.skipped) {
			return {
				label: t('legal.panel.hallucination.type.unknown'),
				cls: 'rosypilot-hallucination-type-unknown',
			};
		}
		const verdict = reg.semantic_compare?.结论;
		const sim = reg.semantic_compare?.语义相似度 ?? 1;
		if (verdict === '不一致') {
			if (sim < 0.3) {
				return {
					label: t('legal.panel.hallucination.type.severeError'),
					cls: 'rosypilot-hallucination-type-severe',
				};
			}
			return {
				label: t('legal.panel.hallucination.type.misunderstanding'),
				cls: 'rosypilot-hallucination-type-misunderstanding',
			};
		}
		if (verdict === '一致') {
			return {
				label: t('legal.panel.hallucination.type.consistent'),
				cls: 'rosypilot-hallucination-type-consistent',
			};
		}
		return {
			label: t('legal.panel.hallucination.type.unknown'),
			cls: 'rosypilot-hallucination-type-unknown',
		};
	}

	private createAnalyzeButton(
		actionsEl: HTMLElement,
		analysisSection: HTMLElement,
		onAnalyze: () => Promise<string>,
	): void {
		const btn = actionsEl.createEl('button', {
			cls: 'rosypilot-legal-btn',
			text: t('legal.panel.hallucination.analyze'),
		});
		btn.addEventListener('click', () => {
			if (btn.disabled) return;
			btn.disabled = true;
			btn.empty();
			btn.createSpan({ cls: 'rosypilot-legal-btn-spinner' });
			void onAnalyze()
				.then((text) => {
					analysisSection.empty();
					analysisSection
						.createDiv('rosypilot-legal-section-label')
						.setText(t('legal.panel.hallucination.analyzeLabel'));
					analysisSection
						.createDiv('rosypilot-legal-analysis-text')
						.setText(text);
				})
				.catch((err: unknown) => {
					analysisSection.empty();
					analysisSection
						.createDiv(
							'rosypilot-legal-analysis-text rosypilot-legal-analysis-error',
						)
						.setText(err instanceof Error ? err.message : String(err));
				})
				.finally(() => {
					btn.disabled = false;
					btn.empty();
					btn.setText(t('legal.panel.hallucination.reanalyze'));
				});
		});
	}

	private verdictClass(verdict: string): string {
		if (
			verdict === t('legal.panel.hallucination.verdict.consistent') ||
			verdict === '一致'
		) {
			return 'rosypilot-legal-verdict-consistent';
		}
		if (
			verdict === t('legal.panel.hallucination.verdict.inconsistent') ||
			verdict === '不一致'
		) {
			return 'rosypilot-legal-verdict-inconsistent';
		}
		return 'rosypilot-legal-verdict-unknown';
	}

	private renderItem(
		parent: HTMLElement,
		display: LegalDisplayResult,
		callbacks?: {
			onRaw: (format: RawInsertFormat) => void;
			onAdapted: () => Promise<void>;
		},
	): void {
		const card = parent.createDiv('rosypilot-legal-item');
		card.addClass(`rosypilot-legal-item-${display.badgeKind}`);
		const badge = card.createDiv('rosypilot-legal-source-badge');
		badge.addClass(`rosypilot-legal-source-badge-${display.badgeKind}`);
		badge.setText(display.badge);
		if (display.sourceUrl) {
			const sourceRow = card.createDiv('rosypilot-legal-source-url');
			sourceRow.createSpan({
				cls: 'rosypilot-legal-source-label',
				text: `${t('legal.panel.source')}：`,
			});
			appendDomainLink(sourceRow, display.sourceUrl);
		}
		card.createDiv('rosypilot-legal-item-title').setText(display.title);

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

			const rawGroup = actions.createDiv('rosypilot-legal-insert-group');
			rawGroup
				.createSpan({
					cls: 'rosypilot-legal-action-label',
					text: display.rawInsertLabel,
				})
				.setAttribute('aria-hidden', 'true');
			this.createRawInsertButton(rawGroup, callbacks, 'content');
			this.createRawInsertButton(rawGroup, callbacks, 'title-content');
			this.createRawInsertButton(rawGroup, callbacks, 'quote-block');

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

	private createRawInsertButton(
		parent: HTMLElement,
		callbacks: { onRaw: (format: RawInsertFormat) => void },
		format: RawInsertFormat,
	): void {
		const button = parent.createEl('button', {
			cls: 'rosypilot-legal-segment-btn',
			text: t(`legal.panel.insert.format.${format}`),
		});
		button.addEventListener('click', () => callbacks.onRaw(format));
	}
}
