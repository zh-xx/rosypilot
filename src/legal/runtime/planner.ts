import RosyPilot from 'src/main';
import { LegalExecutorRegistry } from '../executors/registry';
import { LegalCommandRequest } from './request';
import { LegalCommandRoute } from './route';
import { LegalExecutionPlan } from './plan';
import { resolveLegalRetrievalStrategy } from './retrieval-strategy';

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
			this.getRetrievalStrategy(request.commandId) === 'all'
				? 'collect-all'
				: 'first-success';
		const preferredExecutorIds = this.getPreferredExecutorIds(
			request.commandId,
			route,
		);
		const availableExecutorIds = this.registry
			.all()
			.filter((executor) => executor.canRun(request, route, this.plugin))
			.map((executor) => executor.id);
		const steps = preferredExecutorIds
			.filter((id) => availableExecutorIds.includes(id))
			.map((executorId) => ({ executorId }));

		return { mode, steps };
	}

	private getPreferredExecutorIds(
		commandId: string,
		route: LegalCommandRoute,
	): string[] {
		if (route.kind !== 'exact-provision') {
			return this.registry.all().map((executor) => executor.id);
		}

		const strategy = this.getRetrievalStrategy(commandId);
		if (strategy === 'web-first') {
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

	private getRetrievalStrategy(commandId: string) {
		const { legal } = this.plugin.settings;
		const override =
			commandId === 'complete-legal-provision'
				? legal.commandOverrides?.completeLegalProvision?.retrievalStrategy
				: undefined;

		return resolveLegalRetrievalStrategy(
			legal.defaultRetrievalStrategy,
			override,
			legal.exactProvisionStrategy,
			'structured-first',
		);
	}
}
