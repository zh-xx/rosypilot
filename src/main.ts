import { Extension } from '@codemirror/state';
import { addIcon, Notice, Plugin, setIcon } from 'obsidian';
import { APIClient } from './api';
import { OpenAICompatibleAPIClient } from './api/clients/openai-compatible';
import { PromptGenerator } from './api/prompts/generator';
import { Provider } from './api/providers';
import { TokenTracker } from './api/providers/tokens';
import { MemoryCacheProxy } from './api/proxies/memory-cache';
import { UsageMonitorProxy } from './api/proxies/usage-monitor';
import { DEBUG_VIEW_TYPE, DebugEntry, DebugView } from './debug/view';
import { inlineCompletionsExtension } from './editor/extension';
import { t } from './i18n';
import flowerOffIcon from './icons/flower-off.svg';
import {
	DEFAULT_SETTINGS,
	RosyPilotSettings,
	RosyPilotSettingTab,
} from './settings';
import { SettingsMigrationsRunner } from './settings/runner';
import { debounceAsyncFunc } from './utils';

export default class RosyPilot extends Plugin {
	settings!: RosyPilotSettings;

	extensions!: Extension[];
	completionsClient!: APIClient;
	debugView: DebugView | null = null;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new RosyPilotSettingTab(this.app, this));

		const { settings } = this;

		this.completionsClient = this.createAPIClient(
			settings.completions.provider,
		);

		this.extensions = this.createEditorExtension();
		this.registerEditorExtension(this.extensions);

		this.registerView(DEBUG_VIEW_TYPE, (leaf) => {
			const view = new DebugView(leaf);
			this.debugView = view;
			return view;
		});

		this.registerCustomIcons(); // Must be called before `registerRibbonActions()`.
		this.registerRibbonActions();
		this.registerCommands();
	}

	registerCustomIcons() {
		addIcon('flower-off', flowerOffIcon);
	}

	registerRibbonActions() {
		const { settings } = this;

		const toggleCompletionsItem = this.addRibbonIcon(
			settings.completions.enabled ? 'flower' : 'flower-off',
			t('ribbon.toggleCompletions'),
			async () => {
				this.settings.completions.enabled = !this.settings.completions.enabled;
				setIcon(
					toggleCompletionsItem,
					this.settings.completions.enabled ? 'flower' : 'flower-off',
				);
				await this.saveSettings();
				new Notice(
					this.settings.completions.enabled
						? t('notice.completions.enabled')
						: t('notice.completions.disabled'),
				);
			},
		);
	}

	registerCommands() {
		this.addCommand({
			id: 'enable-completions',
			name: t('command.enableCompletions'),
			callback: async () => {
				this.settings.completions.enabled = true;
				await this.saveSettings();
				new Notice(t('notice.completions.enabled'));
			},
		});

		this.addCommand({
			id: 'disable-completions',
			name: t('command.disableCompletions'),
			callback: async () => {
				this.settings.completions.enabled = false;
				await this.saveSettings();
				new Notice(t('notice.completions.disabled'));
			},
		});

		this.addCommand({
			id: 'toggle-completions',
			name: t('command.toggleCompletions'),
			callback: async () => {
				this.settings.completions.enabled = !this.settings.completions.enabled;
				await this.saveSettings();
				new Notice(
					this.settings.completions.enabled
						? t('notice.completions.enabled')
						: t('notice.completions.disabled'),
				);
			},
		});

		this.addCommand({
			id: 'enable-cache',
			name: t('command.enableCache'),
			callback: async () => {
				this.settings.cache.enabled = true;
				await this.saveSettings();
				new Notice(t('notice.cache.enabled'));
			},
		});

		this.addCommand({
			id: 'disable-cache',
			name: t('command.disableCache'),
			callback: async () => {
				this.settings.cache.enabled = false;
				await this.saveSettings();
				new Notice(t('notice.cache.disabled'));
			},
		});

		this.addCommand({
			id: 'toggle-cache',
			name: t('command.toggleCache'),
			callback: async () => {
				this.settings.cache.enabled = !this.settings.cache.enabled;
				await this.saveSettings();
				new Notice(
					this.settings.cache.enabled
						? t('notice.cache.enabled')
						: t('notice.cache.disabled'),
				);
			},
		});
	}

	createAPIClient(provider: Provider) {
		const generator = new PromptGenerator(this);
		const tracker = new TokenTracker(this);
		const client = new OpenAICompatibleAPIClient(generator, tracker, this);
		const clientWithMonitor = new UsageMonitorProxy(client, this);
		const clientWithCache = new MemoryCacheProxy(clientWithMonitor, this);

		return clientWithCache;
	}

	updateAPIClient() {
		const { settings } = this;

		this.completionsClient = this.createAPIClient(
			settings.completions.provider,
		);
	}

	createEditorExtension() {
		const { settings } = this;

		const fetcher = async (prefix: string, suffix: string) => {
			if (!this.settings.completions.enabled) {
				return;
			}
			return this.completionsClient.fetchCompletions(prefix, suffix);
		};
		const { debounced, cancel, force } = debounceAsyncFunc(
			fetcher,
			settings.completions.waitTime,
		);

		return inlineCompletionsExtension(debounced, cancel, force, this);
	}

	updateEditorExtension() {
		const { workspace } = this.app;

		this.extensions.splice(
			0,
			this.extensions.length,
			...this.createEditorExtension(),
		);
		workspace.updateOptions();
	}

	debugLog(entry: DebugEntry) {
		console.log('[RosyPilot] Context:', entry.context);
		console.log('[RosyPilot] Prompt:', JSON.stringify(entry.prompt, null, 2));
		console.log('[RosyPilot] Request:', entry.request);
		console.log('[RosyPilot] Raw response:', entry.rawResponse);
		console.log('[RosyPilot] Parsed result:', entry.parsedResult);

		if (this.settings.debug.enabled) {
			this.debugView?.log(entry);
		}
	}

	async activateDebugView() {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(DEBUG_VIEW_TYPE);
		if (leaves.length > 0) {
			workspace.revealLeaf(leaves[0]);
			return;
		}

		const leaf = workspace.getRightLeaf(false);
		await leaf?.setViewState({ type: DEBUG_VIEW_TYPE, active: true });
	}

	async deactivateDebugView() {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(DEBUG_VIEW_TYPE);
		for (const leaf of leaves) {
			leaf.detach();
		}
		this.debugView = null;
	}

	async loadSettings() {
		const data = await this.loadData();
		if (data === null) {
			this.settings = DEFAULT_SETTINGS;
			return;
		}

		this.settings = data;
		const runner = new SettingsMigrationsRunner(this);
		await runner.apply();

		// Merge default values for any missing fields (e.g. newly added settings).
		this.settings = Object.assign({}, DEFAULT_SETTINGS, this.settings);
		this.settings.debug = Object.assign(
			{},
			DEFAULT_SETTINGS.debug,
			this.settings.debug,
		);
		this.settings.providers = Object.assign(
			{},
			DEFAULT_SETTINGS.providers,
			this.settings.providers,
		);
		this.settings.completions = Object.assign(
			{},
			DEFAULT_SETTINGS.completions,
			this.settings.completions,
		);
		this.settings.cache = Object.assign(
			{},
			DEFAULT_SETTINGS.cache,
			this.settings.cache,
		);
		this.settings.usage = Object.assign(
			{},
			DEFAULT_SETTINGS.usage,
			this.settings.usage,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
