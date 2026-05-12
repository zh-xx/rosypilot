import { Editor } from 'obsidian';
import { EditorView } from '@codemirror/view';

export interface LegalCommandRequest {
	commandId: string;
	prefix: string;
	editor: Editor;
	editorView: EditorView;
}
