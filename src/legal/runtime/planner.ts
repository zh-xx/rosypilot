import RosyPilot from 'src/main';
import { LegalExecutorRegistry } from '../executors/registry';
import { LegalCommandRequest } from './request';
import { LegalCommandRoute } from './route';
import { LegalExecutionPlan } from './plan';

export class LegalExecutionPlanner {
	constructor(
		private registry: LegalExecutorRegistry,
		private plugin: RosyPilot,
	) {}

	plan(
		request: LegalCommandRequest,
		route: LegalCommandRoute,
	): LegalExecutionPlan {
		if (route.kind === 'none') {
			return { mode: 'first-success', steps: [] };
		}

		const mode =
			route.kind === 'exact-provision' &&
			this.plugin.settings.legal.exactProvisionStrategy === 'all'
				? 'collect-all'
				: 'first-success';
		const preferredExecutorIds = this.getPreferredExecutorIds(route);
		const availableExecutorIds = this.registry
			.all()
			.filter((executor) => executor.canRun(request, route, this.plugin))
			.map((executor) => executor.id);
		const steps = preferredExecutorIds
			.filter((id) => availableExecutorIds.includes(id))
			.map((executorId) => ({ executorId }));

		return { mode, steps };
	}

	private getPreferredExecutorIds(route: LegalCommandRoute): string[] {
		if (route.kind !== 'exact-provision') {
			return this.registry.all().map((executor) => executor.id);
		}

		const strategy = this.plugin.settings.legal.exactProvisionStrategy;
		if (strategy === 'web') {
			return ['web.exact'];
		}
		if (strategy === 'auto') {
			return ['yuandian.exact', 'web.exact'];
		}
		if (strategy === 'all') {
			return ['yuandian.exact', 'web.exact'];
		}
		return ['yuandian.exact'];
	}
}
