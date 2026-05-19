import { SettingsMigrator } from '.';
import { mapExactProvisionStrategyToRetrievalStrategy } from '..';
import { RosyPilotSettings2_5_0 } from '../versions/2.5.0';
import { RosyPilotSettings2_6_0 } from '../versions/2.6.0';

export const migrateVersion2_5_0_toVersion2_6_0: SettingsMigrator<
	RosyPilotSettings2_5_0,
	RosyPilotSettings2_6_0
> = (settings) => {
	const backup = structuredClone(settings);

	return {
		version: '2.6.0',
		backups: {
			...settings.backups,
			'2.5.0': backup,
		},
		providers: settings.providers,
		completions: settings.completions,
		cache: settings.cache,
		debug: settings.debug,
		usage: settings.usage,
		legal: {
			...settings.legal,
			tavilyApiKey: undefined,
			defaultRetrievalStrategy:
				mapExactProvisionStrategyToRetrievalStrategy(
					settings.legal.exactProvisionStrategy,
				) ?? 'structured-first',
			commandOverrides: {
				completeLegalProvision: {
					retrievalStrategy: 'inherit',
				},
				completeLegalCase: {
					retrievalStrategy: 'inherit',
				},
			},
		},
	};
};
