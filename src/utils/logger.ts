import type { Logger } from "../types";

/**
 * Default logger implementation
 */
export class DefaultLogger implements Logger {
  private isDebugEnabled: boolean;

  constructor(debug = false) {
    this.isDebugEnabled = debug;
  }

  debug(message: string, ...args: any[]): void {
    if (this.isDebugEnabled) {
      console.log(`[VideoBufferTracker] DEBUG: ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    console.log(`[VideoBufferTracker] INFO: ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(`[VideoBufferTracker] WARN: ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(`[VideoBufferTracker] ERROR: ${message}`, ...args);
  }
}

/**
 * Silent logger for production use
 */
export class SilentLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}
