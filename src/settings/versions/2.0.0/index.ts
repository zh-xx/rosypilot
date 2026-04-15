import { Provider } from '../../../api/providers';

export interface RosyPilotSettings2_0_0 {
	version: string;
	backups: Record<string, object>;
	providers: {
		deepseek: {
			apiKey: string | undefined;
		};
		custom: {
			apiUrl: string | undefined;
			apiKey: string | undefined;
		};
	};
	completions: {
		enabled: boolean;
		provider: Provider;
		model: string;
		fewShot: boolean;
		maxTokens: number;
		temperature: number;
		waitTime: number;
		windowSize: number;
		acceptKey: string;
		rejectKey: string;
	};
	cache: {
		enabled: boolean;
	};
	debug: {
		enabled: boolean;
	};
	usage: {
		dailyTokens: Record<string, number>;
		monthlyTokens: Record<string, number>;
		monthlyLimit: number;
	};
}

