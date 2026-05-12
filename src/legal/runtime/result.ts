export type LegalResultType =
	| 'statute'
	| 'case'
	| 'article'
	| 'web'
	| 'analysis';

export interface LegalResult {
	id: string;
	type: LegalResultType;
	title: string;
	content: string;
	source: {
		provider: string;
		name?: string;
		url?: string;
	};
	metadata: {
		lawName?: string;
		articleNo?: string;
		effectiveStatus?: string;
		category?: string;
		publishDate?: string;
		effectiveDate?: string;
		score?: number;
	};
	raw: unknown;
}
