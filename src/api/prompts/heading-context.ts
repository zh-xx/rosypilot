const HEADING_LINE = /^(#{1,6})\s*(.*)$/;

interface HeadingInfo {
	level: number;
	text: string;
}

/**
 * Build a structured context message for heading completion.
 *
 * From prefix + suffix, extracts:
 * - Parent headings (the ancestor chain, top-down)
 * - Sibling headings (same-level headings before and after)
 * - The current heading position marked with <MASK>
 * - Child headings (all deeper headings before the next same/higher-level heading)
 * - Body text (all text between current heading and the next heading of any level)
 */
export function buildHeadingContext(prefix: string, suffix: string): string {
	const prefixLines = prefix.split('\n');
	const suffixLines = suffix.split('\n');

	// Find the current heading line in prefix (the one the cursor is in).
	// Scan backwards from the end of prefix to find the nearest heading.
	let currentHeadingLevel = 0;
	let currentHeadingIndex = -1;
	for (let i = prefixLines.length - 1; i >= 0; i--) {
		const match = prefixLines[i].match(HEADING_LINE);
		if (match) {
			currentHeadingLevel = match[1].length;
			currentHeadingIndex = i;
			break;
		}
	}

	// If we can't find a heading line in prefix, the cursor is on a new heading
	// line that starts with # but hasn't been typed yet. Look at the very last
	// line to see if it starts with #.
	if (currentHeadingIndex === -1) {
		const lastLine = prefixLines[prefixLines.length - 1] ?? '';
		const hashMatch = lastLine.match(/^(#{1,6})\s*/);
		if (hashMatch) {
			currentHeadingLevel = hashMatch[1].length;
			currentHeadingIndex = prefixLines.length - 1;
		}
	}

	// Still can't determine — fallback to h2
	if (currentHeadingLevel === 0) {
		currentHeadingLevel = 2;
	}

	// Use a heading stack to track the ancestor chain from prefix.
	const stack: HeadingInfo[] = [];
	const siblingsBefore: HeadingInfo[] = [];
	for (let i = 0; i < currentHeadingIndex; i++) {
		const match = prefixLines[i].match(HEADING_LINE);
		if (!match) continue;
		const level = match[1].length;
		const text = match[2].trim();
		if (level < currentHeadingLevel) {
			while (stack.length > 0 && stack[stack.length - 1].level >= level) {
				stack.pop();
			}
			stack.push({ level, text });
		} else if (level === currentHeadingLevel) {
			siblingsBefore.push({ level, text });
		}
	}
	const parents = stack;

	// Extract text already typed in the heading:
	// - headingTextBefore: text on the heading line before the cursor (from prefix)
	// - headingTextAfter:  text on the heading line after the cursor (suffix line 0)
	const currentHeadingLine = prefixLines[currentHeadingIndex] ?? '';
	const headingTextBefore = currentHeadingLine.replace(/^#{1,6}\s*/, '');
	const headingTextAfter = suffixLines[0] ?? '';

	// Scan suffix in two phases, starting from line 1 (line 0 is the rest of the
	// heading line, already captured in headingTextAfter), skipping all leading
	// empty lines before entering the phase logic.
	// Phase 'body':     collect body text before any child heading.
	// Phase 'children': collect child headings; stop collecting body text.
	// Phase 'siblings': collect same-level siblings after MASK's section.
	// Phase 'done':     stop scanning.
	const siblingsAfter: HeadingInfo[] = [];
	const children: HeadingInfo[] = [];
	const bodyLines: string[] = [];

	let phase: 'body' | 'children' | 'siblings' | 'done' = 'body';
	let leadingEmptySkipped = false;

	for (let i = 1; i < suffixLines.length; i++) {
		if (phase === 'done') break;

		const line = suffixLines[i];

		// Skip all leading empty lines before any content
		if (!leadingEmptySkipped && line.trim() === '') {
			continue;
		}
		leadingEmptySkipped = true;

		const match = line.match(HEADING_LINE);
		if (match) {
			const level = match[1].length;
			const text = match[2].trim();

			if (phase === 'body' || phase === 'children') {
				if (level < currentHeadingLevel) {
					// Higher-level heading ends everything
					phase = 'done';
				} else if (level === currentHeadingLevel) {
					// Same-level heading ends MASK's section; start sibling collection
					siblingsAfter.push({ level, text });
					phase = 'siblings';
				} else {
					// Deeper heading — child of MASK's section
					children.push({ level, text });
					phase = 'children';
				}
			} else if (phase === 'siblings') {
				if (level < currentHeadingLevel) {
					// Higher-level heading ends sibling scan
					phase = 'done';
				} else if (level === currentHeadingLevel) {
					siblingsAfter.push({ level, text });
				}
				// Skip deeper headings during sibling scan
			}
		} else if (phase === 'body') {
			// Only collect body lines before the first child heading
			bodyLines.push(line);
		}
	}

	// Trim trailing empty lines from body
	while (
		bodyLines.length > 0 &&
		bodyLines[bodyLines.length - 1].trim() === ''
	) {
		bodyLines.pop();
	}

	// Assemble the new <DIR> / <SUB> / <CONTENT> format
	const parts: string[] = [];

	// OUTLINE section: parent headings + siblings-before + MASK + siblings-after
	parts.push('<OUTLINE> :');
	for (const h of parents) {
		parts.push(`${'#'.repeat(h.level)} ${h.text}`);
	}
	for (const h of siblingsBefore) {
		parts.push(`${'#'.repeat(h.level)} ${h.text}`);
	}
	const hashes = '#'.repeat(currentHeadingLevel);
	const maskLine = headingTextBefore
		? `${hashes} ${headingTextBefore}<MASK>${headingTextAfter}`
		: `${hashes} <MASK>${headingTextAfter}`;
	parts.push(maskLine);
	for (const h of siblingsAfter) {
		parts.push(`${'#'.repeat(h.level)} ${h.text}`);
	}

	// CHILDREN section: child headings (only if any)
	if (children.length > 0) {
		parts.push('');
		parts.push('<CHILDREN> :');
		for (const h of children) {
			parts.push(`${'#'.repeat(h.level)} ${h.text}`);
		}
	}

	// CONTENT section: body text (only if any)
	if (bodyLines.length > 0) {
		parts.push('');
		parts.push('<CONTENT> :');
		parts.push(bodyLines.join('\n'));
	}

	return parts.join('\n');
}
