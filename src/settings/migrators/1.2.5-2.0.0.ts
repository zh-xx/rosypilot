import { SettingsMigrator } from '.';
import { RosyPilotSettings1_2_5 } from '../versions/1.2.5';
import { RosyPilotSettings2_0_0 } from '../versions/2.0.0';

export const migrateVersion1_2_5_toVersion2_0_0: SettingsMigrator<
	RosyPilotSettings1_2_5,
	RosyPilotSettings2_0_0
> = (settings) => {
	const backup = structuredClone(settings);

	return {
		version: '2.0.0',
		backups: {
			...settings.backups,
			'1.2.5': backup,
		},
		providers: {
			deepseek: {
				apiKey: undefined,
			},
			custom: {
				apiUrl: undefined,
				apiKey: undefined,
			},
		},
		completions: {
			enabled: settings.completions.enabled,
			provider: 'deepseek',
			model: 'deepseek-chat',
			fewShot: settings.completions.fewShot,
			maxTokens: settings.completions.maxTokens,
			temperature: settings.completions.temperature,
			waitTime: settings.completions.waitTime,
			windowSize: settings.completions.windowSize,
			acceptKey: settings.completions.acceptKey,
			rejectKey: settings.completions.rejectKey,
		},
		cache: settings.cache,
		debug: {
			enabled: false,
		},
		usage: {
			dailyTokens: {},
			monthlyTokens: {},
			monthlyLimit: 1_000_000,
		},
	};
};
