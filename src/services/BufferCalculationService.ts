import type { BufferedRange, Logger } from "../types";

/**
 * Service for calculating buffer-related metrics
 */
export class BufferCalculationService {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Get buffered ranges from video element
   */
  getBufferedRanges(video: HTMLVideoElement): BufferedRange[] {
    const ranges: BufferedRange[] = [];

    try {
      const buffered = video.buffered;
      if (!buffered) {
        this.logger.debug("No buffered ranges available");
        return ranges;
      }

      for (let i = 0; i < buffered.length; i++) {
        try {
          const start = buffered.start(i);
          const end = buffered.end(i);

          if (start >= 0 && end > start) {
            ranges.push({ start, end });
          }
        } catch (error) {
          this.logger.warn("Error accessing buffered range:", error);
        }
      }

      this.logger.debug("Buffered ranges:", ranges);
      return ranges;
    } catch (error) {
      this.logger.error("Error getting buffered ranges:", error);
      return ranges;
    }
  }

  /**
   * Merge overlapping or adjacent ranges
   */
  mergeRanges(ranges: BufferedRange[], epsilon: number): BufferedRange[] {
    if (ranges.length === 0) return ranges;

    const normalized = [...ranges].sort((a, b) => a.start - b.start);
    const merged: BufferedRange[] = [];

    for (const range of normalized) {
      if (merged.length === 0) {
        merged.push(range);
        continue;
      }

      const last = merged[merged.length - 1];
      if (range.start - last.end <= epsilon) {
        last.end = Math.max(last.end, range.end);
      } else {
        merged.push(range);
      }
    }

    this.logger.debug("Merged ranges:", merged);
    return merged;
  }

  /**
   * Check if video is fully downloaded
   */
  isFullyDownloaded(
    ranges: BufferedRange[],
    duration: number,
    epsilon: number
  ): boolean {
    if (ranges.length === 0 || duration <= 0) return false;

    const merged = this.mergeRanges(ranges, epsilon);
    let covered = 0;

    for (const range of merged) {
      covered += Math.max(0, range.end - range.start);
    }

    const isComplete = covered >= duration - epsilon;
    this.logger.debug("Download completion check:", {
      covered,
      duration,
      isComplete,
    });

    return isComplete;
  }

  /**
   * Convert time range to byte range
   */
  timeToByteRange(
    startTime: number,
    endTime: number,
    duration: number,
    totalSize: number
  ): { start: number; end: number } | null {
    if (!duration || !totalSize || startTime < 0 || endTime <= startTime) {
      return null;
    }

    const start = Math.max(0, Math.floor((startTime / duration) * totalSize));
    const end = Math.min(
      totalSize - 1,
      Math.floor((endTime / duration) * totalSize)
    );

    if (end <= start) return null;

    return { start, end };
  }

  /**
   * Calculate total bytes from buffered ranges
   */
  calculateTotalBytes(
    ranges: BufferedRange[],
    duration: number,
    totalSize: number
  ): number {
    let totalBytes = 0;

    for (const range of ranges) {
      const byteRange = this.timeToByteRange(
        range.start,
        range.end,
        duration,
        totalSize
      );
      if (byteRange) {
        totalBytes += byteRange.end - byteRange.start + 1;
      }
    }

    this.logger.debug("Calculated total bytes:", totalBytes);
    return totalBytes;
  }
}
