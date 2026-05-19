import { LegalPanelView } from './view';
import { LegalResult } from './runtime/result';

jest.mock(
	'obsidian',
	() => {
		class ItemView {
			contentEl = new FakeElement('div', 'content');

			constructor(_leaf: unknown) {}
		}

		return { ItemView };
	},
	{ virtual: true },
);

jest.mock('src/i18n', () => ({
	t: (key: string) =>
		({
			'legal.panel.empty': '未找到相关法条',
			'legal.panel.detail.label': '精确匹配',
			'legal.panel.insert.raw': '插入法条',
			'legal.panel.insert.action': '插入',
			'legal.panel.insert.adapted': '匹配原文',
			'legal.panel.insert.format.content': '正文',
			'legal.panel.insert.format.title-content': '标题+正文',
			'legal.panel.insert.format.quote-block': '引用块',
			'legal.panel.source': '来源',
			'legal.panel.expand': '展开全文',
			'legal.panel.collapse': '收起全文',
			'legal.panel.badge.yuandian': '元典',
			'legal.panel.badge.web': 'Web Search',
			'legal.panel.badge.webExtracted': '网页抽取',
			'legal.panel.badge.webSnippet': '网页片段',
			'legal.panel.meta.lawName': '法规名称',
			'legal.panel.meta.articleNo': '条文编号',
			'legal.panel.meta.effectiveStatus': '效力状态',
			'legal.panel.meta.category': '法规类型',
			'legal.panel.meta.publishDate': '发布日期',
			'legal.panel.meta.effectiveDate': '施行日期',
			'legal.panel.title': '法条',
		})[key] ?? key,
}));

class FakeElement {
	children: FakeElement[] = [];
	textContent = '';
	title = '';
	disabled = false;
	value = '';
	private listeners = new Map<string, (() => void)[]>();

	constructor(
		private tag: string,
		private cls = '',
	) {}

	addClass(cls: string): void {
		this.cls = this.cls ? `${this.cls} ${cls}` : cls;
	}

	setAttribute(_name: string, _value: string): void {}

	createDiv(cls?: string): FakeElement {
		return this.append(new FakeElement('div', cls ?? ''));
	}

	createEl(
		tag: string,
		options?: { cls?: string; text?: string; value?: string },
	): FakeElement {
		const child = this.append(new FakeElement(tag, options?.cls ?? ''));
		if (options?.text) {
			child.setText(options.text);
		}
		if (options?.value) {
			child.value = options.value;
			if (!this.value) this.value = options.value;
		}
		return child;
	}

	createSpan(options?: { cls?: string; text?: string }): FakeElement {
		const child = this.append(new FakeElement('span', options?.cls ?? ''));
		if (options?.text) {
			child.setText(options.text);
		}
		return child;
	}

	setText(text: string): void {
		this.textContent = text;
	}

	empty(): void {
		this.children = [];
		this.textContent = '';
	}

	addEventListener(event: string, listener: () => void): void {
		const listeners = this.listeners.get(event) ?? [];
		listeners.push(listener);
		this.listeners.set(event, listeners);
	}

	click(): void {
		for (const listener of this.listeners.get('click') ?? []) {
			listener();
		}
	}

	findAllByClass(cls: string): FakeElement[] {
		const self = this.cls.split(/\s+/).includes(cls) ? [this] : [];
		return [
			...self,
			...this.children.flatMap((child) => child.findAllByClass(cls)),
		];
	}

	findAllByTag(tag: string): FakeElement[] {
		const self = this.tag === tag ? [this] : [];
		return [
			...self,
			...this.children.flatMap((child) => child.findAllByTag(tag)),
		];
	}

	allText(): string {
		return [this.textContent, ...this.children.map((child) => child.allText())]
			.filter(Boolean)
			.join('\n');
	}

	private append(child: FakeElement): FakeElement {
		this.children.push(child);
		return child;
	}
}

function createResult(
	id: string,
	provider: string,
	sourceName: string,
): LegalResult {
	return {
		id,
		type: provider === 'yuandian' ? 'statute' : 'web',
		title: `${sourceName}标题`,
		content: `${sourceName}正文`,
		source: {
			provider,
			name: sourceName,
			url: provider === 'tavily' ? 'https://example.com' : undefined,
		},
		metadata: {
			lawName: '中华人民共和国民法典',
			articleNo: '第五百一十一条',
			effectiveStatus: provider === 'yuandian' ? '现行有效' : undefined,
		},
		raw: {},
	};
}

function createOpenedView(): { view: LegalPanelView; root: FakeElement } {
	const view = new LegalPanelView({} as never);
	void view.onOpen();
	return {
		view,
		root: (view as unknown as { contentEl: FakeElement }).contentEl,
	};
}

describe('LegalPanelView', () => {
	it('renders an empty state for empty detail results', () => {
		const { view, root } = createOpenedView();

		view.setDetails([]);

		expect(root.allText()).toContain('未找到相关法条');
	});

	it('renders multiple LegalResult cards with source metadata', () => {
		const { view, root } = createOpenedView();
		const results = [
			createResult('yuandian:1', 'yuandian', '元典'),
			createResult('web:1', 'tavily', 'Tavily'),
		];

		view.setDetails(results);

		const items = root.findAllByClass('rosypilot-legal-item');
		const text = root.allText();

		expect(items).toHaveLength(2);
		expect(text).toContain('精确匹配');
		expect(text).toContain('元典标题');
		expect(text).toContain('Tavily标题');
		expect(text).toContain('元典');
		expect(text).toContain('Tavily · 网页片段');
		expect(text).toContain('来源：');
		expect(text).toContain('example.com');
		expect(text).toContain('中华人民共和国民法典');
		expect(text).toContain('第五百一十一条');
	});

	it('renders semantic result label when provided', () => {
		const { view, root } = createOpenedView();

		view.setDetails(
			[createResult('yuandian:1', 'yuandian', '元典')],
			undefined,
			undefined,
			'语义相关',
		);

		expect(root.allText()).toContain('语义相关');
		expect(root.allText()).not.toContain('精确匹配');
	});

	it('collapses and expands long web content', () => {
		const { view, root } = createOpenedView();
		const longContent = 'a'.repeat(250);
		const result = {
			...createResult('web:1', 'tavily', 'Tavily'),
			content: longContent,
		};

		view.setDetails([result]);
		const text = root.allText();
		const buttons = root.findAllByTag('button');

		expect(text).toContain('展开全文');
		expect(text).not.toContain(longContent);

		buttons[0].click();
		expect(root.allText()).toContain(longContent);
		expect(root.allText()).toContain('收起全文');
	});

	it('binds raw and adapted callbacks to each result card', async () => {
		const { view, root } = createOpenedView();
		const results = [
			createResult('yuandian:1', 'yuandian', '元典'),
			createResult('web:1', 'tavily', 'Tavily'),
		];
		const onRaw = jest.fn();
		const onAdapted = jest.fn().mockResolvedValue(undefined);

		view.setDetails(results, onRaw, onAdapted);
		const buttons = root.findAllByTag('button');

		expect(buttons.map((button) => button.textContent)).toEqual([
			'正文',
			'标题+正文',
			'引用块',
			'匹配原文',
			'正文',
			'标题+正文',
			'引用块',
			'匹配原文',
		]);

		buttons[2].click();
		buttons[7].click();
		await Promise.resolve();

		expect(onRaw).toHaveBeenCalledWith(results[0], 'quote-block');
		expect(onAdapted).toHaveBeenCalledWith(results[1]);
	});
});
