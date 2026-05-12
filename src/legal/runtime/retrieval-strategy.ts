export type ExactProvisionStrategy = 'yuandian' | 'web' | 'auto' | 'all';
export type LegalRetrievalStrategy =
	| 'structured-first'
	| 'web-first'
	| 'auto'
	| 'all';
export type LegalCommandRetrievalStrategyOverride =
	| 'inherit'
	| LegalRetrievalStrategy;

export function mapExactProvisionStrategyToRetrievalStrategy(
	strategy: ExactProvisionStrategy | undefined,
): LegalRetrievalStrategy | undefined {
	if (strategy === 'yuandian') {
		return 'structured-first';
	}
	if (strategy === 'web') {
		return 'web-first';
	}
	return strategy;
}

export function resolveLegalRetrievalStrategy(
	defaultStrategy: LegalRetrievalStrategy | undefined,
	override: LegalCommandRetrievalStrategyOverride | undefined,
	legacyExactStrategy: ExactProvisionStrategy | undefined,
	fallback: LegalRetrievalStrategy,
): LegalRetrievalStrategy {
	if (override && override !== 'inherit') {
		return override;
	}

	return (
		defaultStrategy ??
		mapExactProvisionStrategyToRetrievalStrategy(legacyExactStrategy) ??
		fallback
	);
}
