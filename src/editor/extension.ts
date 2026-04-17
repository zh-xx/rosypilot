import RosyPilot from 'src/main';
import {
	acceptCompletionsOnKeydown,
	rejectCompletionsOnKeydown,
} from './keymap';
import {
	createImeCompositionExtension,
	showCompletionsOnUpdate,
} from './listener';
import { completionsStateField } from './state';
import { createCompletionsRenderPlugin } from './view';

export type CompletionsFetcher = (
	prefix: string,
	suffix: string,
) => Promise<string | undefined>;

export type CompletionsCancel = () => void;
export type CompletionsForce = () => void;

export function inlineCompletionsExtension(
	fetcher: CompletionsFetcher,
	cancel: () => void,
	force: () => void,
	plugin: RosyPilot,
) {
	return [
		completionsStateField,
		createCompletionsRenderPlugin(
			plugin.settings.completions.acceptKey,
			plugin.settings.completions.rejectKey,
		),
		showCompletionsOnUpdate(fetcher, plugin),
		acceptCompletionsOnKeydown(force, plugin),
		rejectCompletionsOnKeydown(cancel, plugin),
		createImeCompositionExtension(cancel),
	];
}
