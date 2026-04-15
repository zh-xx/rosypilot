const HEADING_LINE = /^(#{1,6})\s+(.+)$/;

interface HeadingInfo {
	level: number;
	text: string;
}

/**
 * Extract the ancestor heading chain from prefix.
 *
 * Walks all lines in prefix and maintains a stack to track the current
 * ancestor path (e.g. "# H1 > ## H2 > ### H3").
 * Returns a multi-line string of heading lines, or empty string if none found.
 */
export function getSectionPath(prefix: string): string {
	const lines = prefix.split('\n');
	const stack: HeadingInfo[] = [];

	for (const line of lines) {
		const match = line.match(HEADING_LINE);
		if (!match) continue;
		const level = match[1].length;
		const text = match[2].trim();
		while (stack.length > 0 && stack[stack.length - 1].level >= level) {
			stack.pop();
		}
		stack.push({ level, text });
	}

	return stack.map((h) => `${'#'.repeat(h.level)} ${h.text}`).join('\n');
}

/**
 * Build a structured context message for paragraph completion.
 *
 * Output format:
 *   <SECTION> :          (only if heading ancestors exist)
 *   # H1
 *   ## H2
 *   ### H3
 *
 *   <CONTEXT> :
 *   ...prefix<MASK>suffix...
 */
export function buildParagraphContext(
	prefix: string,
	suffix: string,
	windowSize: number,
): string {
	const sectionPath = getSectionPath(prefix);

	const truncatedPrefix = prefix.slice(prefix.length - windowSize / 2);
	const truncatedSuffix = suffix.slice(0, windowSize / 2);
	const contextContent = `${truncatedPrefix}<MASK>${truncatedSuffix}`;

	const parts: string[] = [];

	if (sectionPath) {
		parts.push('<SECTION> :');
		parts.push(sectionPath);
		parts.push('');
	}

	parts.push('<CONTEXT> :');
	parts.push(contextContent);

	return parts.join('\n');
}
