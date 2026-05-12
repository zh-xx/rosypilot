import { LegalExecutor } from './executor';

export class LegalExecutorRegistry {
	private executors: LegalExecutor[] = [];

	register(executor: LegalExecutor): void {
		this.executors.push(executor);
	}

	all(): LegalExecutor[] {
		return this.executors;
	}

	get(id: string): LegalExecutor | undefined {
		return this.executors.find((executor) => executor.id === id);
	}
}
