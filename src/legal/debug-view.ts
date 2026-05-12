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
			text: `${entry.route.kind} · ${entry.plan.mode} · ${entry.results.length} result(s)`,
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
			setTimeout(() => copyBtn.setText('Copy'), 1500);
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
