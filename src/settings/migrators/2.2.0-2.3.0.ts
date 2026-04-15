import { SettingsMigrator } from '.';
import { RosyPilotSettings2_2_0 } from '../versions/2.2.0';
import { RosyPilotSettings2_3_0 } from '../versions/2.3.0';

export const migrateVersion2_2_0_toVersion2_3_0: SettingsMigrator<
	RosyPilotSettings2_2_0,
	RosyPilotSettings2_3_0
> = (settings) => {
	const backup = structuredClone(settings);

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { fewShot: _removed, ...completionsWithoutFewShot } = settings.completions;

	return {
		version: '2.3.0',
		backups: {
			...settings.backups,
			'2.2.0': backup,
		},
		providers: settings.providers,
		completions: completionsWithoutFewShot,
		cache: settings.cache,
		debug: settings.debug,
		usage: settings.usage,
	};
};
