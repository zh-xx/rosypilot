import { Editor, Notice, requestUrl } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { PROVIDERS_BASE_URLS } from 'src/api/providers';
import { t } from 'src/i18n';
import {
	HallucinationCase,
	HallucinationRegulation,
	YuandianClient,
} from './yuandian-client';
import {
	clearHallucinationHighlight,
	setHallucinationHighlight,
} from './editor-highlight';
import { LegalCommandRoute } from './runtime/route';

import type RosyPilot from '../main';

const HALLUCINATION_ANALYZE_SYSTEM_PROMPT =
	'你是法律文书校验助手。根据法律引用的自动核查结果，给出精炼的中文评述：①判断幻觉类型（法规不存在／条文号不存在／内容错误／理解偏差／时效问题／内容吻合）；②说明具体错误所在及严重程度；③如有比对要点，结合要点指出偏差细节。仅输出评述，3-5句，不加标题或格式符号。';

function formatRegulationAnalysisMessage(reg: HallucinationRegulation): string {
	const parts: string[] = [`法规：${reg.name}${reg.clause ?? ''}`];
	if (reg.law_exists === false) parts.push('（该法规在数据库中不存在）');
	if (reg.think_tank_clause_missing)
		parts.push('（该条文编号在数据库中不存在）');
	const sc = reg.semantic_compare;
	if (sc && !sc.skipped) {
		parts.push(
			`语义比较结论：${sc.结论}（相似度：${sc.语义相似度 ?? '未知'}）`,
		);
		if (sc.说明) parts.push(`比对说明：${sc.说明}`);
		if (sc.要点?.length)
			parts.push(`比对要点：\n${sc.要点.map((p) => `- ${p}`).join('\n')}`);
	}
	if (reg.think_tank_content)
		parts.push(`权威条文：${reg.think_tank_content.slice(0, 400)}`);
	return parts.join('\n');
}

function formatCaseAnalysisMessage(c: HallucinationCase): string {
	const parts: string[] = [
		`案例：${[c.case_number, c.name].filter(Boolean).join(' ')}`,
	];
	const found = Boolean(c.url || c.think_tank_content);
	parts.push(found ? '数据库已命中' : '数据库未命中，案号可能不存在或系捏造');
	if (c.think_tank_content)
		parts.push(`数据库内容摘要：${c.think_tank_content.slice(0, 400)}`);
	return parts.join('\n');
}

export class HallucinationSlashCommand {
	constructor(private plugin: RosyPilot) {}

	async run(prefix: string, editor: Editor): Promise<void> {
		const startedAt = Date.now();
		const { yuandianApiKey } = this.plugin.settings.legal;
		const view = await this.plugin.openLegalPanel();

		if (!yuandianApiKey) {
			view.setError(t('legal.panel.hallucination.noApiKey'));
			return;
		}

		const text = editor.getSelection() || editor.getValue();
		view.setLoading(t('legal.panel.hallucination.detecting'));

		const route: LegalCommandRoute = { kind: 'hallucination-detect' };
		try {
			const response = await new YuandianClient(
				yuandianApiKey,
			).detectHallucination(text);

			this.plugin.legalDebugLog({
				commandId: 'hallucination-detect',
				prefix,
				route,
				plan: { mode: 'first-success', steps: [] },
				steps: [
					{
						executorId: 'chineselaw.hall_detect',
						status: 'success',
						resultCount: response.regulations.length + response.cases.length,
					},
				],
				results: [],
				timestamp: startedAt,
				durationMs: Date.now() - startedAt,
			});

			if (response.regulations.length === 0 && response.cases.length === 0) {
				view.setError(t('legal.panel.hallucination.empty'));
				return;
			}

			const cm = (editor as unknown as { cm?: EditorView }).cm;

			const onLocate = (searchText: string) => {
				if (!searchText) return;
				const content = editor.getValue();
				const idx = content.indexOf(searchText);
				if (idx < 0) {
					new Notice(t('legal.panel.hallucination.locate.notFound'));
					return;
				}
				const from = editor.offsetToPos(idx);
				const to = editor.offsetToPos(idx + searchText.length);
				editor.setSelection(from, to);
				editor.scrollIntoView({ from, to }, true);
				cm?.dispatch({
					effects: setHallucinationHighlight.of([
						{ from: idx, to: idx + searchText.length },
					]),
				});
			};

			// Clear any previous highlights from prior runs
			cm?.dispatch({ effects: clearHallucinationHighlight.of(undefined) });

			const onAnalyze = async (
				item: HallucinationRegulation | HallucinationCase,
				kind: 'regulation' | 'case',
			): Promise<string> => {
				const { settings } = this.plugin;
				const provider = settings.completions.provider;
				const apiKey = settings.providers[provider].apiKey;
				const model = settings.completions.model;
				if (!apiKey || !model) {
					throw new Error(t('legal.panel.hallucination.analyze.noLlm'));
				}
				const userMessage =
					kind === 'regulation'
						? formatRegulationAnalysisMessage(item as HallucinationRegulation)
						: formatCaseAnalysisMessage(item as HallucinationCase);
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
							{
								role: 'system',
								content: HALLUCINATION_ANALYZE_SYSTEM_PROMPT,
							},
							{ role: 'user', content: userMessage },
						],
						max_tokens: 512,
						temperature: 0.2,
					}),
					throw: false,
				});
				if (res.status !== 200 && res.status !== 201) {
					throw new Error(`HTTP ${res.status}`);
				}
				const body = res.json as {
					choices?: { message?: { content?: string | null } }[];
				};
				const text = body?.choices?.[0]?.message?.content?.trim() ?? '';
				if (!text) throw new Error('empty response');
				return text;
			};

			view.setHallucinationReport(response, { onLocate, onAnalyze });
		} catch (error) {
			this.plugin.legalDebugLog({
				commandId: 'hallucination-detect',
				prefix,
				route,
				plan: { mode: 'first-success', steps: [] },
				steps: [
					{
						executorId: 'chineselaw.hall_detect',
						status: 'error',
						resultCount: 0,
						error: error instanceof Error ? error.message : String(error),
					},
				],
				results: [],
				timestamp: startedAt,
				durationMs: Date.now() - startedAt,
			});
			const msg = error instanceof Error ? error.message : String(error);
			view.setError(`${t('legal.panel.error')}：${msg}`);
		}
	}
}
