/**
 * Appends a small domain-only link to `el`.
 *
 * Extracts the hostname from `url` and renders it as a styled `<a>` element.
 * Intended for panel cards where a full URL would be too noisy but the source
 * site still needs to be identifiable at a glance.
 *
 * Usage:
 *   const header = card.createDiv('rosypilot-legal-source-header');
 *   appendDomainLink(header, result.source.url);
 */
export function appendDomainLink(el: HTMLElement, url: string): void {
	let hostname: string;
	try {
		hostname = new URL(url).hostname;
	} catch {
		return;
	}
	const link = el.createEl('a', {
		text: hostname,
		cls: 'rosypilot-legal-domain-link',
	});
	link.href = url;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
}
