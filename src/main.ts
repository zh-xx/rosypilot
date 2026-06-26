import { Extension } from '@codemirror/state';
import { addIcon, Notice, Plugin, setIcon } from 'obsidian';
import { APIClient } from './api';
import { OpenAICompatibleAPIClient } from './api/clients/openai-compatible';
import { PromptGenerator } from './api/prompts/generator';
import { Provider, PROVIDERS } from './api/providers';
import { FALLBACK_MODELS } from './api/providers/models';
import { TokenTracker } from './api/providers/tokens';
import { MemoryCacheProxy } from './api/proxies/memory-cache';
import { UsageMonitorProxy } from './api/proxies/usage-monitor';
import { DEBUG_VIEW_TYPE, DebugEntry, DebugView } from './debug/view';
import { inlineCompletionsExtension } from './editor/extension';
import { hallucinationHighlightField } from './legal/editor-highlight';
import { LegalCommandDebugEntry } from './legal/debug';
import {
	LEGAL_DEBUG_VIEW_TYPE,
	LegalCommandDebugView,
} from './legal/debug-view';
import { HallucinationSlashCommand } from './legal/hallucination-slash-command';
import { LegalSlashCommand } from './legal/slash-command';
import { LEGAL_PANEL_VIEW_TYPE, LegalPanelView } from './legal/view';
import { t } from './i18n';
import flowerOffIcon from './icons/flower-off.svg';
import {
	DEFAULT_SETTINGS,
	mapExactProvisionStrategyToRetrievalStrategy,
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
		this.registerEditorExtension(hallucinationHighlightField);

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
		this.registerEditorMenus();
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
		this.registerLegalCommand(
			'complete-legal-provision',
			t('legal.slashCommand.label'),
		);
		this.registerLegalCommand(
			'complete-legal-case',
			t('legal.slashCommand.caseLabel'),
		);
		this.addCommand({
			id: 'hallucination-detect',
			name: t('legal.slashCommand.hallucinationLabel'),
			editorCallback: (editor) => {
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
				void new HallucinationSlashCommand(this).run(prefix, editor);
			},
		});
	}

	registerEditorMenus() {
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				menu.addItem((item) => {
					item
						.setTitle(t('legal.slashCommand.hallucinationLabel'))
						.setIcon('scale')
						.onClick(() => {
							void new HallucinationSlashCommand(this).run('', editor);
						});
				});
			}),
		);
	}

	private registerLegalCommand(
		id: 'complete-legal-provision' | 'complete-legal-case',
		name: string,
	) {
		this.addCommand({
			id,
			name,
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
				void new LegalSlashCommand(this, id).run(prefix, editor);
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
			workspace.setActiveLeaf(leaves[0], { focus: true });
		} else {
			const leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: DEBUG_VIEW_TYPE, active: true });
		}

		const legalLeaves = workspace.getLeavesOfType(LEGAL_DEBUG_VIEW_TYPE);
		if (legalLeaves.length > 0) {
			workspace.setActiveLeaf(legalLeaves[0], { focus: true });
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
			workspace.setActiveLeaf(leaves[0], { focus: true });
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
		this.settings.legal = {
			...DEFAULT_SETTINGS.legal,
			...this.settings.legal,
			commandOverrides: {
				...DEFAULT_SETTINGS.legal.commandOverrides,
				...this.settings.legal?.commandOverrides,
			},
		};
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
			// 兜底：用户尚未「获取模型列表」或拉取失败时，用预设候选填充，
			// 避免模型下拉因 fetchedModels 为空而被禁用卡死。
			// 用户成功 fetch 后，真实列表会覆盖这些值。
			const fallback = FALLBACK_MODELS[p];
			if (
				(this.settings.providers[p].fetchedModels ?? []).length === 0 &&
				fallback !== undefined
			) {
				this.settings.providers[p].fetchedModels = [...fallback];
			}
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
		this.settings.legal.defaultRetrievalStrategy =
			this.settings.legal.defaultRetrievalStrategy ??
			mapExactProvisionStrategyToRetrievalStrategy(
				this.settings.legal.exactProvisionStrategy,
			) ??
			DEFAULT_SETTINGS.legal.defaultRetrievalStrategy;
		this.settings.legal.commandOverrides = Object.assign(
			{},
			DEFAULT_SETTINGS.legal.commandOverrides,
			this.settings.legal.commandOverrides,
		);
		this.settings.legal.commandOverrides.completeLegalProvision = Object.assign(
			{},
			DEFAULT_SETTINGS.legal.commandOverrides.completeLegalProvision,
			this.settings.legal.commandOverrides.completeLegalProvision,
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
