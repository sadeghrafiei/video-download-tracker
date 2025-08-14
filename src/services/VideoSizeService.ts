import type { Logger } from "../types";

/**
 * Service for detecting video file size
 */
export class VideoSizeService {
  private logger: Logger;
  private cache = new Map<string, number>();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Get video file size via HEAD request
   */
  async getVideoSize(videoUrl: string): Promise<number> {
    // Check cache first
    if (this.cache.has(videoUrl)) {
      this.logger.debug("Using cached video size for:", videoUrl);
      return this.cache.get(videoUrl)!;
    }

    try {
      this.logger.debug("Fetching video size for:", videoUrl);

      const response = await fetch(videoUrl, {
        method: "HEAD",
        // Add timeout
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get("Content-Length");
      if (!contentLength) {
        throw new Error("Content-Length header not found");
      }

      const size = parseInt(contentLength, 10);
      if (isNaN(size) || size <= 0) {
        throw new Error("Invalid Content-Length value");
      }

      // Cache the result
      this.cache.set(videoUrl, size);
      this.logger.debug("Video size detected:", size, "bytes");

      return size;
    } catch (error) {
      this.logger.error("Failed to get video size:", error);
      throw new Error(
        `Failed to get video size: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug("Video size cache cleared");
  }

  /**
   * Remove specific URL from cache
   */
  removeFromCache(videoUrl: string): void {
    this.cache.delete(videoUrl);
    this.logger.debug("Removed from cache:", videoUrl);
  }
}
