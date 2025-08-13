# Video Buffer Tracker

A comprehensive video buffering tracking utility for monitoring video buffering progress and analytics.

## Features

- Track video buffering progress in real-time
- Calculate actual bytes buffered based on buffered ranges
- Send analytics data for video consumption tracking
- Handle multiple video tracking scenarios
- Optimize network usage by using mathematical calculations instead of HEAD requests

## Installation

```bash
npm install video-buffer-tracker
```

## Usage

### Basic Usage with Callback

```javascript
import { VideoBufferTracker } from "video-buffer-tracker";

const tracker = new VideoBufferTracker({
  publisher: "example.com",
  onBufferData: (data) => {
    // Handle the buffer data yourself
    console.log("Buffer data:", data);

    // Send to your own analytics endpoint
    fetch("https://your-analytics.com/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
});

// Setup tracking for a video element
await tracker.setupVideoTracking(videoElement, videoUrl);
```

### Legacy Usage with Analytics URL

```javascript
import { VideoBufferTracker } from "video-buffer-tracker";

const tracker = new VideoBufferTracker({
  trafficEventUrl: "https://analytics.example.com/events",
  publisher: "example.com",
});

await tracker.setupVideoTracking(videoElement, videoUrl);
```

### Manual Data Retrieval

```javascript
import { VideoBufferTracker } from "video-buffer-tracker";

const tracker = new VideoBufferTracker({
  publisher: "example.com",
});

await tracker.setupVideoTracking(videoElement, videoUrl);

// Get current buffer data manually
const bufferData = tracker.getBufferData();
console.log("Current buffer data:", bufferData);

// Get tracking statistics
const stats = tracker.getTrackingStats();
console.log("Tracking stats:", stats);
```

## API Reference

### VideoBufferTrackerConfig

```typescript
interface VideoBufferTrackerConfig {
  trafficEventUrl?: string; // Legacy: URL to send analytics data
  publisher?: string; // Publisher domain (defaults to window.location.hostname)
  onBufferData?: (data: BufferData) => void | Promise<void>; // Callback for buffer data
}
```

### BufferData

```typescript
interface BufferData {
  file_size: number; // Estimated bytes buffered
  publisher: string; // Publisher domain
  video_serve_url: string; // Video URL
}
```

### Methods

- `setupVideoTracking(video: HTMLVideoElement, videoUrl: string): Promise<void>` - Setup tracking for a video element
- `getBufferData(): BufferData` - Get current buffer data
- `getTrackingStats()` - Get current tracking statistics

## License

MIT
