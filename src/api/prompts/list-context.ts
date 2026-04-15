import { getSectionPath } from './paragraph-context';

// Matches any list item line: unordered (- / *), numbered (1.), task (- [ ])
const LIST_ITEM_REGEX = /^\s*(?:-|\*|\d+\.)\s/;

// Matches a cursor line that contains ONLY the list marker (with optional
// whitespace), meaning the user has not yet typed any item content.
// Examples: "-", "- ", "* ", "1. ", "  - "
const MARKER_ONLY_REGEX = /^(\s*(?:-|\*|\d+\.)\s?)$/;

// Extracts the normalized list marker (with trailing space) from a line.
const MARKER_EXTRACT_REGEX = /^(\s*(?:-|\*|\d+\.)\s?)/;

function isListLine(line: string): boolean {
	return LIST_ITEM_REGEX.test(line);
}

/**
 * Normalize the cursor line for display in <LIST>.
 *
 * When the cursor is right after the list marker with no content typed yet
 * (e.g. "- " or "-"), show "- <MASK>" so the model knows to generate only
 * the item text, not repeat the marker.
 *
 * When the cursor is mid-line (there is already content before <MASK>),
 * leave the line as-is: the model will continue the existing text inline.
 */
function normalizeCursorLine(before: string, after: string): string {
	if (MARKER_ONLY_REGEX.test(before)) {
		// Cursor is right after the marker — extract marker and ensure one space.
		const markerMatch = before.match(MARKER_EXTRACT_REGEX);
		const marker = markerMatch ? markerMatch[1].trimEnd() : before.trimEnd();
		return `${marker} <MASK>${after}`;
	}
	return `${before}<MASK>${after}`;
}

/**
 * Build a structured context message for list-item completion.
 *
 * Output format:
 *   <SECTION> :          (only if heading ancestors exist)
 *   # H1
 *   ## H2
 *
 *   <LIST> :
 *   - item before
 *   - <MASK>remaining text on cursor line
 *   - item after
 *
 * List boundaries are detected by scanning prefix (backwards) and suffix
 * (forwards) for contiguous list lines. Total items shown on each side are
 * bounded by windowSize / 2 characters.
 */
export function buildListContext(
	prefix: string,
	suffix: string,
	windowSize: number,
): string {
	const sectionPath = getSectionPath(prefix);

	const prefixLines = prefix.split('\n');
	const suffixLines = suffix.split('\n');

	// The cursor line is split across the last prefix line and first suffix line.
	const cursorLineBefore = prefixLines[prefixLines.length - 1] ?? '';
	const cursorLineAfter = suffixLines[0] ?? '';
	const cursorLine = normalizeCursorLine(cursorLineBefore, cursorLineAfter);

	// Collect list items before cursor (exclude last prefix line = cursor line).
	// Walk backwards; stop at the first non-list non-empty line or a blank line
	// (a single blank line is allowed inside a list but we stop there for safety).
	const itemsBefore: string[] = [];
	let beforeChars = 0;
	for (let i = prefixLines.length - 2; i >= 0; i--) {
		const line = prefixLines[i];
		if (line.trim() === '' || !isListLine(line)) break;
		const cost = line.length + 1; // +1 for newline
		if (beforeChars + cost > windowSize / 2) break;
		itemsBefore.unshift(line);
		beforeChars += cost;
	}

	// Collect list items after cursor (start from suffix line 1; line 0 is the
	// remainder of the cursor line, already captured in cursorLineAfter).
	const itemsAfter: string[] = [];
	let afterChars = 0;
	for (let i = 1; i < suffixLines.length; i++) {
		const line = suffixLines[i];
		if (line.trim() === '' || !isListLine(line)) break;
		const cost = line.length + 1;
		if (afterChars + cost > windowSize / 2) break;
		itemsAfter.push(line);
		afterChars += cost;
	}

	// Assemble output
	const listLines = [...itemsBefore, cursorLine, ...itemsAfter];

	const parts: string[] = [];
	if (sectionPath) {
		parts.push('<SECTION> :');
		parts.push(sectionPath);
		parts.push('');
	}
	parts.push('<LIST> :');
	parts.push(listLines.join('\n'));

	return parts.join('\n');
}
