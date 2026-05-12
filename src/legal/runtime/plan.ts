export interface LegalExecutionStep {
	executorId: string;
}

export type LegalExecutionMode = 'first-success' | 'collect-all';

export interface LegalExecutionPlan {
	mode: LegalExecutionMode;
	steps: LegalExecutionStep[];
}
