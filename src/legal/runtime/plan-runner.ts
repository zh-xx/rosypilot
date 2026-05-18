import RosyPilot from 'src/main';
import { LegalExecutorDebugStep } from '../debug';
import { LegalExecutorRegistry } from '../executors/registry';
import { LegalExecutionPlan } from './plan';
import { LegalCommandRequest } from './request';
import { LegalResult } from './result';
import { LegalCommandRoute } from './route';

export interface LegalPlanRunnerOptions {
	onStep?: (step: LegalExecutorDebugStep) => void;
}

export class LegalPlanRunner {
	constructor(
		private registry: LegalExecutorRegistry,
		private plugin: RosyPilot,
	) {}

	async run(
		request: LegalCommandRequest,
		route: LegalCommandRoute,
		plan: LegalExecutionPlan,
		options: LegalPlanRunnerOptions = {},
	): Promise<LegalResult[]> {
		const results: LegalResult[] = [];

		for (const step of plan.steps) {
			const executor = this.registry.get(step.executorId);
			if (!executor) {
				options.onStep?.({
					executorId: step.executorId,
					status: 'missing',
					resultCount: 0,
				});
				continue;
			}

			let stepResults: LegalResult[];
			try {
				const rawResults: unknown = await executor.run(
					request,
					route,
					this.plugin,
				);
				stepResults = assertLegalResults(rawResults);
			} catch (error) {
				console.error('Legal command executor failed', {
					executorId: step.executorId,
					error: error instanceof Error ? error.message : String(error),
				});
				options.onStep?.({
					executorId: step.executorId,
					status: 'error',
					resultCount: 0,
					error: error instanceof Error ? error.message : String(error),
				});
				continue;
			}

			if (stepResults.length === 0) {
				options.onStep?.({
					executorId: step.executorId,
					status: 'empty',
					resultCount: 0,
				});
				continue;
			}

			options.onStep?.({
				executorId: step.executorId,
				status: 'success',
				resultCount: stepResults.length,
			});

			if (plan.mode === 'first-success') {
				return stepResults;
			}
			results.push(...stepResults);
		}

		return results;
	}
}

function assertLegalResults(value: unknown): LegalResult[] {
	if (!Array.isArray(value) || !value.every(isLegalResult)) {
		throw new Error('Executor returned invalid legal results');
	}
	return value;
}

function isLegalResult(value: unknown): value is LegalResult {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const candidate = value as Partial<LegalResult>;
	return (
		typeof candidate.id === 'string' &&
		typeof candidate.type === 'string' &&
		typeof candidate.title === 'string' &&
		typeof candidate.content === 'string' &&
		typeof candidate.source === 'object' &&
		candidate.source !== null &&
		typeof candidate.metadata === 'object' &&
		candidate.metadata !== null
	);
}
