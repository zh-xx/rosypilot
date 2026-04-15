import {
	Decoration,
	DecorationSet,
	EditorView,
	PluginSpec,
	PluginValue,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from '@codemirror/view';
import { completionsStateField } from './state';

class CompletionsWidget extends WidgetType {
	constructor(
		private readonly completions: string,
		private readonly acceptKey: string,
		private readonly rejectKey: string,
	) {
		super();
	}

	private formatKey(key: string): string {
		const aliases: Record<string, string> = {
			Escape: 'Esc',
			Enter: '↵',
			Tab: 'Tab',
			ArrowUp: '↑',
			ArrowDown: '↓',
			ArrowLeft: '←',
			ArrowRight: '→',
		};
		return aliases[key] ?? key;
	}

	toDOM(view: EditorView) {
		const wrapper = document.createElement('span');

		const textEl = document.createElement('span');
		textEl.classList.add('rosypilot-completions');
		textEl.textContent = this.completions;

		const hintEl = document.createElement('span');
		hintEl.classList.add('rosypilot-completions-hint');

		const dividerEl = document.createElement('span');
		dividerEl.classList.add('rosypilot-completions-hint-divider');
		dividerEl.textContent = '|';

		const acceptEl = document.createElement('span');
		acceptEl.classList.add('rosypilot-completions-hint-accept');
		acceptEl.textContent = `✓ ${this.formatKey(this.acceptKey)}`;

		const dotEl = document.createTextNode(' · ');

		const rejectEl = document.createElement('span');
		rejectEl.classList.add('rosypilot-completions-hint-reject');
		rejectEl.textContent = `✕ ${this.formatKey(this.rejectKey)}`;

		hintEl.appendChild(dividerEl);
		hintEl.appendChild(acceptEl);
		hintEl.appendChild(dotEl);
		hintEl.appendChild(rejectEl);

		wrapper.appendChild(textEl);
		wrapper.appendChild(hintEl);
		return wrapper;
	}

	get lineBreaks() {
		return this.completions.split('\n').length - 1;
	}
}

class CompletionsRenderPluginValue implements PluginValue {
	public decorations: DecorationSet = Decoration.none;

	constructor(
		private readonly acceptKey: string,
		private readonly rejectKey: string,
	) {}

	update(update: ViewUpdate) {
		const { state } = update;

		const completionsState = state.field(completionsStateField);
		if (completionsState === undefined) {
			this.decorations = Decoration.none;
			return;
		}

		const decoration = Decoration.widget({
			widget: new CompletionsWidget(
				completionsState.completions,
				this.acceptKey,
				this.rejectKey,
			),
			side: 1,
		});
		this.decorations = Decoration.set([
			decoration.range(state.selection.main.head),
		]);
	}
}

const completionsRenderPluginSpec: PluginSpec<CompletionsRenderPluginValue> = {
	decorations: (value: CompletionsRenderPluginValue) => value.decorations,
};

export function createCompletionsRenderPlugin(acceptKey: string, rejectKey: string) {
	return ViewPlugin.define(
		() => new CompletionsRenderPluginValue(acceptKey, rejectKey),
		completionsRenderPluginSpec,
	);
}
