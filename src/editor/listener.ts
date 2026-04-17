import { EditorView, ViewUpdate } from '@codemirror/view';
import { Notice } from 'obsidian';
import RosyPilot from 'src/main';
import { CompletionsFetcher } from './extension';
import { setCompletionsEffect, unsetCompletionsEffect } from './state';

let isComposing = false;

export const createImeCompositionExtension = (cancel: () => void) =>
	EditorView.domEventHandlers({
		compositionstart: () => {
			isComposing = true;
			cancel();
		},
		compositionend: () => {
			isComposing = false;
		},
	});

function showCompletions(fetcher: CompletionsFetcher) {
	let lastHead = -1;
	let latestCompletionsId = 0;

	return async (update: ViewUpdate) => {
		if (isComposing) {
			return;
		}

		const { state, view } = update;

		// TODO:
		// Stop re-fetching the completions when the suggestions match the typed text.

		// If the document has not changed and the head has not moved, keep the completions.
		const previousHead = lastHead;
		const currentHead = state.selection.main.head;
		lastHead = currentHead;
		if (!update.docChanged && currentHead === previousHead) {
			return;
		}

		// If there are multiple or non-empty selection, skip showing the completions.
		if (state.selection.ranges.length > 1 || !state.selection.main.empty) {
			view.dispatch({ effects: [unsetCompletionsEffect.of(null)] });
			return;
		}
		// If the suffix does not end with a punctuation or space, ignore.
		const head = state.selection.main.head;
		const char = state.sliceDoc(head, head + 1);
		if (char.length == 1 && !char.match(/^[\p{P}\s]/u)) {
			view.dispatch({ effects: [unsetCompletionsEffect.of(null)] });
			return;
		}
		// If the prefix is empty, ignore.
		// This helps prevent showing completions when opening a new document.
		const prefix = state.sliceDoc(0, head);
		const suffix = state.sliceDoc(head, state.doc.length);
		if (prefix.trim() === '') {
			view.dispatch({ effects: [unsetCompletionsEffect.of(null)] });
			return;
		}

		// Hide the current completion before fetching a new one.
		view.dispatch({
			effects: [unsetCompletionsEffect.of(null)],
		});

		const currentCompletionsId = ++latestCompletionsId;

		// Fetch completions from the server.
		const completions = await fetcher(prefix, suffix).catch((error) => {
			new Notice(`Failed to fetch completions: ${String(error)}`);
			return undefined;
		});
		// If fetch has failed, ignore and return.
		if (completions === undefined) {
			return;
		}

		// If there are newer completions request, ignore the current one.
		if (currentCompletionsId !== latestCompletionsId) {
			return;
		}

		view.dispatch({
			effects: [setCompletionsEffect.of({ completions: completions })],
		});
	};
}

export const showCompletionsOnUpdate = (
	fetcher: CompletionsFetcher,
	plugin: RosyPilot,
) => {
	const handler = showCompletions(fetcher);
	return EditorView.updateListener.of((update) => void handler(update));
};
