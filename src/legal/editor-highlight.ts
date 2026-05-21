import { Decoration, DecorationSet, EditorView } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';

export const setHallucinationHighlight =
	StateEffect.define<{ from: number; to: number }[]>();

export const clearHallucinationHighlight = StateEffect.define<undefined>();

export const hallucinationHighlightField = StateField.define<DecorationSet>({
	create() {
		return Decoration.none;
	},
	update(value, tr) {
		value = value.map(tr.changes);
		for (const effect of tr.effects) {
			if (effect.is(setHallucinationHighlight)) {
				const marks = effect.value.map(({ from, to }) =>
					Decoration.mark({
						class: 'rosypilot-hallucination-highlight',
					}).range(from, to),
				);
				value =
					marks.length > 0 ? Decoration.set(marks, true) : Decoration.none;
			} else if (effect.is(clearHallucinationHighlight)) {
				value = Decoration.none;
			}
		}
		return value;
	},
	provide: (field) => EditorView.decorations.from(field),
});
