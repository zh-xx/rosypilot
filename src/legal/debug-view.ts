import { ItemView } from 'obsidian';
import { LegalCommandDebugEntry } from './debug';

export const LEGAL_DEBUG_VIEW_TYPE = 'rosypilot-legal-debug';

export class LegalCommandDebugView extends ItemView {
	private container!: HTMLElement;

	getViewType(): string {
		return LEGAL_DEBUG_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'Legal command debug';
	}

	getIcon(): string {
		return 'bug';
	}

	onOpen(): Promise<void> {
		const toolbar = this.contentEl.createDiv('rosypilot-debug-toolbar');
		const clearBtn = toolbar.createEl('button', {
			text: 'Clear',
			cls: 'rosypilot-debug-clear-btn',
		});
		clearBtn.addEventListener('click', () => {
			this.container.empty();
			this.container.setText('Waiting for legal commands...');
		});

		this.container = this.contentEl.createDiv('rosypilot-debug-container');
		this.container.setText('Waiting for legal commands...');
		return Promise.resolve();
	}

	onClose(): Promise<void> {
		return Promise.resolve();
	}

	log(entry: LegalCommandDebugEntry): void {
		if (this.container.querySelector('.rosypilot-debug-card') === null) {
			this.container.empty();
		}

		const card = this.container.createDiv('rosypilot-debug-card');
		this.container.prepend(card);

		const header = card.createDiv('rosypilot-debug-card-header');
		const time = new Date(entry.timestamp).toLocaleTimeString();
		header.createSpan({
			text: `[${time}] ${entry.commandId}`,
			cls: 'rosypilot-debug-card-context',
		});
		header.createSpan({
			text: this.buildHeaderPreview(entry),
			cls: 'rosypilot-debug-card-preview',
		});

		const actions = header.createDiv('rosypilot-debug-card-actions');
		const copyBtn = actions.createEl('button', {
			text: 'Copy',
			cls: 'rosypilot-debug-copy-btn',
		});
		copyBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			void navigator.clipboard.writeText(JSON.stringify(entry, null, 2));
			copyBtn.setText('Copied!');
			activeWindow.setTimeout(() => copyBtn.setText('Copy'), 1500);
		});

		const toggleBtn = actions.createEl('button', {
			text: '▸',
			cls: 'rosypilot-debug-toggle-btn',
		});

		const body = card.createDiv('rosypilot-debug-card-body');
		body.classList.add('rosypilot-hidden');

		header.addEventListener('click', () => {
			const isHidden = body.classList.contains('rosypilot-hidden');
			body.classList.toggle('rosypilot-hidden', !isHidden);
			toggleBtn.setText(isHidden ? '▾' : '▸');
			card.classList.toggle('rosypilot-debug-card-open', isHidden);
		});

		this.renderSummary(body, entry);
		this.renderSection(body, 'Trigger', {
			commandId: entry.commandId,
			prefix: entry.prefix,
			durationMs: entry.durationMs,
		});
		this.renderSection(body, 'Judge', entry.judge ?? {});
		this.renderSection(body, 'Route', entry.route);
		this.renderSection(body, 'Execution plan', entry.plan);
		this.renderSection(body, 'Executor steps', entry.steps);
		this.renderSection(
			body,
			'Results',
			entry.results.map((result) => ({
				id: result.id,
				type: result.type,
				title: result.title,
				source: result.source,
				metadata: result.metadata,
				contentPreview: result.content.slice(0, 200),
			})),
		);
		this.renderSection(body, 'Applications', entry.applications ?? []);
		this.renderSection(body, 'Raw JSON', entry);
	}

	private buildHeaderPreview(entry: LegalCommandDebugEntry): string {
		const ref =
			entry.route.kind === 'exact-provision'
				? ` · ${entry.route.ref.fgmc}${entry.route.ref.ftnum}`
				: '';
		const applicationCount = entry.applications?.length ?? 0;
		return `${entry.route.kind}${ref} · ${entry.plan.mode} · ${entry.results.length} result(s) · ${applicationCount} action(s)`;
	}

	private renderSummary(
		parent: HTMLElement,
		entry: LegalCommandDebugEntry,
	): void {
		const summary = parent.createDiv('rosypilot-debug-summary');
		summary.createEl('strong', { text: 'Summary' });
		const rows = summary.createDiv('rosypilot-debug-summary-grid');
		this.renderSummaryRow(rows, 'Trigger', entry.commandId);
		this.renderSummaryRow(rows, 'Route', this.describeRoute(entry));
		this.renderSummaryRow(
			rows,
			'Plan',
			`${entry.plan.mode}: ${entry.plan.steps
				.map((step) => step.executorId)
				.join(' -> ')}`,
		);
		this.renderSummaryRow(rows, 'Steps', this.describeSteps(entry));
		this.renderSummaryRow(rows, 'Results', this.describeResults(entry));
		this.renderSummaryRow(
			rows,
			'Applications',
			this.describeApplications(entry),
		);
	}

	private renderSummaryRow(
		parent: HTMLElement,
		label: string,
		value: string,
	): void {
		const row = parent.createDiv('rosypilot-debug-summary-row');
		row.createSpan({
			cls: 'rosypilot-debug-summary-label',
			text: label,
		});
		row.createSpan({
			cls: 'rosypilot-debug-summary-value',
			text: value,
		});
	}

	private describeRoute(entry: LegalCommandDebugEntry): string {
		if (entry.route.kind === 'exact-provision') {
			return `${entry.route.ref.fgmc} ${entry.route.ref.ftnum}`;
		}
		return entry.route.kind;
	}

	private describeSteps(entry: LegalCommandDebugEntry): string {
		if (entry.steps.length === 0) return 'none';
		return entry.steps
			.map((step) => `${step.executorId}:${step.status}(${step.resultCount})`)
			.join(' | ');
	}

	private describeResults(entry: LegalCommandDebugEntry): string {
		if (entry.results.length === 0) return 'none';
		return entry.results
			.map((result) => {
				const extraction = result.metadata.extractionKind
					? `/${result.metadata.extractionKind}`
					: '';
				return `${result.source.name ?? result.source.provider}${extraction}`;
			})
			.join(' | ');
	}

	private describeApplications(entry: LegalCommandDebugEntry): string {
		const applications = entry.applications ?? [];
		if (applications.length === 0) return 'none';
		return applications
			.map((app) => {
				const format = app.format ? `:${app.format}` : '';
				return `${app.actionId}${format}:${app.status}`;
			})
			.join(' | ');
	}

	private renderSection(
		parent: HTMLElement,
		title: string,
		value: unknown,
	): void {
		const section = parent.createDiv('rosypilot-debug-section');
		section.createEl('strong', { text: title });
		const pre = section.createEl('pre');
		pre.setText(
			typeof value === 'string' ? value : JSON.stringify(value, null, 2),
		);
	}
}
