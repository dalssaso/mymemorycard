/**
 * Queue-based rate limiter for IGDB API.
 * Enforces 4 requests per second (250ms minimum interval).
 */
export class IgdbRateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minInterval = 250; // 4 req/sec = 250ms

  /**
   * Schedule an async function to be executed respecting rate limits.
   *
   * @param fn - Async function to execute
   * @returns Promise resolving to the function result
   */
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests with rate limiting.
   */
  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.minInterval) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }

      const task = this.queue.shift();
      this.lastRequestTime = Date.now();

      if (task) {
        await task();
      }
    }

    this.processing = false;
  }
}
