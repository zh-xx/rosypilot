import { ItemView } from 'obsidian';

export const DEBUG_VIEW_TYPE = 'rosypilot-debug';

export interface DebugEntry {
	context: string;
	section?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	prompt: any[];
	request: {
		model: string;
		max_tokens: number;
		temperature: number;
		stop: string[];
	};
	rawResponse: string;
	parsedResult: string;
	timestamp: number;
}

export class DebugView extends ItemView {
	private container!: HTMLElement;

	getViewType(): string {
		return DEBUG_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'RosyPilot Debug';
	}

	getIcon(): string {
		return 'bug';
	}

	async onOpen(): Promise<void> {
		this.container = this.contentEl.createDiv('rosypilot-debug-container');
		this.container.setText('Waiting for completions...');
	}

	async onClose(): Promise<void> {
		// Cleanup
	}

	log(entry: DebugEntry): void {
		// On first log, clear the "waiting" message
		if (this.container.querySelector('.rosypilot-debug-card') === null) {
			this.container.empty();
		}

		// Insert at the top (newest first)
		const card = this.container.createDiv('rosypilot-debug-card');
		this.container.prepend(card);

		// Collapsed header — always visible
		const header = card.createDiv('rosypilot-debug-card-header');
		const time = new Date(entry.timestamp).toLocaleTimeString();
		const contextLabel = entry.section
			? `[${time}] ${entry.context}  §${
					entry.section
						.split('\n')
						.pop()
						?.replace(/^#+\s*/, '') ?? ''
				}`
			: `[${time}] ${entry.context}`;
		header.createSpan({
			text: contextLabel,
			cls: 'rosypilot-debug-card-context',
		});

		// Preview: first line of parsed result
		const preview = entry.parsedResult.split('\n')[0].slice(0, 50);
		header.createSpan({ text: preview, cls: 'rosypilot-debug-card-preview' });

		const actions = header.createDiv('rosypilot-debug-card-actions');

		const copyBtn = actions.createEl('button', {
			text: 'Copy',
			cls: 'rosypilot-debug-copy-btn',
		});
		copyBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			const text = `Context: ${entry.context}\n\nRequest:\n${JSON.stringify(entry.request, null, 2)}\n\nPrompt:\n${entry.prompt.map((m) => `[${m.role}]\n${typeof m.content === 'string' ? m.content : JSON.stringify(m.content, null, 2)}`).join('\n\n')}\n\nRaw Response:\n${entry.rawResponse}\n\nParsed Result:\n${entry.parsedResult}`;
			navigator.clipboard.writeText(text);
			copyBtn.setText('Copied!');
			setTimeout(() => copyBtn.setText('Copy'), 1500);
		});

		const toggleBtn = actions.createEl('button', {
			text: '▸',
			cls: 'rosypilot-debug-toggle-btn',
		});

		// Expandable body — hidden by default
		const body = card.createDiv('rosypilot-debug-card-body');
		body.style.display = 'none';

		// Toggle
		header.addEventListener('click', () => {
			const isOpen = body.style.display !== 'none';
			body.style.display = isOpen ? 'none' : 'block';
			toggleBtn.setText(isOpen ? '▸' : '▾');
			card.classList.toggle('rosypilot-debug-card-open', !isOpen);
		});

		// Context info (section path, only for paragraph)
		if (entry.section) {
			const ctxSection = body.createDiv('rosypilot-debug-section');
			ctxSection.createEl('strong', { text: 'Context Info' });
			const ctxPre = ctxSection.createEl('pre');
			ctxPre.setText(`Section:\n${entry.section}`);
		}

		// Request params
		const reqSection = body.createDiv('rosypilot-debug-section');
		reqSection.createEl('strong', { text: 'Request' });
		const reqPre = reqSection.createEl('pre');
		reqPre.setText(JSON.stringify(entry.request, null, 2));

		// Prompt messages
		const promptSection = body.createDiv('rosypilot-debug-section');
		promptSection.createEl('strong', { text: 'Prompt' });
		for (const msg of entry.prompt) {
			const msgDiv = promptSection.createDiv('rosypilot-debug-message');
			msgDiv.createEl('code', { text: msg.role });
			const contentPre = msgDiv.createEl('pre');
			contentPre.setText(
				typeof msg.content === 'string'
					? msg.content
					: JSON.stringify(msg.content, null, 2),
			);
		}

		// Raw response
		const rawSection = body.createDiv('rosypilot-debug-section');
		rawSection.createEl('strong', { text: 'Raw Response' });
		const rawPre = rawSection.createEl('pre');
		rawPre.setText(entry.rawResponse);

		// Parsed result
		const parsedSection = body.createDiv('rosypilot-debug-section');
		parsedSection.createEl('strong', { text: 'Parsed Result' });
		const parsedPre = parsedSection.createEl('pre');
		parsedPre.setText(entry.parsedResult);
	}
}
