// Utility function to get the keys of an object
// that provides more informative typing on the return value than `Object.keys`.
export function getObjectKeys<T extends Record<string, unknown>>(
	obj: T,
): (keyof T)[] {
	return Object.keys(obj);
}

// Debounce an async function by waiting for `wait` milliseconds before resolving.
// If a new request is made before the timeout, the previous request is cancelled.
export function debounceAsyncFunc<TArgs extends unknown[], TResult>(
	func: (...args: TArgs) => Promise<TResult>,
	wait: number,
): {
	debounced: (...args: TArgs) => Promise<TResult | undefined>;
	cancel: () => void;
	force: () => void;
} {
	// Put these default functions in an object
	// to prevent stale closure of the return values.
	const previous = {
		cancel: () => {},
		force: () => {},
	};

	function debounced(...args: TArgs): Promise<TResult | undefined> {
		return new Promise((resolve) => {
			previous.cancel();
			const timer = setTimeout(() => void func(...args).then(resolve), wait);
			previous.cancel = () => {
				clearTimeout(timer);
				resolve(undefined);
			};
			previous.force = () => {
				clearTimeout(timer);
				void func(...args).then(resolve);
			};
		});
	}

	return {
		debounced,
		cancel: () => previous.cancel(),
		force: () => previous.force(),
	};
}

// Debounce an async generator by waiting for `wait` milliseconds before resolving.
// If a new request is made before the timeout, the previous request is cancelled.
export function debounceAsyncGenerator<TArgs extends unknown[], TResult>(
	func: (...args: TArgs) => AsyncGenerator<TResult>,
	wait: number,
): {
	debounced: (...args: TArgs) => AsyncGenerator<TResult | undefined>;
	cancel: () => void;
	force: () => void;
} {
	const previous = {
		cancel: () => {},
		force: () => {},
	};

	let lastId = 0;

	async function* debounced(
		...args: TArgs
	): AsyncGenerator<TResult | undefined> {
		previous.cancel();
		const id = lastId; // Must be after `previous.cancel()`.
		try {
			await new Promise<void>((resolve, reject) => {
				const timer = setTimeout(() => resolve(), wait);
				previous.cancel = () => {
					++lastId;
					clearTimeout(timer);
					reject(new Error('Debounce cancelled'));
				};
				previous.force = () => {
					clearTimeout(timer);
					resolve();
				};
			});
		} catch {
			return;
		}
		for await (const chunk of func(...args)) {
			if (id !== lastId) break;
			yield chunk;
		}
	}

	return {
		debounced,
		cancel: () => previous.cancel(),
		force: () => previous.force(),
	};
}

// Utility function to validate the given string is a valid URL or not.
export function validateURL(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch {
		return false;
	}
}

export function getTodayAsString(): string {
	return new Date().toISOString().split('T')[0];
}

export function getThisMonthAsString(): string {
	return new Date().toISOString().split('-').slice(0, 2).join('-');
}

export function getDaysInCurrentMonth(): Date[] {
	const today = new Date();
	const date = new Date(today.getFullYear(), today.getMonth(), 1);
	const dates = [];
	while (date.getMonth() === today.getMonth()) {
		dates.push(new Date(date));
		date.setDate(date.getDate() + 1);
	}
	return dates;
}
