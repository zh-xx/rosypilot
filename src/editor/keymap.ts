import { Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import RosyPilot from 'src/main';
import { CompletionsCancel } from './extension';
import { completionsStateField, unsetCompletionsEffect } from './state';

export function acceptCompletionsOnKeydown(plugin: RosyPilot) {
	function run(view: EditorView) {
		const { state } = view;

		if (state.selection.ranges.length > 1 || !state.selection.main.empty) {
			return false;
		}

		// If there are no completions displayed, do nothing.
		const completionsState = state.field(completionsStateField);
		if (completionsState === undefined) {
			return false;
		}

		// Hide the current completions first.
		view.dispatch({
			effects: [unsetCompletionsEffect.of(null)],
		});

		// Insert completions to the current cursor position.
		const head = state.selection.main.head;
		const newHead = head + completionsState.completions.length;

		view.dispatch({
			selection: {
				head: newHead,
				anchor: newHead,
			},
			changes: [
				state.changes({
					from: head,
					to: head,
					insert: completionsState.completions,
				}),
			],
		});

		return true;
	}

	const key = plugin.settings.completions.acceptKey;
	return Prec.highest(keymap.of([{ key, run }]));
}

export function rejectCompletionsOnKeydown(
	cancel: CompletionsCancel,
	plugin: RosyPilot,
) {
	const { settings } = plugin;

	function run(view: EditorView) {
		const { state } = view;

		if (state.selection.ranges.length > 1 || !state.selection.main.empty) {
			return false;
		}

		// If there are no completions displayed, do nothing.
		const completionsState = state.field(completionsStateField);
		if (completionsState === undefined) {
			return false;
		}

		cancel();
		view.dispatch({
			effects: [unsetCompletionsEffect.of(null)],
		});
		return true;
	}

	const key = settings.completions.rejectKey;
	return Prec.highest(keymap.of([{ key, run }]));
}
