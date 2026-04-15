import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import RosyPilot from 'src/main';
import { BLOCK_QUOTE_PROMPT } from './completions/block-quote';
import { CODE_BLOCK_PROMPT } from './completions/code-block';
import { HEADING_PROMPT } from './completions/heading';
import { LIST_ITEM_PROMPT } from './completions/list-item';
import { MATH_BLOCK_PROMPT } from './completions/math-block';
import { PARAGRAPH_PROMPT } from './completions/paragraph';
import { Context, getContext, getLanguage } from './context';
import { buildHeadingContext } from './heading-context';
import { buildListContext } from './list-context';
import { buildParagraphContext, getSectionPath } from './paragraph-context';

const COMPLETIONS_PROMPTS: Record<Context, { system: string }> = {
	heading: HEADING_PROMPT,
	paragraph: PARAGRAPH_PROMPT,
	'list-item': LIST_ITEM_PROMPT,
	'block-quote': BLOCK_QUOTE_PROMPT,
	'math-block': MATH_BLOCK_PROMPT,
	'code-block': CODE_BLOCK_PROMPT,
};

export class PromptGenerator {
	constructor(private plugin: RosyPilot) {}

	getContext(prefix: string, suffix: string): Context {
		return getContext(prefix, suffix);
	}

	generateCompletionsPrompt(prefix: string, suffix: string) {
		const { settings } = this.plugin;

		const context = getContext(prefix, suffix);
		const prompt = COMPLETIONS_PROMPTS[context];
		const system =
			context === 'code-block'
				? prompt.system.replace(
						'{{LANGUAGE}}',
						getLanguage(prefix, suffix) ?? '',
					)
				: prompt.system;

		const windowSize = settings.completions.windowSize;
		let userContent: string;
		if (context === 'heading') {
			userContent = buildHeadingContext(prefix, suffix);
		} else if (context === 'paragraph') {
			userContent = buildParagraphContext(prefix, suffix, windowSize);
		} else if (context === 'list-item') {
			userContent = buildListContext(prefix, suffix, windowSize);
		} else if (context === 'block-quote') {
			userContent = buildParagraphContext(prefix, suffix, windowSize);
		} else if (context === 'math-block' || context === 'code-block') {
			userContent = buildParagraphContext(prefix, suffix, windowSize);
		} else {
			const truncatedPrefix = prefix.slice(
				prefix.length - windowSize / 2,
				prefix.length,
			);
			const truncatedSuffix = suffix.slice(0, windowSize / 2);
			userContent = `${truncatedPrefix}<MASK>${truncatedSuffix}`;
		}

		return [
			{
				role: 'system',
				content: system,
			},
			{
				role: 'user',
				content: userContent,
			},
			// Prefill the assistant response with <INSERT> to force the model
			// to start directly with the completion text, skipping any preamble.
			{
				role: 'assistant',
				content: '<INSERT>\n',
			},
		] as ChatCompletionMessageParam[];
	}

	getSectionPath(prefix: string): string | undefined {
		return getSectionPath(prefix) || undefined;
	}

	parseResponse(content: string) {
		// Primary path: model echoed <INSERT> despite prefill, or prefill
		// was not used — extract everything after the marker.
		const lines = content.split('\n');
		const insertIndex = lines.indexOf('<INSERT>');
		if (insertIndex !== -1) {
			return lines.slice(insertIndex + 1).join('\n');
		}
		// Prefill path: API response starts directly with the completion text
		// (the <INSERT>\n prefix was consumed by the prefill, not returned).
		// Some models (e.g. Doubao) treat <INSERT> as an XML tag and append
		// </INSERT> at the end — strip both variants.
		return content
			.trim()
			.replace(/<\/?INSERT>/g, '')
			.trim();
	}
}
