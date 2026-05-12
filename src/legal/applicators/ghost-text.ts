import { EditorView } from '@codemirror/view';
import { setCompletionsEffect } from 'src/editor/state';

export function injectGhostText(editorView: EditorView, text: string): void {
	editorView.dispatch({
		effects: [setCompletionsEffect.of({ completions: text })],
	});
}
