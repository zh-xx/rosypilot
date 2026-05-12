import { LegalExecutor } from '../executors/executor';
import { LegalExecutorRegistry } from '../executors/registry';
import { LegalExecutionPlan } from './plan';
import { LegalPlanRunner } from './plan-runner';
import { LegalCommandRequest } from './request';
import { LegalResult } from './result';
import { LegalCommandRoute } from './route';

import type RosyPilot from 'src/main';

const request = {
	commandId: 'complete-legal-provision',
	prefix: '',
	editor: {},
	editorView: {},
} as LegalCommandRequest;

const route: LegalCommandRoute = {
	kind: 'exact-provision',
	ref: {
		fgmc: '中华人民共和国民法典',
		ftnum: '第五百一十一条',
	},
};

const plugin = {} as RosyPilot;

function createResult(id: string, provider: string): LegalResult {
	return {
		id,
		type: 'statute',
		title: id,
		content: id,
		source: {
			provider,
		},
		metadata: {},
		raw: {},
	};
}

function createExecutor(
	id: string,
	resultsOrError: LegalResult[] | Error,
): LegalExecutor {
	return {
		id,
		label: id,
		canRun: () => true,
		run: jest.fn().mockImplementation(async () => {
			if (resultsOrError instanceof Error) {
				throw resultsOrError;
			}
			return resultsOrError;
		}),
	};
}

function createRunner(executors: LegalExecutor[]): LegalPlanRunner {
	const registry = new LegalExecutorRegistry();
	for (const executor of executors) {
		registry.register(executor);
	}
	return new LegalPlanRunner(registry, plugin);
}

describe('LegalPlanRunner', () => {
	let consoleError: jest.SpyInstance;

	beforeEach(() => {
		consoleError = jest.spyOn(console, 'error').mockImplementation();
	});

	afterEach(() => {
		consoleError.mockRestore();
	});

	it('returns the first non-empty result in first-success mode', async () => {
		const first = createExecutor('yuandian.exact', [
			createResult('yuandian-result', 'yuandian'),
		]);
		const second = createExecutor('web.exact', [
			createResult('web-result', 'tavily'),
		]);
		const plan: LegalExecutionPlan = {
			mode: 'first-success',
			steps: [{ executorId: 'yuandian.exact' }, { executorId: 'web.exact' }],
		};

		const results = await createRunner([first, second]).run(
			request,
			route,
			plan,
		);

		expect(results).toEqual([createResult('yuandian-result', 'yuandian')]);
		expect(first.run).toHaveBeenCalledTimes(1);
		expect(second.run).not.toHaveBeenCalled();
	});

	it('falls back to the next executor when first-success gets empty results', async () => {
		const first = createExecutor('yuandian.exact', []);
		const second = createExecutor('web.exact', [
			createResult('web-result', 'tavily'),
		]);
		const plan: LegalExecutionPlan = {
			mode: 'first-success',
			steps: [{ executorId: 'yuandian.exact' }, { executorId: 'web.exact' }],
		};

		const results = await createRunner([first, second]).run(
			request,
			route,
			plan,
		);

		expect(results).toEqual([createResult('web-result', 'tavily')]);
		expect(first.run).toHaveBeenCalledTimes(1);
		expect(second.run).toHaveBeenCalledTimes(1);
	});

	it('falls back to the next executor when first-success executor throws', async () => {
		const first = createExecutor('yuandian.exact', new Error('boom'));
		const second = createExecutor('web.exact', [
			createResult('web-result', 'tavily'),
		]);
		const plan: LegalExecutionPlan = {
			mode: 'first-success',
			steps: [{ executorId: 'yuandian.exact' }, { executorId: 'web.exact' }],
		};

		const results = await createRunner([first, second]).run(
			request,
			route,
			plan,
		);

		expect(results).toEqual([createResult('web-result', 'tavily')]);
		expect(consoleError).toHaveBeenCalledWith(
			'Legal command executor failed',
			expect.objectContaining({ executorId: 'yuandian.exact' }),
		);
	});

	it('collects all non-empty results in collect-all mode', async () => {
		const first = createExecutor('yuandian.exact', [
			createResult('yuandian-result', 'yuandian'),
		]);
		const second = createExecutor('web.exact', [
			createResult('web-result', 'tavily'),
		]);
		const plan: LegalExecutionPlan = {
			mode: 'collect-all',
			steps: [{ executorId: 'yuandian.exact' }, { executorId: 'web.exact' }],
		};

		const results = await createRunner([first, second]).run(
			request,
			route,
			plan,
		);

		expect(results).toEqual([
			createResult('yuandian-result', 'yuandian'),
			createResult('web-result', 'tavily'),
		]);
	});

	it('continues collect-all mode when one executor throws', async () => {
		const first = createExecutor('yuandian.exact', new Error('boom'));
		const second = createExecutor('web.exact', [
			createResult('web-result', 'tavily'),
		]);
		const plan: LegalExecutionPlan = {
			mode: 'collect-all',
			steps: [{ executorId: 'yuandian.exact' }, { executorId: 'web.exact' }],
		};

		const results = await createRunner([first, second]).run(
			request,
			route,
			plan,
		);

		expect(results).toEqual([createResult('web-result', 'tavily')]);
		expect(consoleError).toHaveBeenCalledWith(
			'Legal command executor failed',
			expect.objectContaining({ executorId: 'yuandian.exact' }),
		);
	});
});
