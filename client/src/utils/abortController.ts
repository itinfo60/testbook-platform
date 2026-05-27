// Global AbortController for cancelling pending API calls across the app

class GlobalAbortController {
  private controller: AbortController | null = null;

  /**
   * Returns a fresh AbortSignal and resets the internal controller.
   * Call this before each fetch to ensure it can be aborted.
   */
  getSignal(): AbortSignal {
    // abort any previous requests
    if (this.controller) {
      this.controller.abort();
    }
    this.controller = new AbortController();
    return this.controller.signal;
  }

  /** Abort all in‑flight requests. */
  abortAll(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}

// Export a singleton instance
export const globalAbortController = new GlobalAbortController();

/** Helper to create a signal for a specific fetch call.
 *  Usage: const signal = createSignal(); fetch(url, { signal })
 */
export const createSignal = (): AbortSignal => globalAbortController.getSignal();
