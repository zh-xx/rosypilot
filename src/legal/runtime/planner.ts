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
		if (route.kind === 'none') {
			return this.registry.all().map((executor) => executor.id);
		}

		const strategy = this.getRetrievalStrategy(commandId);
		if (route.kind === 'exact-case') {
			if (strategy === 'web-first') {
				return ['web.case.exact'];
			}
			if (strategy === 'auto') {
				return ['yuandian.case.exact', 'web.case.exact'];
			}
			if (strategy === 'all') {
				return ['yuandian.case.exact', 'web.case.exact'];
			}
			return ['yuandian.case.exact'];
		}

		if (route.kind === 'fuzzy-case') {
			if (strategy === 'web-first') {
				return ['web.case.fuzzy'];
			}
			if (strategy === 'auto') {
				return ['yuandian.case.keyword', 'web.case.fuzzy'];
			}
			if (strategy === 'all') {
				return ['yuandian.case.keyword', 'web.case.fuzzy'];
			}
			return ['yuandian.case.keyword'];
		}

		if (route.kind === 'fuzzy-provision') {
			if (strategy === 'web-first') {
				return ['web.fuzzy'];
			}
			if (strategy === 'auto') {
				return ['yuandian.semantic', 'web.fuzzy'];
			}
			if (strategy === 'all') {
				return ['yuandian.semantic', 'web.fuzzy'];
			}
			return ['yuandian.semantic'];
		}

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
		const override = getCommandOverride(commandId, legal.commandOverrides);

		return resolveLegalRetrievalStrategy(
			legal.defaultRetrievalStrategy,
			override,
			legal.exactProvisionStrategy,
			'structured-first',
		);
	}
}

function getCommandOverride(
	commandId: string,
	overrides: RosyPilot['settings']['legal']['commandOverrides'] | undefined,
) {
	if (commandId === 'complete-legal-provision') {
		return overrides?.completeLegalProvision?.retrievalStrategy;
	}
	if (commandId === 'complete-legal-case') {
		return overrides?.completeLegalCase?.retrievalStrategy;
	}
	return undefined;
}
