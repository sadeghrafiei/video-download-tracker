/**
 * Core types and interfaces for VideoBufferTracker
 */

export interface VideoBufferTrackerConfig {
  /** Legacy: URL to send analytics data */
  trafficEventUrl?: string;
  /** Callback function for buffer data */
  onBufferData?: (data: BufferData) => void | Promise<void>;
  /** Enable debug logging */
  debug?: boolean;
  /** Minimum time between progress updates (milliseconds) */
  progressThrottleMs?: number;
  /** Time remaining to trigger final probe (seconds) */
  finalProbeThreshold?: number;
  /** Epsilon for range merging (seconds) */
  rangeMergeEpsilon?: number;
}

export interface BufferedRange {
  start: number;
  end: number;
}

export interface BufferData {
  /** Estimated bytes buffered */
  file_size: number;
  /** Video URL */
  video_url?: string;
  /** Timestamp when data was collected */
  timestamp?: number;
}

export interface TrackingStats {
  /** Total video file size in bytes */
  totalSize: number;
  /** Estimated downloaded bytes */
  estimatedDownloadedBytes: number;
  /** Whether full download has been submitted */
  hasSubmittedFullDownload: boolean;
  /** Current buffered ranges */
  bufferedRanges: BufferedRange[];
  /** Video duration in seconds */
  duration: number;
}

export interface VideoInfo {
  /** Video URL */
  url: string;
  /** Video duration in seconds */
  duration: number;
  /** Total file size in bytes */
  totalSize: number;
  /** Video element */
  element: HTMLVideoElement;
}

export type EventHandler = () => void | Promise<void>;

export interface EventHandlers {
  onProgress: EventHandler;
  onTimeUpdate: EventHandler;
  onFinalize: EventHandler;
}

export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}
