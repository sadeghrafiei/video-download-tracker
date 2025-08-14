import type { BufferData, Logger } from "../types";

/**
 * Service for handling analytics data submission
 */
export class AnalyticsService {
  private logger: Logger;
  private trafficEventUrl?: string;

  constructor(logger: Logger, trafficEventUrl?: string) {
    this.logger = logger;
    this.trafficEventUrl = trafficEventUrl;
  }

  /**
   * Send buffer data to analytics endpoint
   */
  async sendBufferData(bufferData: BufferData): Promise<boolean> {
    if (!this.trafficEventUrl) {
      this.logger.debug(
        "No analytics URL configured, skipping data submission"
      );
      return false;
    }

    try {
      this.logger.debug("Sending buffer data to analytics:", bufferData);

      const response = await fetch(this.trafficEventUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bufferData),
        // Add timeout
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.debug("Analytics data sent successfully");
      return true;
    } catch (error) {
      this.logger.error("Failed to send analytics data:", error);
      return false;
    }
  }

  /**
   * Call user-provided callback with buffer data
   */
  async callUserCallback(
    callback: (data: BufferData) => void | Promise<void>,
    bufferData: BufferData
  ): Promise<void> {
    try {
      this.logger.debug("Calling user callback with data:", bufferData);
      await callback(bufferData);
      this.logger.debug("User callback executed successfully");
    } catch (error) {
      this.logger.error("Error in user callback:", error);
      throw error;
    }
  }
}
