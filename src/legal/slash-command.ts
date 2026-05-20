import { Editor, Notice } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { t } from 'src/i18n';
import { LegalApplicationResult } from './applicators/applicator';
import { InsertAdaptedApplicator } from './applicators/insert-adapted';
import { InsertRawApplicator, RawInsertFormat } from './applicators/insert-raw';
import {
	LegalApplicationDebugAction,
	LegalCommandDebugEntry,
	LegalExecutorDebugStep,
} from './debug';
import { WebCaseExactExecutor } from './executors/web-case-exact';
import { WebCaseFuzzyExecutor } from './executors/web-case-fuzzy';
import { WebExactExecutor } from './executors/web-exact';
import { WebFuzzyExecutor } from './executors/web-fuzzy';
import { YuandianCaseExactExecutor } from './executors/yuandian-case-exact';
import { YuandianCaseKeywordExecutor } from './executors/yuandian-case-keyword';
import { YuandianExactExecutor } from './executors/yuandian-exact';
import { YuandianSemanticExecutor } from './executors/yuandian-semantic';
import { LegalExecutorRegistry } from './executors/registry';
import { CaseRefJudge } from './judges/case-ref-judge';
import { ProvisionRefJudge } from './judges/provision-ref-judge';
import {
	TavilyClient,
	TavilyExactCaseProvider,
	TavilyExactProvider,
	TavilyFuzzyCaseProvider,
	TavilyFuzzyProvider,
} from './providers/tavily-client';
import { LegalExecutionPlanner } from './runtime/planner';
import { LegalCommandRequest } from './runtime/request';
import { LegalCommandRoute } from './runtime/route';
import { LegalPlanRunner } from './runtime/plan-runner';

import type RosyPilot from '../main';

export class LegalSlashCommand {
	private executors = new LegalExecutorRegistry();
	private insertRaw = new InsertRawApplicator();
	private insertAdapted = new InsertAdaptedApplicator();
	private currentDebugEntry?: LegalCommandDebugEntry;

	constructor(
		private plugin: RosyPilot,
		private commandId:
			| 'complete-legal-provision'
			| 'complete-legal-case' = 'complete-legal-provision',
	) {
		this.executors.register(new YuandianExactExecutor());
		this.executors.register(new YuandianSemanticExecutor());
		this.executors.register(new YuandianCaseExactExecutor());
		this.executors.register(new YuandianCaseKeywordExecutor());
		const tavilyApiKey = this.plugin.settings.legal.tavilyApiKey;
		const tavilyClient = tavilyApiKey
			? new TavilyClient(tavilyApiKey)
			: undefined;
		this.executors.register(
			new WebExactExecutor(
				tavilyClient ? new TavilyExactProvider(tavilyClient) : undefined,
			),
		);
		this.executors.register(
			new WebFuzzyExecutor(
				tavilyClient ? new TavilyFuzzyProvider(tavilyClient) : undefined,
			),
		);
		this.executors.register(
			new WebCaseExactExecutor(
				tavilyClient ? new TavilyExactCaseProvider(tavilyClient) : undefined,
			),
		);
		this.executors.register(
			new WebCaseFuzzyExecutor(
				tavilyClient ? new TavilyFuzzyCaseProvider(tavilyClient) : undefined,
			),
		);
	}

	async run(prefix: string, editor: Editor): Promise<void> {
		const startedAt = Date.now();
		const editorView = (editor as unknown as { cm: EditorView }).cm;
		const request: LegalCommandRequest = {
			commandId: this.commandId,
			prefix,
			editor,
			editorView,
		};

		const view = await this.plugin.openLegalPanel();
		view.setLoading(t('legal.panel.detecting'));

		const judge =
			this.commandId === 'complete-legal-case'
				? new CaseRefJudge(this.plugin)
				: new ProvisionRefJudge(this.plugin);
		const route = await judge.judge(prefix);
		if (route.kind === 'none') {
			view.setError(this.getEmptyMessage());
			this.logLegalDebug({
				commandId: request.commandId,
				prefix,
				route,
				plan: { mode: 'first-success', steps: [] },
				judge: judge.getDebugInfo(),
				steps: [],
				results: [],
				timestamp: startedAt,
				durationMs: Date.now() - startedAt,
			});
			return;
		}

		view.setLoading(
			this.commandId === 'complete-legal-case'
				? t('legal.panel.fetchingCase')
				: t('legal.panel.fetching'),
		);

		const plan = new LegalExecutionPlanner(this.executors, this.plugin).plan(
			request,
			route,
		);

		try {
			const debugSteps: LegalExecutorDebugStep[] = [];
			const results = await new LegalPlanRunner(
				this.executors,
				this.plugin,
			).run(request, route, plan, {
				onStep: (step) => debugSteps.push(step),
			});
			this.logLegalDebug({
				commandId: request.commandId,
				prefix,
				route,
				plan,
				judge: judge.getDebugInfo(),
				steps: debugSteps,
				results,
				timestamp: startedAt,
				durationMs: Date.now() - startedAt,
			});
			if (results.length === 0) {
				view.setError(this.getEmptyMessage());
				return;
			}

			view.setDetails(
				results,
				(result, format: RawInsertFormat) => {
					const application = this.insertRaw.apply(
						request,
						result,
						this.plugin,
						format,
					);
					this.logApplicationAction({
						actionId: 'insert.raw',
						resultId: result.id,
						resultTitle: result.title,
						format,
						...toApplicationDebugStatus(application),
					});
					this.notifyApplicationResult(application, 'raw');
				},
				async (result) => {
					try {
						const application = await this.insertAdapted.apply(
							request,
							result,
							this.plugin,
						);
						this.logApplicationAction({
							actionId: 'insert.adapted',
							resultId: result.id,
							resultTitle: result.title,
							...toApplicationDebugStatus(application),
						});
						this.notifyApplicationResult(application, 'adapted');
					} catch (error) {
						const application: LegalApplicationResult = {
							status: 'failed',
							reason: 'error',
							message: error instanceof Error ? error.message : String(error),
						};
						this.logApplicationAction({
							actionId: 'insert.adapted',
							resultId: result.id,
							resultTitle: result.title,
							...toApplicationDebugStatus(application),
						});
						this.notifyApplicationResult(application, 'adapted');
					}
				},
				this.getResultLabel(route),
			);
		} catch (error) {
			this.logLegalDebug({
				commandId: request.commandId,
				prefix,
				route,
				plan,
				judge: judge.getDebugInfo(),
				steps: [
					{
						executorId: 'legal-command',
						status: 'error',
						resultCount: 0,
						error: error instanceof Error ? error.message : String(error),
					},
				],
				results: [],
				timestamp: startedAt,
				durationMs: Date.now() - startedAt,
			});
			view.setError(t('legal.panel.error'));
		}
	}

	private logLegalDebug(entry: LegalCommandDebugEntry): void {
		this.currentDebugEntry = entry;
		this.plugin.legalDebugLog(entry);
	}

	private logApplicationAction(
		action: Omit<LegalApplicationDebugAction, 'timestamp'>,
	): void {
		if (!this.currentDebugEntry) return;
		this.currentDebugEntry = {
			...this.currentDebugEntry,
			applications: [
				...(this.currentDebugEntry.applications ?? []),
				{
					...action,
					timestamp: Date.now(),
				},
			],
		};
		this.plugin.legalDebugLog(this.currentDebugEntry);
	}

	private notifyApplicationResult(
		result: LegalApplicationResult,
		mode: 'raw' | 'adapted',
	): void {
		if (result.status === 'success') {
			new Notice(
				mode === 'raw'
					? this.commandId === 'complete-legal-case'
						? t('legal.notice.insertCaseRaw.success')
						: t('legal.notice.insertRaw.success')
					: t('legal.notice.insertAdapted.success'),
			);
			return;
		}

		if (result.reason === 'missing-llm-config') {
			new Notice(t('legal.notice.insertAdapted.missingLlmConfig'));
			return;
		}

		if (result.reason === 'empty-result') {
			new Notice(t('legal.notice.insertAdapted.empty'));
			return;
		}

		const reason = result.message ? ` ${result.message}` : '';
		new Notice(`${t('legal.notice.insert.failed')}${reason}`);
	}

	private getEmptyMessage(): string {
		return this.commandId === 'complete-legal-case'
			? t('legal.panel.caseEmpty')
			: t('legal.panel.empty');
	}

	private getResultLabel(route: LegalCommandRoute): string {
		if (route.kind === 'fuzzy-provision') {
			return t('legal.panel.search.label');
		}
		if (route.kind === 'fuzzy-case') {
			return t('legal.panel.caseSearch.label');
		}
		return t('legal.panel.detail.label');
	}
}

function toApplicationDebugStatus(
	result: LegalApplicationResult,
): Pick<LegalApplicationDebugAction, 'status' | 'reason' | 'message'> {
	if (result.status === 'success') {
		return { status: 'success' };
	}
	return {
		status: 'failed',
		reason: result.reason,
		message: result.message,
	};
}
