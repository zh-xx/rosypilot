import { Editor, Notice } from 'obsidian';
import { EditorView } from '@codemirror/view';
import { t } from 'src/i18n';
import { LegalApplicationResult } from './applicators/applicator';
import { InsertAdaptedApplicator } from './applicators/insert-adapted';
import { InsertRawApplicator } from './applicators/insert-raw';
import { LegalExecutorDebugStep } from './debug';
import { WebExactExecutor } from './executors/web-exact';
import { YuandianExactExecutor } from './executors/yuandian-exact';
import { LegalExecutorRegistry } from './executors/registry';
import { ProvisionRefJudge } from './judges/provision-ref-judge';
import { TavilyClient, TavilyExactProvider } from './providers/tavily-client';
import { LegalExecutionPlanner } from './runtime/planner';
import { LegalCommandRequest } from './runtime/request';
import { LegalPlanRunner } from './runtime/plan-runner';

import type RosyPilot from '../main';

export class LegalSlashCommand {
	private executors = new LegalExecutorRegistry();
	private insertRaw = new InsertRawApplicator();
	private insertAdapted = new InsertAdaptedApplicator();

	constructor(private plugin: RosyPilot) {
		this.executors.register(new YuandianExactExecutor());
		const tavilyApiKey = this.plugin.settings.legal.tavilyApiKey;
		this.executors.register(
			new WebExactExecutor(
				tavilyApiKey
					? new TavilyExactProvider(new TavilyClient(tavilyApiKey))
					: undefined,
			),
		);
	}

	async run(prefix: string, editor: Editor): Promise<void> {
		const startedAt = Date.now();
		const editorView = (editor as unknown as { cm: EditorView }).cm;
		const request: LegalCommandRequest = {
			commandId: 'complete-legal-provision',
			prefix,
			editor,
			editorView,
		};

		const view = await this.plugin.openLegalPanel();
		view.setLoading(t('legal.panel.detecting'));

		const judge = new ProvisionRefJudge(this.plugin);
		const route = await judge.judge(prefix);
		if (route.kind === 'none') {
			view.setError(t('legal.panel.empty'));
			this.plugin.legalDebugLog({
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

		view.setLoading(t('legal.panel.fetching'));

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
			this.plugin.legalDebugLog({
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
				view.setError(t('legal.panel.empty'));
				return;
			}

			view.setDetails(
				results,
				(result) => {
					const application = this.insertRaw.apply(
						request,
						result,
						this.plugin,
					);
					this.notifyApplicationResult(application, 'raw');
				},
				async (result) => {
					try {
						const application = await this.insertAdapted.apply(
							request,
							result,
							this.plugin,
						);
						this.notifyApplicationResult(application, 'adapted');
					} catch (error) {
						this.notifyApplicationResult(
							{
								status: 'failed',
								reason: 'error',
								message: error instanceof Error ? error.message : String(error),
							},
							'adapted',
						);
					}
				},
			);
		} catch (error) {
			this.plugin.legalDebugLog({
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

	private notifyApplicationResult(
		result: LegalApplicationResult,
		mode: 'raw' | 'adapted',
	): void {
		if (result.status === 'success') {
			new Notice(
				mode === 'raw'
					? t('legal.notice.insertRaw.success')
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
}
