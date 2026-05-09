import { Editor, Notice, requestUrl } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { PROVIDERS_BASE_URLS } from 'src/api/providers';
import { setCompletionsEffect } from 'src/editor/state';
import { t } from 'src/i18n';
import { LegalRef } from './detector';
import { ArticleDetail, YuandianClient } from './yuandian-client';

import type RosyPilot from '../main';

const EXTRACT_SYSTEM_PROMPT =
	'从用户文本中提取最近引用的具体法条。仅返回JSON：{"fgmc":"法规名称","ftnum":"第X条"}，无具体引用时返回 null。不要解释。';

const ADAPT_SYSTEM_PROMPT =
	'你是法律写作助手。你生成的文字将直接插入在用户光标位置之后，所以不要重复光标前已有的任何文字。请直接续写光标前未完成的内容，以引号加冒号的形式（如：规定："……"）将法条最相关的原文嵌入句子中，优先引用原文，最小程度改写，风格与上文保持一致。只返回续写文字，不加任何说明。';

export class LegalSlashCommand {
	constructor(private plugin: RosyPilot) {}

	async run(prefix: string, editor: Editor): Promise<void> {
		const yuandian = this.getYuandianClient();
		if (!yuandian) {
			new Notice(t('legal.notice.noApiKey'));
			return;
		}

		const editorView = (editor as unknown as { cm: EditorView }).cm;
		const context = prefix.slice(-50);

		const view = await this.plugin.openLegalPanel();
		view.setLoading(t('legal.panel.detecting'));

		const ref = await this.detectLegalRef(context);

		if (!ref) {
			view.setError(t('legal.panel.empty'));
			return;
		}

		view.setLoading(t('legal.panel.fetching'));

		try {
			const article = await yuandian.fetchDetail(ref.fgmc, ref.ftnum);
			if (article) {
				view.setDetail(article, {
					onRaw: () => {
						this.injectGhostText(
							editorView,
							`${article.ftmc}\n${article.content}`,
						);
					},
					onAdapted: () => this.adaptAndInsert(editorView, prefix, article),
				});
			} else {
				view.setError(t('legal.panel.empty'));
			}
		} catch {
			view.setError(t('legal.panel.error'));
		}
	}

	private injectGhostText(editorView: EditorView, text: string): void {
		editorView.dispatch({
			effects: [setCompletionsEffect.of({ completions: text })],
		});
	}

	private async adaptAndInsert(
		editorView: EditorView,
		prefix: string,
		article: ArticleDetail,
	): Promise<void> {
		const { settings } = this.plugin;
		const provider = settings.completions.provider;
		const apiKey = settings.providers[provider].apiKey;
		const model = settings.completions.model;

		if (!apiKey || !model) return;

		const userMessage = `【当前文档光标前文本】\n${prefix.slice(-300)}\n\n【相关法条】\n${article.ftmc}\n${article.content}`;

		const baseURL = PROVIDERS_BASE_URLS[provider];
		const res = await requestUrl({
			url: `${baseURL}/chat/completions`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'system', content: ADAPT_SYSTEM_PROMPT },
					{ role: 'user', content: userMessage },
				],
				max_tokens: 4096,
				temperature: 0.3,
			}),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) return;

		const body = res.json as {
			choices?: { message?: { content?: string | null } }[];
		};
		const adapted = body?.choices?.[0]?.message?.content?.trim() ?? '';

		if (adapted) {
			this.injectGhostText(editorView, adapted);
		}
	}

	private async detectLegalRef(text: string): Promise<LegalRef | null> {
		const { settings } = this.plugin;
		const provider = settings.completions.provider;
		const apiKey = settings.providers[provider].apiKey;
		const model = settings.completions.model;

		if (!apiKey || !model) return null;

		const baseURL = PROVIDERS_BASE_URLS[provider];
		const res = await requestUrl({
			url: `${baseURL}/chat/completions`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'system', content: EXTRACT_SYSTEM_PROMPT },
					{ role: 'user', content: text },
				],
				max_tokens: 1024,
				temperature: 0,
			}),
			throw: false,
		});

		if (res.status !== 200 && res.status !== 201) return null;

		const body = res.json as {
			choices?: {
				message?: { content?: string | null; reasoning_content?: string };
			}[];
		};
		const msg = body?.choices?.[0]?.message;
		const content =
			(msg?.content?.trim() || msg?.reasoning_content?.trim()) ?? '';
		if (!content || content === 'null') return null;

		try {
			const ref = JSON.parse(content) as LegalRef;
			if (typeof ref?.fgmc === 'string' && typeof ref?.ftnum === 'string') {
				return ref;
			}
		} catch {
			// malformed JSON → no match
		}
		return null;
	}

	private getYuandianClient(): YuandianClient | null {
		const key = this.plugin.settings.legal?.yuandianApiKey;
		if (!key) return null;
		return new YuandianClient(key);
	}
}
