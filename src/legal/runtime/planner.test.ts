import { LegalExecutor } from '../executors/executor';
import { LegalExecutorRegistry } from '../executors/registry';
import { LegalExecutionPlanner } from './planner';
import { LegalCommandRequest } from './request';
import { LegalCommandRoute } from './route';

import type RosyPilot from 'src/main';

const exactRoute: LegalCommandRoute = {
	kind: 'exact-provision',
	ref: {
		fgmc: '中华人民共和国民法典',
		ftnum: '第五百一十一条',
	},
};

const request = {
	commandId: 'complete-legal-provision',
	prefix: '',
	editor: {},
	editorView: {},
} as LegalCommandRequest;

function createExecutor(id: string, available = true): LegalExecutor {
	return {
		id,
		label: id,
		canRun: () => available,
		run: jest.fn(),
	};
}

function createPlanner(
	strategy: 'yuandian' | 'web' | 'auto' | 'all',
	executors: LegalExecutor[],
): LegalExecutionPlanner {
	const registry = new LegalExecutorRegistry();
	for (const executor of executors) {
		registry.register(executor);
	}

	return new LegalExecutionPlanner(registry, {
		settings: {
			legal: {
				exactProvisionStrategy: strategy,
			},
		},
	} as RosyPilot);
}

describe('LegalExecutionPlanner', () => {
	it('plans yuandian exact strategy', () => {
		const planner = createPlanner('yuandian', [
			createExecutor('yuandian.exact'),
			createExecutor('web.exact'),
		]);

		const plan = planner.plan(request, exactRoute);

		expect(plan).toEqual({
			mode: 'first-success',
			steps: [{ executorId: 'yuandian.exact' }],
		});
	});

	it('plans web exact strategy', () => {
		const planner = createPlanner('web', [
			createExecutor('yuandian.exact'),
			createExecutor('web.exact'),
		]);

		const plan = planner.plan(request, exactRoute);

		expect(plan).toEqual({
			mode: 'first-success',
			steps: [{ executorId: 'web.exact' }],
		});
	});

	it('plans auto strategy as first-success fallback', () => {
		const planner = createPlanner('auto', [
			createExecutor('yuandian.exact'),
			createExecutor('web.exact'),
		]);

		const plan = planner.plan(request, exactRoute);

		expect(plan).toEqual({
			mode: 'first-success',
			steps: [{ executorId: 'yuandian.exact' }, { executorId: 'web.exact' }],
		});
	});

	it('plans all strategy as collect-all', () => {
		const planner = createPlanner('all', [
			createExecutor('yuandian.exact'),
			createExecutor('web.exact'),
		]);

		const plan = planner.plan(request, exactRoute);

		expect(plan).toEqual({
			mode: 'collect-all',
			steps: [{ executorId: 'yuandian.exact' }, { executorId: 'web.exact' }],
		});
	});

	it('filters unavailable executors', () => {
		const planner = createPlanner('auto', [
			createExecutor('yuandian.exact', false),
			createExecutor('web.exact'),
		]);

		const plan = planner.plan(request, exactRoute);

		expect(plan).toEqual({
			mode: 'first-success',
			steps: [{ executorId: 'web.exact' }],
		});
	});
});
