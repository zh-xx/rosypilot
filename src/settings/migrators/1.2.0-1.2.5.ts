import { SettingsMigrator } from '.';
import { RosyPilotSettings1_2_0 } from '../versions/1.2.0';
import { RosyPilotSettings1_2_5 } from '../versions/1.2.5';

export const migrateVersion1_2_0_toVersion1_2_5: SettingsMigrator<
	RosyPilotSettings1_2_0,
	RosyPilotSettings1_2_5
> = (settings) => {
	const backup = structuredClone(settings);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const newSettings: RosyPilotSettings1_2_5 = settings as any;
	newSettings.version = '1.2.5';
	newSettings.backups['1.2.0'] = backup;
	newSettings.completions.modelTag = undefined;
	newSettings.chat.modelTag = undefined;
	return newSettings;
};
