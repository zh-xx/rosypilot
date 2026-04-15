import { requestUrl } from 'obsidian';

/**
 * Custom fetch function that uses Obsidian's requestUrl to bypass CORS.
 */
export async function requestUrlFetch(
	url: string | URL | Request,
	init: RequestInit = {},
): Promise<Response> {
	const method = (init.method ?? 'GET').toUpperCase();

	const resolvedUrl =
		url instanceof URL
			? url.toString()
			: typeof url === 'string'
				? url
				: url.url;

	const headers: Record<string, string> = {};
	if (init.headers) {
		if (init.headers instanceof Headers) {
			init.headers.forEach((value, key) => {
				headers[key] = value;
			});
		} else if (Array.isArray(init.headers)) {
			for (const [key, value] of init.headers) {
				headers[key] = value;
			}
		} else {
			Object.assign(headers, init.headers);
		}
	}

	let body: string | undefined;
	if (init.body instanceof ReadableStream) {
		throw new Error('ReadableStream request body is not supported');
	} else if (init.body instanceof ArrayBuffer) {
		body = new TextDecoder().decode(init.body);
	} else if (init.body instanceof URLSearchParams) {
		body = init.body.toString();
	} else if (init.body instanceof FormData) {
		throw new Error('FormData request body is not supported');
	} else if (init.body === null || init.body === undefined) {
		body = undefined;
	} else if (typeof init.body === 'string') {
		body = init.body;
	} else {
		body = String(init.body);
	}

	const result = await requestUrl({
		url: resolvedUrl,
		method,
		headers,
		body,
		throw: false,
	});

	const responseHeaders = new Headers();
	for (const [key, value] of Object.entries(result.headers)) {
		if (value !== undefined) {
			responseHeaders.set(key, value);
		}
	}

	const responseBody =
		result.arrayBuffer instanceof ArrayBuffer
			? new TextDecoder().decode(result.arrayBuffer)
			: String(result.arrayBuffer);

	return new Response(responseBody, {
		status: result.status,
		headers: responseHeaders,
	});
}
