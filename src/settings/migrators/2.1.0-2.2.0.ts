import { SettingsMigrator } from '.';
import { RosyPilotSettings2_1_0 } from '../versions/2.1.0';
import { RosyPilotSettings2_2_0 } from '../versions/2.2.0';

export const migrateVersion2_1_0_toVersion2_2_0: SettingsMigrator<
	RosyPilotSettings2_1_0,
	RosyPilotSettings2_2_0
> = (settings) => {
	const backup = structuredClone(settings);

	return {
		version: '2.2.0',
		backups: {
			...settings.backups,
			'2.1.0': backup,
		},
		providers: {
			deepseek: {
				apiKey: settings.providers.deepseek.apiKey,
				fetchedModels: settings.providers.deepseek.fetchedModels,
			},
			volcengine: {
				apiKey: undefined,
				fetchedModels: [],
			},
		},
		completions: {
			enabled: settings.completions.enabled,
			provider: settings.completions.provider,
			model: settings.completions.model,
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
