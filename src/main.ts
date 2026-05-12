import { Extension } from '@codemirror/state';
import { addIcon, Notice, Plugin, setIcon } from 'obsidian';
import { APIClient } from './api';
import { OpenAICompatibleAPIClient } from './api/clients/openai-compatible';
import { PromptGenerator } from './api/prompts/generator';
import { Provider, PROVIDERS } from './api/providers';
import { TokenTracker } from './api/providers/tokens';
import { MemoryCacheProxy } from './api/proxies/memory-cache';
import { UsageMonitorProxy } from './api/proxies/usage-monitor';
import { DEBUG_VIEW_TYPE, DebugEntry, DebugView } from './debug/view';
import { inlineCompletionsExtension } from './editor/extension';
import { LegalCommandDebugEntry } from './legal/debug';
import {
	LEGAL_DEBUG_VIEW_TYPE,
	LegalCommandDebugView,
} from './legal/debug-view';
import { LegalSlashCommand } from './legal/slash-command';
import { LEGAL_PANEL_VIEW_TYPE, LegalPanelView } from './legal/view';
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
	legalDebugView: LegalCommandDebugView | null = null;
	legalPanelView: LegalPanelView | null = null;

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

		this.registerView(LEGAL_DEBUG_VIEW_TYPE, (leaf) => {
			const view = new LegalCommandDebugView(leaf);
			this.legalDebugView = view;
			return view;
		});

		this.registerView(LEGAL_PANEL_VIEW_TYPE, (leaf) => {
			const view = new LegalPanelView(leaf);
			this.legalPanelView = view;
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
			id: 'complete-legal-provision',
			name: t('legal.slashCommand.label'),
			editorCallback: (editor) => {
				// Remove the trailing space that was typed before "/" to trigger
				// Obsidian's slash command popup in non-empty lines.
				const cursor = editor.getCursor();
				const lineText = editor.getLine(cursor.line);
				if (cursor.ch > 0 && lineText[cursor.ch - 1] === ' ') {
					editor.replaceRange(
						'',
						{ line: cursor.line, ch: cursor.ch - 1 },
						cursor,
					);
				}
				const prefix = editor.getRange({ line: 0, ch: 0 }, editor.getCursor());
				void new LegalSlashCommand(this).run(prefix, editor);
			},
		});
	}

	createAPIClient(_provider: Provider) {
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
		const { debounced, cancel } = debounceAsyncFunc(
			fetcher,
			settings.completions.waitTime,
		);

		return inlineCompletionsExtension(debounced, cancel, this);
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
		console.debug('[RosyPilot] Context:', entry.context);
		console.debug('[RosyPilot] Prompt:', JSON.stringify(entry.prompt, null, 2));
		console.debug('[RosyPilot] Request:', entry.request);
		console.debug('[RosyPilot] Raw response:', entry.rawResponse);
		console.debug('[RosyPilot] Parsed result:', entry.parsedResult);

		if (this.settings.debug.enabled) {
			this.debugView?.log(entry);
		}
	}

	legalDebugLog(entry: LegalCommandDebugEntry) {
		console.debug('[RosyPilot Legal] Debug:', entry);

		if (this.settings.debug.enabled) {
			this.legalDebugView?.log(entry);
		}
	}

	async activateDebugView() {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(DEBUG_VIEW_TYPE);
		if (leaves.length > 0) {
			void workspace.revealLeaf(leaves[0]);
		} else {
			const leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: DEBUG_VIEW_TYPE, active: true });
		}

		const legalLeaves = workspace.getLeavesOfType(LEGAL_DEBUG_VIEW_TYPE);
		if (legalLeaves.length > 0) {
			void workspace.revealLeaf(legalLeaves[0]);
			return;
		}

		const legalLeaf = workspace.getRightLeaf(false);
		await legalLeaf?.setViewState({
			type: LEGAL_DEBUG_VIEW_TYPE,
			active: true,
		});
	}

	async openLegalPanel(): Promise<LegalPanelView> {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(LEGAL_PANEL_VIEW_TYPE);
		if (leaves.length > 0) {
			await workspace.revealLeaf(leaves[0]);
			return leaves[0].view as LegalPanelView;
		}

		const leaf = workspace.getRightLeaf(false);
		await leaf?.setViewState({ type: LEGAL_PANEL_VIEW_TYPE, active: true });
		return this.legalPanelView!;
	}

	deactivateDebugView() {
		const { workspace } = this.app;

		const leaves = workspace.getLeavesOfType(DEBUG_VIEW_TYPE);
		for (const leaf of leaves) {
			leaf.detach();
		}
		this.debugView = null;

		const legalLeaves = workspace.getLeavesOfType(LEGAL_DEBUG_VIEW_TYPE);
		for (const leaf of legalLeaves) {
			leaf.detach();
		}
		this.legalDebugView = null;
	}

	async loadSettings() {
		const data = (await this.loadData()) as RosyPilotSettings | null;
		if (data === null) {
			this.settings = structuredClone(DEFAULT_SETTINGS);
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
		for (const p of PROVIDERS) {
			this.settings.providers[p] = Object.assign(
				{},
				DEFAULT_SETTINGS.providers[p],
				this.settings.providers[p] ?? {},
			);
		}
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
		this.settings.legal = Object.assign(
			{},
			DEFAULT_SETTINGS.legal,
			this.settings.legal,
		);
	}

	async saveSettings() {
		console.debug(
			'[RosyPilot] saveSettings temperature=',
			this.settings.completions.temperature,
			'waitTime=',
			this.settings.completions.waitTime,
		);
		await this.saveData(this.settings);
	}
}
