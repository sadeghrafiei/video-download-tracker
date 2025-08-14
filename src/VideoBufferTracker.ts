import type {
  VideoBufferTrackerConfig,
  BufferData,
  TrackingStats,
  BufferedRange,
  VideoInfo,
} from "./types";
import { ValidationUtils } from "./utils/validation";
import { DefaultLogger } from "./utils/logger";
import { VideoSizeService } from "./services/VideoSizeService";
import { BufferCalculationService } from "./services/BufferCalculationService";
import { AnalyticsService } from "./services/AnalyticsService";
import { EventManager } from "./core/EventManager";

/**
 * VideoBufferTracker - Comprehensive video buffering tracking utility
 *
 * This class provides real-time video buffering progress tracking and analytics.
 * It monitors video buffering progress, calculates downloaded bytes, and provides
 * flexible analytics integration.
 *
 * @example
 * ```typescript
 * const tracker = new VideoBufferTracker({
 *   onBufferData: (data) => {
 *     console.log('Buffer data:', data);
 *   }
 * });
 *
 * await tracker.setupVideoTracking(videoElement, videoUrl);
 * ```
 */
export class VideoBufferTracker {
  private config: VideoBufferTrackerConfig & {
    debug: boolean;
    progressThrottleMs: number;
    finalProbeThreshold: number;
    rangeMergeEpsilon: number;
  };
  private logger: DefaultLogger;
  private videoSizeService: VideoSizeService;
  private bufferService: BufferCalculationService;
  private analyticsService: AnalyticsService;
  private eventManager?: EventManager;

  // State
  private videoInfo?: VideoInfo;
  private estimatedDownloadedBytes = 0;
  private submittedBytesBaseline = 0;
  private hasSubmittedFullDownload = false;
  private lastProbedEnd = -1;
  private isTracking = false;

  constructor(config: VideoBufferTrackerConfig = {}) {
    // Validate configuration
    ValidationUtils.validateConfig(config);

    // Set default configuration
    this.config = {
      trafficEventUrl: config.trafficEventUrl || undefined,
      onBufferData: config.onBufferData || undefined,
      debug: config.debug ?? false,
      progressThrottleMs: config.progressThrottleMs ?? 250,
      finalProbeThreshold: config.finalProbeThreshold ?? 0.2,
      rangeMergeEpsilon: config.rangeMergeEpsilon ?? 0.5,
    };

    // Initialize services
    this.logger = new DefaultLogger(this.config.debug);
    this.videoSizeService = new VideoSizeService(this.logger);
    this.bufferService = new BufferCalculationService(this.logger);
    this.analyticsService = new AnalyticsService(
      this.logger,
      this.config.trafficEventUrl
    );

    this.logger.info("VideoBufferTracker initialized");
  }

  /**
   * Setup video tracking for a video element
   *
   * @param video - The HTML video element to track
   * @param videoUrl - The URL of the video
   * @throws {Error} If video element or URL is invalid
   */
  async setupVideoTracking(
    video: HTMLVideoElement,
    videoUrl: string
  ): Promise<void> {
    try {
      // Validate inputs
      ValidationUtils.validateVideoElement(video);
      ValidationUtils.validateVideoUrl(videoUrl);

      this.logger.info("Setting up video tracking", { videoUrl });

      // Get video size
      const totalSize = await this.videoSizeService.getVideoSize(videoUrl);

      // Store video info
      this.videoInfo = {
        url: videoUrl,
        duration: video.duration || 0,
        totalSize,
        element: video,
      };

      // Setup event handlers
      this.setupEventHandlers();

      this.isTracking = true;
      this.logger.info("Video tracking setup complete");
    } catch (error) {
      this.logger.error("Failed to setup video tracking:", error);
      throw error;
    }
  }

  /**
   * Get current buffer data
   */
  getBufferData(): BufferData {
    return {
      file_size: Math.round(this.estimatedDownloadedBytes),
      video_url: this.videoInfo?.url,
      timestamp: Date.now(),
    };
  }

  /**
   * Get current tracking statistics
   */
  getTrackingStats(): TrackingStats {
    return {
      totalSize: this.videoInfo?.totalSize ?? 0,
      estimatedDownloadedBytes: this.estimatedDownloadedBytes,
      hasSubmittedFullDownload: this.hasSubmittedFullDownload,
      bufferedRanges: this.videoInfo
        ? this.bufferService.getBufferedRanges(this.videoInfo.element)
        : [],
      duration: this.videoInfo?.duration ?? 0,
    };
  }

  /**
   * Stop tracking and cleanup resources
   */
  destroy(): void {
    try {
      this.logger.info("Destroying VideoBufferTracker");

      // Detach event listeners
      if (this.eventManager) {
        this.eventManager.detach();
      }

      // Clear state
      this.isTracking = false;
      this.videoInfo = undefined;
      this.estimatedDownloadedBytes = 0;
      this.submittedBytesBaseline = 0;
      this.hasSubmittedFullDownload = false;
      this.lastProbedEnd = -1;

      this.logger.info("VideoBufferTracker destroyed");
    } catch (error) {
      this.logger.error("Error destroying VideoBufferTracker:", error);
    }
  }

  /**
   * Check if tracking is active
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Setup event handlers and attach listeners
   */
  private setupEventHandlers(): void {
    if (!this.videoInfo) {
      throw new Error("Video info not available");
    }

    const handlers = {
      onProgress: this.createProgressHandler(),
      onTimeUpdate: this.createTimeUpdateHandler(),
      onFinalize: this.createFinalizeHandler(),
    };

    this.eventManager = new EventManager(
      this.logger,
      this.videoInfo.element,
      handlers
    );
    this.eventManager.attach();
  }

  /**
   * Create progress event handler
   */
  private createProgressHandler() {
    return async (): Promise<void> => {
      if (
        !this.videoInfo ||
        !this.isTracking ||
        this.hasSubmittedFullDownload
      ) {
        return;
      }

      const { element, duration, totalSize } = this.videoInfo;

      if (!duration || !totalSize) {
        return;
      }

      const ranges = this.bufferService.getBufferedRanges(element);
      if (ranges.length === 0) {
        return;
      }

      // Check if fully downloaded
      if (
        this.bufferService.isFullyDownloaded(
          ranges,
          duration,
          this.config.rangeMergeEpsilon
        )
      ) {
        this.handleFullDownload();
        return;
      }

      // Update progress estimate
      await this.updateProgressEstimate(ranges);
    };
  }

  /**
   * Create time update event handler
   */
  private createTimeUpdateHandler() {
    return async (): Promise<void> => {
      if (
        !this.videoInfo ||
        !this.isTracking ||
        this.hasSubmittedFullDownload
      ) {
        return;
      }

      const { element, duration } = this.videoInfo;
      if (!duration || isNaN(duration)) {
        return;
      }

      const remaining = duration - element.currentTime;
      if (remaining <= this.config.finalProbeThreshold) {
        this.logger.debug("Video near end, triggering final probe");
        await this.performFinalProbe();
      }
    };
  }

  /**
   * Create finalize event handler
   */
  private createFinalizeHandler() {
    return async (): Promise<void> => {
      if (!this.isTracking || this.hasSubmittedFullDownload) {
        return;
      }

      try {
        await this.performFinalProbe();
      } catch (error) {
        this.logger.error("Error in finalize handler:", error);
      }
    };
  }

  /**
   * Update progress estimate based on buffered ranges
   */
  private async updateProgressEstimate(ranges: BufferedRange[]): Promise<void> {
    if (!this.videoInfo) return;

    const { duration, totalSize } = this.videoInfo;
    const { start, end } = ranges[ranges.length - 1];

    // Throttle updates
    if (
      this.lastProbedEnd >= 0 &&
      end - this.lastProbedEnd < this.config.progressThrottleMs / 1000
    ) {
      return;
    }

    this.lastProbedEnd = end;

    const totalBytes = this.bufferService.calculateTotalBytes(
      ranges,
      duration,
      totalSize
    );
    if (totalBytes > 0) {
      this.estimatedDownloadedBytes = totalBytes;
      this.logger.debug("Progress updated:", { totalBytes });
    }
  }

  /**
   * Handle full download completion
   */
  private handleFullDownload(): void {
    if (!this.videoInfo) return;

    this.estimatedDownloadedBytes =
      this.videoInfo.totalSize - this.submittedBytesBaseline;
    this.hasSubmittedFullDownload = true;
    this.logger.info("Full download detected");

    this.handleBufferData();
  }

  /**
   * Perform final probe to calculate total downloaded bytes
   */
  private async performFinalProbe(): Promise<void> {
    if (!this.videoInfo) return;

    const { element, duration, totalSize } = this.videoInfo;
    if (!duration || !totalSize) return;

    const ranges = this.bufferService.getBufferedRanges(element);
    if (ranges.length === 0) return;

    const totalBytes = this.bufferService.calculateTotalBytes(
      ranges,
      duration,
      totalSize
    );
    this.updateDownloadMetrics(totalBytes);
  }

  /**
   * Update download metrics and trigger analytics
   */
  private updateDownloadMetrics(totalBytes: number): void {
    const deltaBytes = Math.max(0, totalBytes - this.submittedBytesBaseline);
    this.estimatedDownloadedBytes = deltaBytes;

    if (this.videoInfo && totalBytes >= this.videoInfo.totalSize) {
      this.hasSubmittedFullDownload = true;
    }

    this.handleBufferData();
    this.submittedBytesBaseline = totalBytes;
  }

  /**
   * Handle buffer data submission
   */
  private async handleBufferData(): Promise<void> {
    if (this.estimatedDownloadedBytes <= 0) return;

    const bufferData = this.getBufferData();

    try {
      // Call user callback if provided
      if (this.config.onBufferData) {
        await this.analyticsService.callUserCallback(
          this.config.onBufferData,
          bufferData
        );
      }

      // Send to analytics URL if provided
      await this.analyticsService.sendBufferData(bufferData);

      // Reset tracking state
      this.estimatedDownloadedBytes = 0;
      this.lastProbedEnd = -1;

      this.logger.debug("Buffer data handled successfully");
    } catch (error) {
      this.logger.error("Error handling buffer data:", error);
    }
  }
}

// Export types
export type {
  VideoBufferTrackerConfig,
  BufferData,
  TrackingStats,
  BufferedRange,
} from "./types";
