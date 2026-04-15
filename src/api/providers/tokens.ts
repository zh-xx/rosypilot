import RosyPilot from 'src/main';
import { getThisMonthAsString, getTodayAsString } from 'src/utils';

export class TokenTracker {
	constructor(private plugin: RosyPilot) {}

	async add(inputTokens: number, outputTokens: number) {
		const { settings } = this.plugin;

		const today = getTodayAsString();
		const thisMonth = getThisMonthAsString();
		if (settings.usage.dailyTokens[today] === undefined) {
			settings.usage.dailyTokens[today] = 0;
		}
		if (settings.usage.monthlyTokens[thisMonth] === undefined) {
			settings.usage.monthlyTokens[thisMonth] = 0;
		}

		const tokens = inputTokens + outputTokens;
		settings.usage.dailyTokens[today] += tokens;
		settings.usage.monthlyTokens[thisMonth] += tokens;

		await this.plugin.saveSettings();
	}
}
