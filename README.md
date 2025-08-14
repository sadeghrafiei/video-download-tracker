# Video Buffer Tracker

A comprehensive, production-ready video buffering tracking utility for monitoring video buffering progress and analytics.

## 🚀 Features

- **Real-time Tracking**: Monitor video buffering progress in real-time
- **Accurate Calculations**: Calculate actual bytes buffered based on buffered ranges
- **Flexible Analytics**: Multiple ways to handle analytics data
- **Production Ready**: Comprehensive error handling, validation, and logging
- **Memory Safe**: Proper cleanup and event listener management
- **TypeScript Support**: Full TypeScript support with comprehensive types
- **Configurable**: Extensive configuration options for different use cases

## 📦 Installation

```bash
npm install video-buffer-tracker
```

## 🎯 Quick Start

### Basic Usage

```javascript
import { VideoBufferTracker } from "video-buffer-tracker";

const tracker = new VideoBufferTracker({
  onBufferData: (data) => {
    console.log("Buffer data:", data);
    // Send to your analytics service
  },
});

await tracker.setupVideoTracking(videoElement, videoUrl);
```

### Advanced Configuration

```javascript
import { VideoBufferTracker } from "video-buffer-tracker";

const tracker = new VideoBufferTracker({
  debug: true, // Enable debug logging
  progressThrottleMs: 500, // Update every 500ms
  finalProbeThreshold: 0.5, // Trigger final probe 0.5s before end
  onBufferData: async (data) => {
    await sendToAnalytics(data);
  },
});

await tracker.setupVideoTracking(videoElement, videoUrl);
```

## 📚 API Reference

### Configuration

```typescript
interface VideoBufferTrackerConfig {
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
```

### Data Types

```typescript
interface BufferData {
  /** Estimated bytes buffered */
  file_size: number;
  /** Video URL */
  video_url?: string;
  /** Timestamp when data was collected */
  timestamp?: number;
}

interface TrackingStats {
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
```

### Methods

| Method                                | Description                         |
| ------------------------------------- | ----------------------------------- |
| `setupVideoTracking(video, videoUrl)` | Setup tracking for a video element  |
| `getBufferData()`                     | Get current buffer data             |
| `getTrackingStats()`                  | Get current tracking statistics     |
| `destroy()`                           | Stop tracking and cleanup resources |
| `isTrackingActive()`                  | Check if tracking is active         |

## 🔧 Usage Examples

### Callback-based Analytics

```javascript
const tracker = new VideoBufferTracker({
  onBufferData: (data) => {
    // Send to your analytics service
    analytics.track("video_buffer", data);
  },
});
```

### Legacy URL-based Analytics

```javascript
const tracker = new VideoBufferTracker({
  trafficEventUrl: "https://analytics.example.com/events",
});
```

### Manual Data Retrieval

```javascript
const tracker = new VideoBufferTracker();

// Get data when needed
const bufferData = tracker.getBufferData();
const stats = tracker.getTrackingStats();
```

### Debug Mode

```javascript
const tracker = new VideoBufferTracker({
  debug: true, // Enables detailed logging
});
```

## 🏗️ Architecture

The package is built with a modular, service-oriented architecture:

- **VideoBufferTracker**: Main class that orchestrates all functionality
- **VideoSizeService**: Handles video file size detection
- **BufferCalculationService**: Manages buffer calculations and range merging
- **AnalyticsService**: Handles analytics data submission
- **EventManager**: Manages event listeners and cleanup
- **ValidationUtils**: Input validation and error checking
- **Logger**: Configurable logging system

## 🔍 Error Handling

The package includes comprehensive error handling:

- **Input Validation**: All inputs are validated before processing
- **Network Errors**: Graceful handling of network failures
- **Video Errors**: Proper handling of video element errors
- **Analytics Errors**: Non-blocking analytics submission
- **Memory Leaks**: Proper cleanup of event listeners

## 🧪 Testing

```javascript
// Test the package
const tracker = new VideoBufferTracker({
  debug: true,
  onBufferData: (data) => {
    console.log("Test data:", data);
  },
});

// Setup tracking
await tracker.setupVideoTracking(videoElement, videoUrl);

// Check if tracking is active
console.log("Tracking active:", tracker.isTrackingActive());

// Get current data
const data = tracker.getBufferData();
const stats = tracker.getTrackingStats();

// Cleanup
tracker.destroy();
```

## 🔄 Migration from v1.x

The v2.0 release is fully backward compatible with v1.x APIs. Key improvements:

- **Better Error Handling**: More robust error handling and validation
- **Improved Logging**: Configurable logging system
- **Memory Safety**: Proper cleanup and event listener management
- **Type Safety**: Enhanced TypeScript support
- **Performance**: Optimized calculations and reduced memory usage

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## 📈 Changelog

### v2.0.0

- Complete refactor with modular architecture
- Enhanced error handling and validation
- Configurable logging system
- Memory leak prevention
- Improved TypeScript support
- Backward compatibility maintained
