import { Notice } from 'obsidian';
import OpenAI from 'openai';
import { t } from 'src/i18n';
import RosyPilot from 'src/main';
import { APIClient } from '..';
import { PromptGenerator } from '../prompts/generator';
import { PROVIDERS_BASE_URLS } from '../providers';
import { TokenTracker } from '../providers/tokens';
import { requestUrlFetch } from './request-url-fetch';

export class OpenAICompatibleAPIClient implements APIClient {
	constructor(
		protected generator: PromptGenerator,
		protected tracker: TokenTracker,
		protected plugin: RosyPilot,
	) {}

	get openai(): OpenAI | undefined {
		const { settings } = this.plugin;
		const provider = settings.completions.provider;

		const apiKey = settings.providers[provider].apiKey;
		if (apiKey === undefined || apiKey === '') {
			new Notice(t('providers.deepseek.apiKey.desc'));
			return;
		}

		return new OpenAI({
			apiKey,
			baseURL: PROVIDERS_BASE_URLS[provider],
			dangerouslyAllowBrowser: true,
			fetch: requestUrlFetch,
		});
	}

	async fetchCompletions(prefix: string, suffix: string) {
		if (this.openai === undefined) {
			return;
		}

		const { settings } = this.plugin;
		try {
			const context = this.generator.getContext(prefix, suffix);
			const section =
				context === 'paragraph' || context === 'list-item'
					? this.generator.getSectionPath(prefix)
					: undefined;
			const prompt = this.generator.generateCompletionsPrompt(prefix, suffix);

			const requestParams = {
				model: settings.completions.model,
				max_tokens: settings.completions.maxTokens,
				temperature: settings.completions.temperature,
				stop: ['\n\n\n'],
			};

			const completions = await this.openai.chat.completions.create({
				messages: prompt,
				...requestParams,
			});

			const inputTokens = completions.usage?.prompt_tokens ?? 0;
			const outputTokens = completions.usage?.completion_tokens ?? 0;
			await this.tracker.add(inputTokens, outputTokens);

			const content = completions.choices[0].message.content;
			if (content === null) {
				this.plugin.debugLog({
					context,
					section,
					prompt,
					request: requestParams,
					rawResponse: 'null',
					parsedResult: 'null',
					timestamp: Date.now(),
				});
				return;
			}
			let parsed = this.generator.parseResponse(content);

			if (context === 'heading') {
				const lastPrefixLine = prefix.split('\n').pop() ?? '';
				if (/^#{1,6}$/.test(lastPrefixLine)) {
					parsed = ' ' + parsed;
				}
			}

			this.plugin.debugLog({
				context,
				section,
				prompt,
				request: requestParams,
				rawResponse: content,
				parsedResult: parsed,
				timestamp: Date.now(),
			});

			return parsed;
		} catch (error) {
			console.error(error);
			new Notice(t('notice.fetchCompletions.fail'));
		}
	}

	async testConnection() {
		if (this.openai === undefined) {
			return false;
		}

		const { settings } = this.plugin;
		const model = settings.completions.model;

		if (!model) {
			return false;
		}

		try {
			const response = await this.openai.chat.completions.create({
				messages: [
					{
						role: 'user',
						content: 'Say this is a test',
					},
				],
				model,
				max_tokens: 1,
				temperature: 0,
				top_p: 1,
				n: 1,
			});

			return response.choices[0].message.content !== '';
		} catch (error) {
			console.error(error);
			return false;
		}
	}
}
