import { Notice } from 'obsidian';
import { t } from 'src/i18n';
import RosyPilot from 'src/main';
import { getThisMonthAsString } from 'src/utils';
import { APIClient } from '..';

export class UsageMonitorProxy implements APIClient {
	constructor(
		private client: APIClient,
		private plugin: RosyPilot,
	) {}

	hasReachedLimit() {
		const { settings } = this.plugin;

		const thisMonth = getThisMonthAsString();
		const used = settings.usage.monthlyTokens[thisMonth] ?? 0;
		return used >= settings.usage.monthlyLimit;
	}

	async fetchCompletions(prefix: string, suffix: string) {
		if (this.hasReachedLimit()) {
			new Notice(t('usage.limitReached.completions'));
			return;
		}

		return await this.client.fetchCompletions(prefix, suffix);
	}

	testConnection() {
		return this.client.testConnection();
	}
}
