# 🎬 Video Buffer Tracker

[![npm version](https://badge.fury.io/js/video-buffer-tracker.svg)](https://badge.fury.io/js/video-buffer-tracker)
[![npm downloads](https://img.shields.io/npm/dm/video-buffer-tracker.svg)](https://www.npmjs.com/package/video-buffer-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **Professional Video Buffering Analytics & Tracking Library** - Monitor video buffering progress, track streaming performance, and analyze user viewing experience in real-time.

## 🚀 Features

- **Real-time Video Buffering Tracking** - Monitor buffering progress as users watch videos
- **Advanced Analytics Integration** - Send buffering data to your analytics platform
- **Performance Monitoring** - Track video streaming performance and user experience
- **Memory Efficient** - Optimized for production with minimal bundle size (32KB)
- **TypeScript Support** - Full type safety and IntelliSense support
- **Modular Architecture** - Clean, maintainable codebase with focused services
- **Cross-browser Compatible** - Works with all modern browsers
- **Zero Dependencies** - Lightweight with only tslib as peer dependency

## 📦 Installation

```bash
npm install video-buffer-tracker
```

```bash
yarn add video-buffer-tracker
```

```bash
pnpm add video-buffer-tracker
```

## 🎯 Quick Start

```javascript
import { VideoBufferTracker } from "video-buffer-tracker";

// Create tracker instance
const tracker = new VideoBufferTracker({
  debug: true,
  onBufferData: (data) => {
    console.log("Buffering data:", data);
    // Send to your analytics service
    analytics.track("video_buffering", data);
  },
});

// Setup tracking for video element
const video = document.querySelector("video");
await tracker.setupVideoTracking(video, video.src);

// Get current buffering data
const bufferData = tracker.getBufferData();
console.log("Current buffer:", bufferData);
```

## 🔧 API Reference

### VideoBufferTracker

The main class for video buffering tracking and analytics.

#### Constructor Options

```typescript
interface VideoBufferTrackerConfig {
  /** Enable debug logging */
  debug?: boolean;

  /** Minimum time between progress updates (milliseconds) */
  progressThrottleMs?: number;

  /** Time remaining to trigger final probe (seconds) */
  finalProbeThreshold?: number;

  /** Epsilon for range merging (seconds) */
  rangeMergeEpsilon?: number;

  /** Legacy: URL to send analytics data */
  trafficEventUrl?: string;

  /** Callback function for buffer data */
  onBufferData?: (data: BufferData) => void | Promise<void>;
}
```

#### Methods

| Method                                | Description                         |
| ------------------------------------- | ----------------------------------- |
| `setupVideoTracking(video, videoUrl)` | Setup tracking for a video element  |
| `getBufferData()`                     | Get current buffer data             |
| `getTrackingStats()`                  | Get current tracking statistics     |
| `destroy()`                           | Stop tracking and cleanup resources |
| `isTrackingActive()`                  | Check if tracking is active         |

## 📊 Data Structure

### BufferData

```typescript
interface BufferData {
  file_size: number; // Total buffered bytes
  buffered_ranges: Array<{
    // Buffered time ranges
    start: number;
    end: number;
  }>;
  duration: number; // Video duration in seconds
  current_time: number; // Current playback time
  is_complete: boolean; // Whether video is fully buffered
}
```

## 🔧 Usage Examples

### Basic Video Tracking

```javascript
import { VideoBufferTracker } from "video-buffer-tracker";

const tracker = new VideoBufferTracker();
const video = document.querySelector("video");

await tracker.setupVideoTracking(video, video.src);

// Monitor buffering progress
setInterval(() => {
  const data = tracker.getBufferData();
  console.log(`Buffered: ${data.file_size} bytes`);
}, 1000);
```

### Analytics Integration

```javascript
const tracker = new VideoBufferTracker({
  onBufferData: (data) => {
    // Send to Google Analytics
    gtag("event", "video_buffering", {
      buffered_bytes: data.file_size,
      buffered_percent: (data.file_size / totalSize) * 100,
      video_duration: data.duration,
    });

    // Send to custom analytics
    fetch("/api/analytics/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
});
```

### Performance Monitoring

```javascript
const tracker = new VideoBufferTracker({
  debug: true,
  progressThrottleMs: 500,
  finalProbeThreshold: 0.5,
});

// Track performance metrics
tracker.onBufferData = (data) => {
  const stats = tracker.getTrackingStats();

  performance.mark("video-buffer-update");
  performance.measure(
    "buffer-calculation",
    "video-buffer-start",
    "video-buffer-update"
  );

  console.log("Performance:", performance.getEntriesByType("measure"));
};
```

### Advanced Configuration

```javascript
const tracker = new VideoBufferTracker({
  debug: false,
  progressThrottleMs: 250, // Update every 250ms
  finalProbeThreshold: 0.2, // Final check at 0.2s remaining
  rangeMergeEpsilon: 0.5, // Merge ranges within 0.5s
  trafficEventUrl: "https://api.example.com/analytics",
  onBufferData: (data) => {
    // Custom analytics logic
    if (data.is_complete) {
      console.log("Video fully buffered!");
    }
  },
});
```

## 🏗️ Architecture

The library uses a modular architecture with focused services:

- **VideoSizeService** - Handles video file size detection with caching
- **BufferCalculationService** - Manages buffer range calculations and merging
- **AnalyticsService** - Handles analytics submission and callback execution
- **EventManager** - Manages event listeners and cleanup
- **ValidationUtils** - Input validation and error handling
- **Logger** - Configurable logging system

## 🔍 Use Cases

### Video Streaming Platforms

- Monitor buffering performance across different video qualities
- Track user experience and identify streaming issues
- Optimize CDN delivery based on buffering patterns

### E-learning Applications

- Track video completion rates and engagement
- Monitor student viewing behavior
- Identify technical issues affecting learning

### Media Analytics

- Measure video performance metrics
- Track user engagement patterns
- Optimize content delivery

### Performance Monitoring

- Real-time video streaming analytics
- User experience monitoring
- Technical issue detection

## 🚀 Performance

- **Bundle Size**: 32KB (minified and optimized)
- **Memory Usage**: Minimal with proper cleanup
- **CPU Impact**: Low with configurable throttling
- **Network**: Efficient with caching and timeouts

## 🔧 Development

### Building

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
# Open test.html in browser
npm run test
```

## 📈 Migration from v1.x

The v2.0.0 release includes breaking changes for improved architecture:

```javascript
// v1.x
const tracker = new VideoDownloadTracker({
  trafficEventUrl: "https://api.example.com/analytics",
});

// v2.0.0
const tracker = new VideoBufferTracker({
  onBufferData: (data) => {
    // Send to analytics
    fetch("https://api.example.com/analytics", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Related Packages

- [video.js](https://github.com/videojs/video.js) - HTML5 video player
- [plyr](https://github.com/sampotts/plyr) - Simple HTML5 media player
- [shaka-player](https://github.com/shaka-project/shaka-player) - DASH/HLS player

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/sadeghrafiei/video-download-tracker/issues)
- **Documentation**: [GitHub Wiki](https://github.com/sadeghrafiei/video-download-tracker/wiki)
- **Email**: sadeghrafiei80@gmail.com

---

**Made with ❤️ for the video streaming community**
