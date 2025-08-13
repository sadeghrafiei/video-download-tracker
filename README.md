# Video Download Tracker

A comprehensive video download tracking utility for monitoring video buffering progress and analytics in web applications.

## Features

-   **Real-time Progress Tracking**: Monitor video buffering progress in real-time
-   **Mathematical Byte Calculation**: Calculate downloaded bytes without additional network requests
-   **Analytics Integration**: Send download data to configurable analytics endpoints
-   **Multiple Event Handling**: Handle progress, time update, and page visibility events
-   **TypeScript Support**: Full TypeScript support with type definitions
-   **Zero Dependencies**: Lightweight with no external dependencies

## Installation

```bash
npm install video-download-tracker
```

## Usage

### Basic Usage

```typescript
import { VideoDownloadTracker } from 'video-download-tracker';

const tracker = new VideoDownloadTracker({
    trafficEventUrl: 'https://analytics.example.com/events',
    publisher: 'example.com',
});

const videoElement = document.querySelector('video');
const videoUrl = 'https://example.com/video.mp4';

await tracker.setupVideoTracking(videoElement, videoUrl);
```

### Advanced Configuration

```typescript
import { VideoDownloadTracker } from 'video-download-tracker';

const tracker = new VideoDownloadTracker({
    trafficEventUrl: 'https://your-analytics-endpoint.com/track',
    publisher: 'your-domain.com',
});

// Setup tracking for multiple videos
const videos = document.querySelectorAll('video');
for (const video of videos) {
    await tracker.setupVideoTracking(video, video.src);
}

// Get tracking statistics
const stats = tracker.getTrackingStats();
console.log('Downloaded bytes:', stats.estimatedDownloadedBytes);
```

## API Reference

### VideoDownloadTracker

#### Constructor

```typescript
new VideoDownloadTracker(config?: VideoDownloadTrackerConfig)
```

**Config Options:**

-   `trafficEventUrl?: string` - Analytics endpoint URL
-   `publisher?: string` - Publisher domain (defaults to `window.location.hostname`)

#### Methods

##### `setupVideoTracking(video: HTMLVideoElement, videoUrl: string): Promise<void>`

Sets up tracking for a video element.

**Parameters:**

-   `video` - The HTML video element to track
-   `videoUrl` - The URL of the video

##### `getTrackingStats(): TrackingStats`

Returns current tracking statistics.

**Returns:**

```typescript
{
    totalSize: number;
    estimatedDownloadedBytes: number;
    hasSubmittedFullDownload: boolean;
}
```

## How It Works

### 1. Video Size Detection

-   Uses HEAD request to get total video file size
-   Stores size for mathematical byte calculations

### 2. Buffering Tracking

-   Monitors `video.buffered` ranges to track download progress
-   Merges overlapping/adjacent buffered ranges
-   Detects when video is fully downloaded

### 3. Byte Calculation

-   Converts time ranges to byte ranges mathematically
-   Calculates downloaded bytes without additional network requests
-   Prevents duplicate processing of overlapping ranges

### 4. Analytics Integration

-   Sends download size data to configurable analytics endpoints
-   Tracks publisher domain and video URL
-   Prevents duplicate analytics submissions

### 5. Event Handling

-   **Progress events**: Track buffering progress
-   **Time update events**: Detect video end
-   **Page events**: Handle page unload/visibility changes

## Analytics Data Format

The tracker sends the following data to your analytics endpoint:

```typescript
{
    file_size: number; // Downloaded bytes
    publisher: string; // Publisher domain
    video_serve_url: string; // Video URL
}
```

## Browser Support

-   Chrome 60+
-   Firefox 55+
-   Safari 12+
-   Edge 79+

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### 1.0.0

-   Initial release
-   Core video tracking functionality
-   Analytics integration
-   TypeScript support
