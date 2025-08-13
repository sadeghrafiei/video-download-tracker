/**
 * VideoBufferTracker - Global Video Download Tracking Utility
 *
 * OVERVIEW:
 * This class provides comprehensive video download tracking and analytics functionality.
 * It monitors video buffering progress, calculates downloaded bytes, and sends analytics
 * data to track user video consumption patterns.
 *
 * PURPOSE:
 * - Track video download progress in real-time
 * - Calculate actual bytes downloaded based on buffered ranges
 * - Send analytics data for video consumption tracking
 * - Handle multiple video tracking scenarios
 * - Optimize network usage by using mathematical calculations instead of HEAD requests
 *
 * CORE FUNCTIONALITY:
 *
 * 1. VIDEO SIZE DETECTION:
 *    - Uses HEAD request to get total video file size
 *    - Stores size for mathematical byte calculations
 *
 * 2. BUFFERING TRACKING:
 *    - Monitors video.buffered ranges to track download progress
 *    - Merges overlapping/adjacent buffered ranges
 *    - Detects when video is fully downloaded
 *
 * 3. BYTE CALCULATION:
 *    - Converts time ranges to byte ranges mathematically
 *    - Calculates downloaded bytes without additional network requests
 *    - Prevents duplicate processing of overlapping ranges
 *
 * 4. ANALYTICS INTEGRATION:
 *    - Sends download size data to configurable analytics endpoints
 *    - Tracks publisher domain and video URL
 *    - Prevents duplicate analytics submissions
 *
 * 5. EVENT HANDLING:
 *    - Progress events: Track buffering progress
 *    - Time update events: Detect video end
 *    - Page events: Handle page unload/visibility changes
 *
 * LOGIC FLOW:
 *
 * 1. SETUP PHASE:
 *    setupVideoTracking() → ensureTotalSize() → setupEventListeners()
 *    - Initialize video element and URL references
 *    - Get total file size via HEAD request
 *    - Attach event listeners for tracking
 *
 * 2. PROGRESS TRACKING:
 *    progress event → createProgressHandler() → updateProgressEstimate()
 *    - Monitor buffered ranges on progress events
 *    - Calculate downloaded bytes for new ranges
 *    - Update tracking statistics
 *
 * 3. FINAL PROBE:
 *    timeupdate event → createTimeUpdateHandler() → performFinalProbe()
 *    - Trigger when video is near end (≤0.2s remaining)
 *    - Calculate total downloaded bytes across all ranges
 *    - Send final analytics data
 *
 * 4. ANALYTICS SUBMISSION:
 *    logFinalDownloadSize() → sendDownloadSizeToAnalytics()
 *    - Send download data to configured endpoint
 *    - Reset tracking state after successful submission
 *    - Handle errors gracefully
 * USAGE:
 *
 * ```
 * const tracker = new VideoBufferTracker({
 *     trafficEventUrl: 'https://analytics.example.com/events',
 *     publisher: 'example.com'
 * });
 *
 * await tracker.setupVideoTracking(videoElement, videoUrl);
 * ```
 *
 */

export interface VideoBufferTrackerConfig {
  trafficEventUrl?: string;
  publisher?: string;
  onBufferData?: (data: BufferData) => void | Promise<void>;
}

export interface BufferedRange {
  start: number;
  end: number;
}

export interface BufferData {
  file_size: number;
  publisher: string;
  video_serve_url: string;
}

export class VideoBufferTracker {
  private totalSize = 0;
  private estimatedDownloadedBytes = 0;
  private submittedBytesBaseline = 0;
  private hasSubmittedFullDownload = false;
  private lastProbedEnd = -1;
  private config: VideoBufferTrackerConfig;
  private currentVideoUrl = "";
  private currentVideoElement: HTMLVideoElement | null = null;

  constructor(config: VideoBufferTrackerConfig = {}) {
    this.config = {
      publisher: window.location.hostname,
      ...config,
    };
  }

  /**
   * Setup video tracking for a video element
   * @param video - The HTML video element to track
   * @param videoUrl - The URL of the video
   */
  async setupVideoTracking(
    video: HTMLVideoElement,
    videoUrl: string
  ): Promise<void> {
    if (!video || !videoUrl) return;

    this.currentVideoUrl = videoUrl;
    this.currentVideoElement = video;

    // Initialize total size
    await this.ensureTotalSize(videoUrl);

    // Setup event listeners
    this.setupEventListeners(video, videoUrl);
  }

  /**
   * Get the total size of the video file
   */
  private async ensureTotalSize(videoUrl: string): Promise<void> {
    if (this.totalSize > 0) return;

    try {
      const headResp = await fetch(videoUrl, { method: "HEAD" });
      const len = headResp.headers.get("Content-Length");
      if (len) this.totalSize = parseInt(len);
    } catch (error) {
      console.error("Failed to get video total size:", error);
    }
  }

  /**
   * Setup all event listeners for video tracking
   */
  private setupEventListeners(video: HTMLVideoElement, videoUrl: string): void {
    // Setup progress tracking
    const onProgress = this.createProgressHandler();

    // Setup final probe handler
    const finalizeProbe = this.createFinalizeProbeHandler(videoUrl);

    // Setup time update handler
    const onTimeUpdateNearEnd = this.createTimeUpdateHandler(finalizeProbe);

    // Attach all listeners
    this.attachEventListeners(
      video,
      onProgress,
      finalizeProbe,
      onTimeUpdateNearEnd
    );
  }

  /**
   * Create progress handler for tracking video buffering
   */
  private createProgressHandler() {
    return async (): Promise<void> => {
      if (!this.currentVideoElement) return;

      if (
        !this.currentVideoElement.duration ||
        !this.totalSize ||
        this.hasSubmittedFullDownload
      )
        return;

      const ranges = this.getBufferedRanges();
      if (ranges.length === 0) return;

      if (this.isFullyDownloaded(ranges)) {
        this.handleFullDownload();
        return;
      }

      await this.updateProgressEstimate(ranges);
    };
  }

  /**
   * Get buffered ranges from video element
   */
  private getBufferedRanges(): BufferedRange[] {
    if (!this.currentVideoElement) return [];

    const out: BufferedRange[] = [];
    const ranges = this.currentVideoElement.buffered;
    if (!ranges) return out;

    for (let i = 0; i < ranges.length; i++) {
      try {
        out.push({ start: ranges.start(i), end: ranges.end(i) });
      } catch {}
    }
    return out;
  }

  /**
   * Check if video is fully downloaded
   */
  private isFullyDownloaded(ranges: BufferedRange[]): boolean {
    if (!this.currentVideoElement) return false;

    const epsilon = Math.max(0.5, this.currentVideoElement.duration * 0.01);
    const merged = this.mergeRanges(ranges, epsilon);

    let covered = 0;
    for (const r of merged) {
      covered += Math.max(0, r.end - r.start);
    }

    return covered >= this.currentVideoElement.duration - epsilon;
  }

  /**
   * Merge overlapping or adjacent ranges
   */
  private mergeRanges(
    ranges: BufferedRange[],
    epsilon: number
  ): BufferedRange[] {
    const normalized = [...ranges].sort((a, b) => a.start - b.start);
    const merged: BufferedRange[] = [];

    for (const r of normalized) {
      if (merged.length === 0) {
        merged.push(r);
        continue;
      }

      const last = merged[merged.length - 1];
      if (r.start - last.end <= epsilon) {
        last.end = Math.max(last.end, r.end);
      } else {
        merged.push(r);
      }
    }

    return merged;
  }

  /**
   * Handle full download completion
   */
  private handleFullDownload(): void {
    this.estimatedDownloadedBytes =
      this.totalSize - this.submittedBytesBaseline;
    this.hasSubmittedFullDownload = true;
    this.logFinalDownloadSize();
  }

  /**
   * Update progress estimate based on buffered ranges
   */
  private async updateProgressEstimate(ranges: BufferedRange[]): Promise<void> {
    const { start, end } = ranges[ranges.length - 1];

    if (this.lastProbedEnd >= 0 && end - this.lastProbedEnd < 0.25) return;

    this.lastProbedEnd = end;

    const approx = this.timeToByteRange(
      start,
      end,
      this.currentVideoElement?.duration || 0,
      this.totalSize
    );
    if (!approx) return;

    // Calculate bytes mathematically instead of making HEAD request
    const bytes = approx.end - approx.start + 1;
    if (bytes > 0) {
      this.estimatedDownloadedBytes = bytes;
    }
  }

  /**
   * Convert time range to byte range
   */
  private timeToByteRange(
    startTime: number,
    endTime: number,
    duration: number,
    totalSize: number
  ): { start: number; end: number } | null {
    if (!duration || !totalSize) return null;

    const start = Math.max(0, Math.floor((startTime / duration) * totalSize));
    const end = Math.min(
      totalSize - 1,
      Math.floor((endTime / duration) * totalSize) - 1
    );

    return end <= start ? null : { start, end };
  }

  /**
   * Create finalize probe handler
   */
  private createFinalizeProbeHandler(videoUrl: string) {
    return async (): Promise<void> => {
      if (this.hasSubmittedFullDownload) return;

      try {
        await this.performFinalProbe(videoUrl);
      } catch (error) {
        console.error("Error finalizing probe:", error);
      }
    };
  }

  /**
   * Perform final probe to calculate total downloaded bytes
   */
  private async performFinalProbe(videoUrl: string): Promise<void> {
    await this.ensureTotalSize(videoUrl);

    if (!this.currentVideoElement?.duration || !this.totalSize) return;

    const ranges = this.getBufferedRanges();
    if (ranges.length === 0) return;

    const totalBytes = await this.calculateTotalBytes(ranges);
    this.updateDownloadMetrics(totalBytes);
  }

  /**
   * Calculate total bytes downloaded based on buffered ranges
   */
  private async calculateTotalBytes(ranges: BufferedRange[]): Promise<number> {
    let totalBytes = 0;

    for (const r of ranges) {
      const approx = this.timeToByteRange(
        r.start,
        r.end,
        this.currentVideoElement?.duration || 0,
        this.totalSize
      );
      if (!approx) continue;

      // Calculate bytes mathematically instead of making HEAD request
      const bytes = approx.end - approx.start + 1;
      totalBytes += bytes;
    }

    return totalBytes;
  }

  /**
   * Update download metrics and trigger analytics
   */
  private updateDownloadMetrics(totalBytes: number): void {
    const deltaBytes = Math.max(0, totalBytes - this.submittedBytesBaseline);
    this.estimatedDownloadedBytes = deltaBytes;

    if (this.totalSize > 0 && totalBytes >= this.totalSize) {
      this.hasSubmittedFullDownload = true;
    }

    this.logFinalDownloadSize();
    this.submittedBytesBaseline = totalBytes;
  }

  /**
   * Create time update handler for end-of-video detection
   */
  private createTimeUpdateHandler(finalizeProbe: () => Promise<void>) {
    return async (): Promise<void> => {
      if (this.hasSubmittedFullDownload) return;

      const video = this.currentVideoElement;
      if (!video?.duration || isNaN(video.duration)) return;

      const remaining = video.duration - video.currentTime;
      if (remaining <= 0.2) {
        await finalizeProbe();
      }
    };
  }

  /**
   * Attach all event listeners to video and window
   */
  private attachEventListeners(
    video: HTMLVideoElement,
    onProgress: () => Promise<void>,
    finalizeProbe: () => Promise<void>,
    onTimeUpdateNearEnd: () => Promise<void>
  ): void {
    video.addEventListener("progress", onProgress);
    video.addEventListener("timeupdate", onTimeUpdateNearEnd);

    window.addEventListener("beforeunload", finalizeProbe);
    window.addEventListener("pagehide", finalizeProbe);

    document.addEventListener("visibilitychange", () => {
      if (
        document.visibilityState === "hidden" &&
        !this.hasSubmittedFullDownload
      ) {
        finalizeProbe();
      }
    });
  }

  /**
   * Log final download size and handle analytics
   */
  private logFinalDownloadSize(): void {
    if (this.estimatedDownloadedBytes > 0) {
      this.handleBufferData();
    }
  }

  /**
   * Handle buffer data - either call callback or send to analytics URL
   */
  private async handleBufferData(): Promise<void> {
    const bufferData = this.getBufferData();

    // Call the callback if provided
    if (this.config.onBufferData) {
      try {
        await this.config.onBufferData(bufferData);
      } catch (error) {
        console.error("Error in onBufferData callback:", error);
      }
    }

    // Send to analytics URL if provided (legacy support)
    if (this.config.trafficEventUrl) {
      await this.sendBufferDataToAnalytics(bufferData);
    }

    // Reset tracking state after successful handling
    this.estimatedDownloadedBytes = 0;
    this.lastProbedEnd = -1;
  }

  /**
   * Get current buffer data
   */
  getBufferData(): BufferData {
    return {
      file_size: parseInt(this.estimatedDownloadedBytes.toFixed(0)),
      publisher: this.config.publisher || window.location.hostname,
      video_serve_url:
        this.currentVideoElement?.src || this.currentVideoUrl || "",
    };
  }

  /**
   * Send buffer data to analytics URL (legacy method)
   */
  private async sendBufferDataToAnalytics(
    bufferData: BufferData
  ): Promise<void> {
    try {
      const response = await fetch(this.config.trafficEventUrl!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bufferData),
      });

      if (!response.ok) {
        console.error(
          "Failed to send traffic data:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error sending traffic data:", error);
    }
  }

  /**
   * Get current tracking statistics
   */
  getTrackingStats() {
    return {
      totalSize: this.totalSize,
      estimatedDownloadedBytes: this.estimatedDownloadedBytes,
      hasSubmittedFullDownload: this.hasSubmittedFullDownload,
    };
  }
}
