import { LegalExecutionPlan } from './runtime/plan';
import { LegalResult } from './runtime/result';
import { LegalCommandRoute } from './runtime/route';

export interface LegalJudgeDebugInfo {
	request?: {
		model: string;
		max_tokens: number;
		temperature: number;
	};
	prompt?: string;
	rawResponse?: string;
	parsedRoute?: LegalCommandRoute;
	skippedReason?: string;
}

export interface LegalExecutorDebugStep {
	executorId: string;
	status: 'success' | 'empty' | 'error' | 'missing';
	resultCount: number;
	error?: string;
}

export interface LegalApplicationDebugAction {
	actionId: string;
	resultId: string;
	resultTitle: string;
	format?: string;
	status: 'success' | 'failed';
	reason?: string;
	message?: string;
	timestamp: number;
}

export interface LegalCommandDebugEntry {
	commandId: string;
	prefix: string;
	route: LegalCommandRoute;
	plan: LegalExecutionPlan;
	judge?: LegalJudgeDebugInfo;
	steps: LegalExecutorDebugStep[];
	results: LegalResult[];
	applications?: LegalApplicationDebugAction[];
	timestamp: number;
	durationMs: number;
}
