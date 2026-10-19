// UI waits are handled by Playwright itself: actions auto-wait for the element to be
// visible/enabled, and expect(...) assertions retry until they pass or time out.
// This file is for things Playwright can't see, like a DB row that shows up a bit later.

export interface PollOptions {
  timeoutMs?: number;
  intervalMs?: number;
  description?: string;
}

export async function pollUntil<T>(
  fetchValue: () => Promise<T>,
  isDone: (value: T) => boolean,
  { timeoutMs = 15_000, intervalMs = 1_000, description = 'condition' }: PollOptions = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  let lastValue: T | undefined;
  let lastError: unknown;

  while (Date.now() < deadline) {
    attempt++;
    try {
      lastValue = await fetchValue();
      if (isDone(lastValue)) return lastValue;
    } catch (error) {
      lastError = error;
    }
    // The only fixed pause in the framework: a short gap between polls so we
    // don't hammer the DB. It's bounded by timeoutMs, so it can't hang forever.
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  const reason = lastError instanceof Error ? ` Last error: ${lastError.message}` : '';
  throw new Error(
    `Timed out after ${timeoutMs}ms (${attempt} attempts) waiting for ${description}. ` +
      `Last value: ${JSON.stringify(lastValue)}.${reason}`,
  );
}
