/**
 * Rate Limiter for External API Calls
 *
 * Implements a token bucket algorithm to prevent hitting API rate limits.
 * Each API service can have its own rate limiter instance with custom limits.
 */

interface RateLimiterConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Name for logging purposes */
  name: string;
}

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private config: RateLimiterConfig;
  private queue: QueuedRequest<unknown>[] = [];
  private processing = false;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.tokens = config.maxRequests;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(
      (elapsed / this.config.windowMs) * this.config.maxRequests
    );

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.config.maxRequests, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Check if a request can be made immediately
   */
  private canMakeRequest(): boolean {
    this.refillTokens();
    return this.tokens > 0;
  }

  /**
   * Calculate wait time until next available token
   */
  private getWaitTime(): number {
    if (this.tokens > 0) return 0;
    const tokenRefillTime = this.config.windowMs / this.config.maxRequests;
    const timeSinceLastRefill = Date.now() - this.lastRefill;
    return Math.max(0, tokenRefillTime - timeSinceLastRefill);
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      if (!this.canMakeRequest()) {
        const waitTime = this.getWaitTime();
        await new Promise(resolve => setTimeout(resolve, waitTime + 10));
        continue;
      }

      const request = this.queue.shift();
      if (!request) continue;

      this.tokens--;

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error as Error);
      }
    }

    this.processing = false;
  }

  /**
   * Execute a rate-limited request
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processQueue();
    });
  }

  /**
   * Get current rate limiter status
   */
  getStatus(): { tokens: number; queueLength: number; name: string } {
    this.refillTokens();
    return {
      tokens: this.tokens,
      queueLength: this.queue.length,
      name: this.config.name,
    };
  }
}

/**
 * Pre-configured rate limiters for external APIs
 */

// Bungie API: 25 requests per second, with burst allowance
// https://bungie-net.github.io/multi/index.html
export const bungieRateLimiter = new RateLimiter({
  name: "Bungie API",
  maxRequests: 25,
  windowMs: 1000, // 1 second
});

// ExtraHop API: 120 requests per minute (conservative estimate)
// Adjust based on actual appliance limits
export const extrahopRateLimiter = new RateLimiter({
  name: "ExtraHop API",
  maxRequests: 100,
  windowMs: 60000, // 1 minute
});

/**
 * Decorator function for rate-limiting async methods
 */
export function withRateLimit<T>(
  limiter: RateLimiter,
  fn: () => Promise<T>
): Promise<T> {
  return limiter.execute(fn);
}

/**
 * Create a rate-limited version of an async function
 */
export function rateLimited<TArgs extends unknown[], TResult>(
  limiter: RateLimiter,
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => limiter.execute(() => fn(...args));
}
