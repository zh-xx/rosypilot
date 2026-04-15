export interface APIClient {
	fetchCompletions(prefix: string, suffix: string): Promise<string | undefined>;
	testConnection(): Promise<boolean>;
}
