import type { EventHandler, EventHandlers, Logger } from "../types";

/**
 * Manages event listeners for video tracking
 */
export class EventManager {
  private logger: Logger;
  private eventHandlers: EventHandlers;
  private video: HTMLVideoElement;
  private isAttached = false;

  constructor(
    logger: Logger,
    video: HTMLVideoElement,
    handlers: EventHandlers
  ) {
    this.logger = logger;
    this.video = video;
    this.eventHandlers = handlers;
  }

  /**
   * Attach all event listeners
   */
  attach(): void {
    if (this.isAttached) {
      this.logger.warn("Event listeners already attached");
      return;
    }

    try {
      // Video events
      this.video.addEventListener("progress", this.eventHandlers.onProgress);
      this.video.addEventListener(
        "timeupdate",
        this.eventHandlers.onTimeUpdate
      );

      // Page events
      window.addEventListener("beforeunload", this.eventHandlers.onFinalize);
      window.addEventListener("pagehide", this.eventHandlers.onFinalize);

      // Visibility change
      document.addEventListener(
        "visibilitychange",
        this.handleVisibilityChange.bind(this)
      );

      this.isAttached = true;
      this.logger.debug("Event listeners attached successfully");
    } catch (error) {
      this.logger.error("Failed to attach event listeners:", error);
      throw error;
    }
  }

  /**
   * Detach all event listeners
   */
  detach(): void {
    if (!this.isAttached) {
      this.logger.debug("Event listeners not attached, skipping detach");
      return;
    }

    try {
      // Video events
      this.video.removeEventListener("progress", this.eventHandlers.onProgress);
      this.video.removeEventListener(
        "timeupdate",
        this.eventHandlers.onTimeUpdate
      );

      // Page events
      window.removeEventListener("beforeunload", this.eventHandlers.onFinalize);
      window.removeEventListener("pagehide", this.eventHandlers.onFinalize);

      // Visibility change
      document.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange.bind(this)
      );

      this.isAttached = false;
      this.logger.debug("Event listeners detached successfully");
    } catch (error) {
      this.logger.error("Failed to detach event listeners:", error);
    }
  }

  /**
   * Handle visibility change events
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === "hidden") {
      this.logger.debug("Page hidden, triggering finalize");
      this.eventHandlers.onFinalize();
    }
  }

  /**
   * Check if listeners are attached
   */
  areListenersAttached(): boolean {
    return this.isAttached;
  }
}
