import { SettingsMigrator } from '.';
import { RosyPilotSettings2_0_0 } from '../versions/2.0.0';
import { RosyPilotSettings2_1_0 } from '../versions/2.1.0';

export const migrateVersion2_0_0_toVersion2_1_0: SettingsMigrator<
	RosyPilotSettings2_0_0,
	RosyPilotSettings2_1_0
> = (settings) => {
	const backup = structuredClone(settings);

	return {
		version: '2.1.0',
		backups: {
			...settings.backups,
			'2.0.0': backup,
		},
		providers: {
			deepseek: {
				apiKey: settings.providers.deepseek.apiKey,
				fetchedModels: [],
			},
		},
		completions: {
			enabled: settings.completions.enabled,
			provider: 'deepseek',
			model: '',
			fewShot: settings.completions.fewShot,
			maxTokens: settings.completions.maxTokens,
			temperature: settings.completions.temperature,
			waitTime: settings.completions.waitTime,
			windowSize: settings.completions.windowSize,
			acceptKey: settings.completions.acceptKey,
			rejectKey: settings.completions.rejectKey,
		},
		cache: settings.cache,
		debug: settings.debug,
		usage: settings.usage,
	};
};
