import Chart from 'chart.js/auto';
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import OpenAI from 'openai';
import {
	DEFAULT_PROVIDER,
	Provider,
	PROVIDERS,
	PROVIDERS_BASE_URLS,
	PROVIDERS_NAMES,
	PROVIDERS_PLATFORM_URLS,
} from 'src/api/providers';
import { DEFAULT_MODELS } from 'src/api/providers/models';
import { requestUrlFetch } from 'src/api/clients/request-url-fetch';
import { t } from 'src/i18n';
import { TavilyClient } from 'src/legal/providers/tavily-client';
import {
	ExactProvisionStrategy,
	LegalCommandRetrievalStrategyOverride,
	LegalRetrievalStrategy,
	mapExactProvisionStrategyToRetrievalStrategy,
	resolveLegalRetrievalStrategy,
} from 'src/legal/runtime/retrieval-strategy';
import { YuandianClient } from 'src/legal/yuandian-client';

import RosyPilot from '../main';
import { getDaysInCurrentMonth, getThisMonthAsString } from '../utils';

export type {
	ExactProvisionStrategy,
	LegalCommandRetrievalStrategyOverride,
	LegalRetrievalStrategy,
};
export { mapExactProvisionStrategyToRetrievalStrategy };

export interface LegalCommandSettings {
	yuandianApiKey: string | undefined;
	tavilyApiKey: string | undefined;
	defaultRetrievalStrategy: LegalRetrievalStrategy;
	commandOverrides: {
		completeLegalProvision: {
			retrievalStrategy: LegalCommandRetrievalStrategyOverride;
		};
	};
	// Kept for migrating existing local settings. New code should use
	// defaultRetrievalStrategy and commandOverrides.
	exactProvisionStrategy?: ExactProvisionStrategy;
}

export interface RosyPilotSettings {
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
	legal: LegalCommandSettings;
}

const defaultProviders: Record<
	Provider,
	{ apiKey: undefined; fetchedModels: [] }
> = {} as Record<Provider, { apiKey: undefined; fetchedModels: [] }>;
for (const provider of PROVIDERS) {
	defaultProviders[provider] = { apiKey: undefined, fetchedModels: [] };
}

export const DEFAULT_SETTINGS: RosyPilotSettings = {
	version: '2.6.0',
	backups: {},
	providers: defaultProviders,
	completions: {
		enabled: true,
		provider: DEFAULT_PROVIDER,
		model: DEFAULT_MODELS[DEFAULT_PROVIDER],
		maxTokens: 64,
		temperature: 0,
		waitTime: 500,
		windowSize: 512,
		acceptKey: 'Tab',
		rejectKey: 'Escape',
	},
	cache: {
		enabled: true,
	},
	debug: {
		enabled: false,
	},
	usage: {
		dailyTokens: {},
		monthlyTokens: {},
		monthlyLimit: 10_000_000,
	},
	legal: {
		yuandianApiKey: undefined,
		tavilyApiKey: undefined,
		defaultRetrievalStrategy: 'structured-first',
		commandOverrides: {
			completeLegalProvision: {
				retrievalStrategy: 'inherit',
			},
		},
		exactProvisionStrategy: 'yuandian',
	},
};

export class RosyPilotSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: RosyPilot,
	) {
		super(app, plugin);
	}

	display() {
		const { containerEl } = this;

		containerEl.empty();

		const { plugin } = this;
		const { settings } = plugin;
		console.debug(
			'[RosyPilot] display temperature=',
			settings.completions.temperature,
			'waitTime=',
			settings.completions.waitTime,
		);

		/************************************************************/
		/*                       Providers                         */
		/************************************************************/

		new Setting(containerEl).setName(t('providers.heading')).setHeading();

		// Provider selector dropdown
		new Setting(containerEl)
			.setName(t('providers.select'))
			.setDesc(t('providers.select.desc'))
			.addDropdown((dropdown) => {
				for (const provider of PROVIDERS) {
					dropdown.addOption(provider, PROVIDERS_NAMES[provider]);
				}
				dropdown
					.setValue(settings.completions.provider)
					.onChange(async (value) => {
						settings.completions.provider = value as Provider;
						settings.completions.model =
							settings.providers[value as Provider].fetchedModels[0] ?? '';
						await plugin.saveSettings();
						plugin.updateAPIClient();
						this.display();
					});
			});

		const currentProvider = settings.completions.provider;

		// API key field for current provider
		const providerApiKeySetting = new Setting(containerEl)
			.setName(t(`providers.${currentProvider}.apiKey`))
			.setDesc(t(`providers.${currentProvider}.apiKey.desc`))
			.addExtraButton((btn) =>
				btn
					.setIcon('external-link')
					.setTooltip(t(`providers.${currentProvider}.platform`))
					.onClick(() =>
						window.open(PROVIDERS_PLATFORM_URLS[currentProvider], '_blank'),
					),
			);
		providerApiKeySetting.addText((text) =>
			text
				.setValue(settings.providers[currentProvider].apiKey ?? '')
				.onChange(async (value) => {
					settings.providers[currentProvider].apiKey = value;
					await plugin.saveSettings();
					plugin.updateAPIClient();
				}),
		);

		// Fetch models button for current provider
		new Setting(containerEl)
			.setName(t(`providers.${currentProvider}.fetchModels`))
			.setDesc(t(`providers.${currentProvider}.fetchModels.desc`))
			.addButton((button) =>
				button
					.setButtonText(t(`providers.${currentProvider}.fetchModels.btn`))
					.onClick(async () => {
						const apiKey = settings.providers[currentProvider].apiKey;
						if (!apiKey) {
							new Notice(
								t(`providers.${currentProvider}.fetchModels.fail.noKey`),
							);
							return;
						}
						try {
							const openai = new OpenAI({
								apiKey,
								baseURL: PROVIDERS_BASE_URLS[currentProvider],
								dangerouslyAllowBrowser: true,
								fetch: requestUrlFetch,
							});
							const response = await openai.models.list();
							const models = response.data.map((m) => m.id).sort();
							if (models.length === 0) {
								new Notice(
									t(`providers.${currentProvider}.fetchModels.fail.invalid`),
								);
								return;
							}
							settings.providers[currentProvider].fetchedModels = models;
							if (!models.includes(settings.completions.model)) {
								settings.completions.model = models[0];
							}
							await plugin.saveSettings();
							new Notice(t(`providers.${currentProvider}.fetchModels.success`));
							this.display();
						} catch {
							new Notice(
								t(`providers.${currentProvider}.fetchModels.fail.invalid`),
							);
						}
					}),
			);

		new Setting(containerEl)
			.setName(t('completions.model'))
			.setDesc(t('completions.model.desc'))
			.addDropdown((dropdown) => {
				const models = settings.providers[currentProvider].fetchedModels;
				if (models.length === 0) {
					dropdown
						.addOption('', t('completions.model.empty'))
						.setValue('')
						.setDisabled(true);
				} else {
					for (const option of models) {
						dropdown.addOption(option, option);
					}
					dropdown
						.setValue(settings.completions.model)
						.onChange(async (value) => {
							settings.completions.model = value;
							await plugin.saveSettings();
						});
				}
			});

		/************************************************************/
		/*                   Inline completions                     */
		/************************************************************/

		new Setting(containerEl).setName(t('completions.heading')).setHeading();

		new Setting(containerEl)
			.setName(t('completions.enable'))
			.setDesc(t('completions.enable.desc'))
			.addToggle((toggle) =>
				toggle
					.setValue(settings.completions.enabled)
					.onChange(async (value) => {
						settings.completions.enabled = value;
						await plugin.saveSettings();
						this.display();
					}),
			);

		/************************************************************/
		/*                   Completion parameters                  */
		/************************************************************/

		new Setting(containerEl)
			.setName(t('completions.advanced.heading'))
			.setHeading();

		new Setting(containerEl)
			.setName(t('completions.maxTokens'))
			.setDesc(t('completions.maxTokens.desc'))
			.addText((text) =>
				text
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.maxTokens.toString())
					.onChange(async (value) => {
						const amount = parseInt(value);
						if (isNaN(amount) || amount < 0) {
							return;
						}
						settings.completions.maxTokens = amount;
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('completions.temperature'))
			.setDesc(t('completions.temperature.desc'))
			.addSlider((slider) =>
				slider
					.setDisabled(!settings.completions.enabled)
					.setLimits(0, 1, 0.01)
					.setValue(settings.completions.temperature)
					.setDynamicTooltip()
					.onChange(async (value) => {
						settings.completions.temperature = value;
						await plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t('completions.waitTime'))
			.setDesc(t('completions.waitTime.desc'))
			.addSlider((slider) =>
				slider
					.setDisabled(!settings.completions.enabled)
					.setLimits(0, 1000, 100)
					.setValue(settings.completions.waitTime)
					.setDynamicTooltip()
					.onChange(async (value) => {
						settings.completions.waitTime = value;
						await plugin.saveSettings();
						plugin.updateEditorExtension();
					}),
			);

		new Setting(containerEl)
			.setName(t('completions.windowSize'))
			.setDesc(t('completions.windowSize.desc'))
			.addText((text) =>
				text
					.setValue(settings.completions.windowSize.toString())
					.onChange(async (value) => {
						const amount = parseInt(value);
						if (isNaN(amount) || amount < 0) {
							return;
						}
						settings.completions.windowSize = amount;
						await plugin.saveSettings();
						plugin.updateEditorExtension();
					}),
			);

		/************************************************************/
		/*                   Completion shortcuts                   */
		/************************************************************/

		new Setting(containerEl)
			.setName(t('completions.shortcuts.heading'))
			.setHeading();

		new Setting(containerEl)
			.setName(t('completions.acceptKey'))
			.setDesc(t('completions.acceptKey.desc'))
			.addText((text) =>
				text
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.acceptKey)
					.onChange(async (value) => {
						settings.completions.acceptKey = value;
						await plugin.saveSettings();
						plugin.updateEditorExtension();
					}),
			);

		new Setting(containerEl)
			.setName(t('completions.rejectKey'))
			.setDesc(t('completions.rejectKey.desc'))
			.addText((text) =>
				text
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.completions.rejectKey)
					.onChange(async (value) => {
						settings.completions.rejectKey = value;
						await plugin.saveSettings();
						plugin.updateEditorExtension();
					}),
			);

		/************************************************************/
		/*                           Cache                          */
		/************************************************************/

		new Setting(containerEl)
			.setName(t('cache.enable'))
			.setDesc(t('cache.enable.desc'))
			.addToggle((toggle) =>
				toggle
					.setDisabled(!settings.completions.enabled)
					.setValue(settings.cache.enabled)
					.onChange(async (value) => {
						settings.cache.enabled = value;
						await plugin.saveSettings();
						this.display();
					}),
			);

		/************************************************************/
		/*                    Legal Command                         */
		/************************************************************/

		new Setting(containerEl).setName(t('settings.legal.title')).setHeading();

		let legalStrategyStatus: Setting | undefined;
		const refreshLegalStrategyStatus = () => {
			const status = this.getLegalStrategyAvailability();
			legalStrategyStatus?.setName(status.name).setDesc(status.desc);
		};

		const yuandianApiKeySetting = new Setting(containerEl)
			.setName(t('settings.legal.apiKey'))
			.setDesc(t('settings.legal.apiKeyDesc'))
			.addExtraButton((btn) =>
				btn
					.setIcon('external-link')
					.setTooltip(t('settings.legal.yuandianPlatform'))
					.onClick(() => window.open('https://open.chineselaw.com/', '_blank')),
			);
		yuandianApiKeySetting
			.addText((text) =>
				text
					.setValue(settings.legal?.yuandianApiKey ?? '')
					.onChange(async (value) => {
						settings.legal.yuandianApiKey = value || undefined;
						await plugin.saveSettings();
						refreshLegalStrategyStatus();
					}),
			)
			.addButton((button) =>
				button
					.setButtonText(t('settings.legal.testConnection'))
					.onClick(async () => {
						button.setDisabled(true);
						button.setButtonText(t('settings.legal.testConnection.running'));
						try {
							await this.testYuandianConnection(settings.legal.yuandianApiKey);
						} finally {
							button.setButtonText(t('settings.legal.testConnection'));
							button.setDisabled(false);
						}
					}),
			);

		const tavilyApiKeySetting = new Setting(containerEl)
			.setName(t('settings.legal.tavilyApiKey'))
			.setDesc(t('settings.legal.tavilyApiKeyDesc'))
			.addExtraButton((btn) =>
				btn
					.setIcon('external-link')
					.setTooltip(t('settings.legal.tavilyPlatform'))
					.onClick(() => window.open('https://tavily.com', '_blank')),
			);
		tavilyApiKeySetting
			.addText((text) =>
				text
					.setValue(settings.legal?.tavilyApiKey ?? '')
					.onChange(async (value) => {
						settings.legal.tavilyApiKey = value || undefined;
						await plugin.saveSettings();
						refreshLegalStrategyStatus();
					}),
			)
			.addButton((button) =>
				button
					.setButtonText(t('settings.legal.testConnection'))
					.onClick(async () => {
						button.setDisabled(true);
						button.setButtonText(t('settings.legal.testConnection.running'));
						try {
							await this.testTavilyConnection(settings.legal.tavilyApiKey);
						} finally {
							button.setButtonText(t('settings.legal.testConnection'));
							button.setDisabled(false);
						}
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.legal.defaultRetrievalStrategy'))
			.setDesc(t('settings.legal.defaultRetrievalStrategyDesc'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption(
						'structured-first',
						t('settings.legal.retrievalStrategy.structuredFirst'),
					)
					.addOption(
						'web-first',
						t('settings.legal.retrievalStrategy.webFirst'),
					)
					.addOption('auto', t('settings.legal.retrievalStrategy.auto'))
					.addOption('all', t('settings.legal.retrievalStrategy.all'))
					.setValue(settings.legal.defaultRetrievalStrategy)
					.onChange(async (value) => {
						settings.legal.defaultRetrievalStrategy =
							value as LegalRetrievalStrategy;
						await plugin.saveSettings();
						refreshLegalStrategyStatus();
					}),
			);

		new Setting(containerEl)
			.setName(t('settings.legal.commandOverrides.completeLegalProvision'))
			.setDesc(t('settings.legal.commandOverrides.completeLegalProvisionDesc'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption('inherit', t('settings.legal.retrievalStrategy.inherit'))
					.addOption(
						'structured-first',
						t('settings.legal.retrievalStrategy.structuredFirst'),
					)
					.addOption(
						'web-first',
						t('settings.legal.retrievalStrategy.webFirst'),
					)
					.addOption('auto', t('settings.legal.retrievalStrategy.auto'))
					.addOption('all', t('settings.legal.retrievalStrategy.all'))
					.setValue(
						settings.legal.commandOverrides.completeLegalProvision
							.retrievalStrategy,
					)
					.onChange(async (value) => {
						settings.legal.commandOverrides.completeLegalProvision.retrievalStrategy =
							value as LegalCommandRetrievalStrategyOverride;
						await plugin.saveSettings();
						refreshLegalStrategyStatus();
					}),
			);

		legalStrategyStatus = new Setting(containerEl);
		refreshLegalStrategyStatus();

		/************************************************************/
		/*                    Debug and usage                       */
		/************************************************************/

		new Setting(containerEl).setName(t('misc.heading')).setHeading();

		new Setting(containerEl)
			.setName(t('debug.enable'))
			.setDesc(t('debug.enable.desc'))
			.addToggle((toggle) =>
				toggle.setValue(settings.debug.enabled).onChange(async (value) => {
					settings.debug.enabled = value;
					await plugin.saveSettings();
					// Defer view operations so the settings modal can close gracefully.
					window.setTimeout(() => {
						if (value) {
							void plugin.activateDebugView();
						} else {
							plugin.deactivateDebugView();
						}
					}, 100);
				}),
			);

		/************************************************************/
		/*                          Usage                           */
		/************************************************************/

		new Setting(containerEl).setName(t('usage.heading')).setHeading();

		new Setting(containerEl)
			.setName(t('usage.monthlyLimit'))
			.setDesc(t('usage.monthlyLimit.desc'))
			.addText((text) =>
				text
					.setValue(settings.usage.monthlyLimit.toString())
					.onChange(async (value) => {
						const amount = parseFloat(value);
						if (isNaN(amount) || amount < 0) {
							return;
						}
						settings.usage.monthlyLimit = amount;
						await plugin.saveSettings();
					}),
			);

		this.showUsageProgress();

		new Setting(containerEl)
			.setName(t('usage.monthlyTokens'))
			.setDesc(t('usage.monthlyTokens.desc'));

		this.showMonthlyTokens();

		/************************************************************/
		/*                          About                           */
		/************************************************************/

		new Setting(containerEl).setName(t('about.heading')).setHeading();

		const aboutEl = containerEl.createDiv('rosypilot-about');
		const { name, version, author } = this.plugin.manifest;
		aboutEl.createDiv('rosypilot-about-title').setText(`${name}  v${version}`);
		aboutEl
			.createDiv('rosypilot-about-meta')
			.setText(`${author} · zh-xx@foxmail.com`);
		aboutEl
			.createDiv('rosypilot-about-copy')
			.setText(
				`© ${new Date().getFullYear()} ${author}. All rights reserved.`,
			);
	}

	private async testYuandianConnection(apiKey: string | undefined) {
		if (!apiKey) {
			new Notice(t('settings.legal.testConnection.noKey'));
			return;
		}

		try {
			const client = new YuandianClient(apiKey);
			const result = await client.fetchDetail(
				'中华人民共和国民法典',
				'第五百一十一条',
			);
			new Notice(
				result
					? t('settings.legal.testConnection.success')
					: t('settings.legal.testConnection.empty'),
			);
		} catch (error) {
			new Notice(this.getConnectionErrorMessage(error));
		}
	}

	private async testTavilyConnection(apiKey: string | undefined) {
		if (!apiKey) {
			new Notice(t('settings.legal.testConnection.noKey'));
			return;
		}

		try {
			const client = new TavilyClient(apiKey);
			await client.search('中华人民共和国民法典 第五百一十一条 法条 原文');
			new Notice(t('settings.legal.testConnection.success'));
		} catch (error) {
			new Notice(this.getConnectionErrorMessage(error));
		}
	}

	private getConnectionErrorMessage(error: unknown): string {
		const reason =
			error instanceof Error && error.message ? ` ${error.message}` : '';
		return `${t('settings.legal.testConnection.fail')}${reason}`;
	}

	private getLegalStrategyAvailability(): { name: string; desc: string } {
		const { legal } = this.plugin.settings;
		const hasYuandian = Boolean(legal?.yuandianApiKey);
		const hasTavily = Boolean(legal?.tavilyApiKey);
		const strategy = resolveLegalRetrievalStrategy(
			legal?.defaultRetrievalStrategy,
			legal?.commandOverrides?.completeLegalProvision?.retrievalStrategy,
			legal?.exactProvisionStrategy,
			DEFAULT_SETTINGS.legal.defaultRetrievalStrategy,
		);

		if (strategy === 'structured-first') {
			return {
				name: t('settings.legal.strategyStatus'),
				desc: hasYuandian
					? t('settings.legal.strategyStatus.yuandian.ready')
					: t('settings.legal.strategyStatus.yuandian.missing'),
			};
		}

		if (strategy === 'web-first') {
			return {
				name: t('settings.legal.strategyStatus'),
				desc: hasTavily
					? t('settings.legal.strategyStatus.web.ready')
					: t('settings.legal.strategyStatus.web.missing'),
			};
		}

		if (strategy === 'auto') {
			let desc = t('settings.legal.strategyStatus.none');
			if (hasYuandian && hasTavily) {
				desc = t('settings.legal.strategyStatus.auto.both');
			} else if (hasYuandian) {
				desc = t('settings.legal.strategyStatus.auto.yuandianOnly');
			} else if (hasTavily) {
				desc = t('settings.legal.strategyStatus.auto.tavilyOnly');
			}
			return {
				name: t('settings.legal.strategyStatus'),
				desc,
			};
		}

		let desc = t('settings.legal.strategyStatus.none');
		if (hasYuandian && hasTavily) {
			desc = t('settings.legal.strategyStatus.all.both');
		} else if (hasYuandian) {
			desc = t('settings.legal.strategyStatus.all.yuandianOnly');
		} else if (hasTavily) {
			desc = t('settings.legal.strategyStatus.all.tavilyOnly');
		}
		return {
			name: t('settings.legal.strategyStatus'),
			desc,
		};
	}

	showUsageProgress() {
		const { settings } = this.plugin;
		const { containerEl } = this;

		const used = settings.usage.monthlyTokens[getThisMonthAsString()] ?? 0;
		const limit = settings.usage.monthlyLimit;
		const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

		const wrap = containerEl.createDiv('rosypilot-usage-progress-wrap');
		const bar = wrap.createDiv('rosypilot-usage-progress-bar');
		bar.createDiv('rosypilot-usage-progress-fill').style.width = `${pct}%`;
		wrap
			.createDiv('rosypilot-usage-progress-label')
			.setText(
				`${used.toLocaleString()} / ${limit.toLocaleString()} tokens  (${pct.toFixed(1)}%)`,
			);
	}

	showMonthlyTokens() {
		const { plugin } = this;
		const { settings } = plugin;

		const { containerEl } = this;

		const dates = getDaysInCurrentMonth();
		const data = dates.map((date) => ({ date, tokens: 0 }));
		for (const [day, tokens] of Object.entries(settings.usage.dailyTokens)) {
			const target = new Date(day + 'T00:00:00').toDateString();
			const index = dates.findIndex((date) => date.toDateString() === target);
			if (index !== -1) {
				data[index].tokens = tokens;
			}
		}

		const style = getComputedStyle(containerEl);
		const hue = style.getPropertyValue('--accent-h');
		const saturation = style.getPropertyValue('--accent-s');
		const lightness = style.getPropertyValue('--accent-l');
		const backgroundColor = `hsl(${hue}, ${saturation}, ${lightness})`;
		new Chart(containerEl.createEl('canvas'), {
			type: 'bar',
			options: {
				plugins: {
					tooltip: {
						callbacks: {
							label: (item) => `${item.parsed.y.toLocaleString()} tokens`,
						},
					},
				},
			},
			data: {
				labels: data.map(
					(row) => `${row.date.getMonth() + 1}/${row.date.getDate()}`,
				),
				datasets: [
					{
						label: t('usage.chartLabel'),
						data: data.map((row) => row.tokens),
						backgroundColor,
					},
				],
			},
		});
	}
}
