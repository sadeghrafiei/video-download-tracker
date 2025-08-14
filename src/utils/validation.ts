import type { VideoBufferTrackerConfig, VideoInfo } from "../types";

/**
 * Validation utilities for VideoBufferTracker
 */
export class ValidationUtils {
  /**
   * Validate video element
   */
  static validateVideoElement(video: HTMLVideoElement): void {
    if (!video) {
      throw new Error("Video element is required");
    }

    if (!(video instanceof HTMLVideoElement)) {
      throw new Error("Element must be an HTMLVideoElement");
    }
  }

  /**
   * Validate video URL
   */
  static validateVideoUrl(url: string): void {
    if (!url || typeof url !== "string") {
      throw new Error("Video URL is required and must be a string");
    }

    try {
      new URL(url);
    } catch {
      throw new Error("Invalid video URL format");
    }
  }

  /**
   * Validate configuration
   */
  static validateConfig(config: VideoBufferTrackerConfig): void {
    if (
      config.progressThrottleMs !== undefined &&
      config.progressThrottleMs < 0
    ) {
      throw new Error("progressThrottleMs must be non-negative");
    }

    if (
      config.finalProbeThreshold !== undefined &&
      config.finalProbeThreshold < 0
    ) {
      throw new Error("finalProbeThreshold must be non-negative");
    }

    if (
      config.rangeMergeEpsilon !== undefined &&
      config.rangeMergeEpsilon < 0
    ) {
      throw new Error("rangeMergeEpsilon must be non-negative");
    }

    if (config.trafficEventUrl) {
      try {
        new URL(config.trafficEventUrl);
      } catch {
        throw new Error("Invalid trafficEventUrl format");
      }
    }
  }

  /**
   * Validate video info
   */
  static validateVideoInfo(videoInfo: VideoInfo): void {
    if (!videoInfo.url) {
      throw new Error("Video URL is required");
    }

    if (videoInfo.duration <= 0) {
      throw new Error("Video duration must be positive");
    }

    if (videoInfo.totalSize <= 0) {
      throw new Error("Video total size must be positive");
    }

    this.validateVideoElement(videoInfo.element);
  }
}
