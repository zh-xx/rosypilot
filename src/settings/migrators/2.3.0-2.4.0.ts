import { SettingsMigrator } from '.';
import { RosyPilotSettings2_3_0 } from '../versions/2.3.0';
import { RosyPilotSettings2_4_0 } from '../versions/2.4.0';

export const migrateVersion2_3_0_toVersion2_4_0: SettingsMigrator<
	RosyPilotSettings2_3_0,
	RosyPilotSettings2_4_0
> = (settings) => {
	const backup = structuredClone(settings);

	return {
		version: '2.4.0',
		backups: {
			...settings.backups,
			'2.3.0': backup,
		},
		providers: settings.providers,
		completions: settings.completions,
		cache: settings.cache,
		debug: settings.debug,
		usage: settings.usage,
		legal: {
			yuandianApiKey: undefined,
		},
	};
};
