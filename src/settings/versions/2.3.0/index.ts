// Check the settings type in this version matches the current settings type.

import { RosyPilotSettings } from 'src/settings';
import { Equal, Expect } from 'src/settings/utils';
import { Provider } from '../../../api/providers';

export interface RosyPilotSettings2_3_0 {
	version: string;
	backups: Record<string, object>;
	providers: Record<
		Provider,
		{
			apiKey: string | undefined;
			fetchedModels: string[];
		}
	>;
	completions: {
		enabled: boolean;
		provider: Provider;
		model: string;
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- compile-time assertion type is intentionally unused at runtime
type AssertEqualCurrentSettings = Expect<
	Equal<RosyPilotSettings2_3_0, RosyPilotSettings>
>;
