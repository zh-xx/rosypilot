import { moment } from 'obsidian';
import { en } from './en';
import { zh } from './zh';

export type Locale = 'en' | 'zh';

const translations: Record<Locale, Record<string, string>> = { en, zh };

function getLocale(): Locale {
	const locale = moment.locale();
	return locale.startsWith('zh') ? 'zh' : 'en';
}

export function t(key: string): string {
	const locale = getLocale();
	return translations[locale][key] ?? translations['en'][key] ?? key;
}
