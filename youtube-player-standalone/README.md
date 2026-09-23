# Secure YouTube & Direct Video Player for React

A hardened, zero-leak custom video player for React applications. It wraps YouTube videos (as well as direct MP4/WebM videos) with custom controls and a multi-layered security shield so users **cannot click through, navigate, open popups, or be redirected to YouTube**.

---

## 🚀 Quick Setup for Another Project

### 1. Copy the files
Copy the `youtube-player-standalone` folder into your React project (e.g. `src/components/player`):
```text
src/components/player/
├── VideoPlayer.jsx      # Main unified player component with custom UI
├── YouTubeSurface.jsx   # Sandboxed YouTube iframe controller (IFrame API)
├── videoSource.js       # URL parser & ID extractor
├── youtubeApi.js        # Singleton loader for YouTube iframe API
└── index.js             # Convenient exports
```

### 2. Install peer dependencies
```bash
npm install react-icons
```
*(Requires React 18+ and Tailwind CSS)*

### 3. Usage Example
```jsx
import React, { useRef } from 'react';
import { VideoPlayer } from './components/player';

export default function LessonView() {
  const playerRef = useRef(null);

  return (
    <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl">
      <VideoPlayer
        ref={playerRef}
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        autoPlay={false}
        onProgress={({ played, playedSeconds, duration }) => {
          console.log(`Progress: ${(played * 100).toFixed(1)}%`);
        }}
        onComplete={() => {
          console.log('Video finished!');
        }}
      />
    </div>
  );
}
```

---

## 🔒 Security Architecture (How it Blocks YouTube Access)

Preventing students/users from reaching YouTube requires multiple defense layers working simultaneously:

| Attack Vector | How It Is Blocked |
|---|---|
| **Clicking YouTube logo / Channel / Title** | The YouTube iframe is marked with `pointer-events: none` and `inert`. A transparent stage overlay sits above the iframe and captures all pointer events for Play/Pause. The iframe never receives raw mouse clicks or touches. |
| **New Tab / Window Popups** | The iframe uses `sandbox="allow-scripts allow-same-origin"`. It **strictly omits** `allow-popups` and `allow-popups-to-escape-sandbox`. Any script inside the frame calling `window.open()` is blocked by the browser engine. |
| **Top Navigation / Page Redirects** | The sandbox **strictly omits** `allow-top-navigation` and `allow-top-navigation-by-user-activation`. Any attempted redirect to `youtube.com` throws a security error inside the sandbox. |
| **Right-Click "Copy Video URL"** | Context menu is prevented on the player container (`onContextMenu={e => e.preventDefault()}`). |
| **YouTube Suggested Videos / Pause Cards** | When the video is paused, buffering, or idle, an **opaque pure-black shield** (`bg-black`) immediately covers the video frame. Users never see YouTube's related video grid or channel recommendations. |
| **YouTube Controls & Watermark** | Initialized with `controls=0`, `disablekb=1`, `fs=0`, `rel=0`, `iv_load_policy=3`. Additionally, an intentional vertical overscan (`calc(max(100px, 15%) * -1)`) pushes any persistent YouTube chrome outside the clipped viewport. |
| **YouTube Native Fullscreen** | Fullscreen is intercepted by custom buttons and executed on the outer HTML container. The iframe is never directly expanded into native browser fullscreen mode, preventing YouTube from displaying its own native player UI. |
| **Keyboard Shortcuts** | Keyboard events (`Space`, `k`, `m`, `f`, arrow keys) are handled on the outer container (`tabIndex=0`), preventing key events from reaching the iframe. |

> **Security Note on DevTools / Network tab:**
> Because video data must stream to the client browser, any technically savvy user opening the Browser DevTools Network tab will see requests to `googlevideo.com` / `youtube.com`. In web architecture, it is physically impossible to stream client-side YouTube video without network requests to YouTube. However, within the application UI and normal user interaction, no student can click through, open YouTube, or get redirected.

---

## 🎛️ Component API

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | *(Required)* | YouTube URL (`watch?v=...`, `youtu.be/...`, `embed/...`, `shorts/...`) or direct MP4/WebM URL. |
| `autoPlay` | `boolean` | `false` | Attempt autoplay on load. |
| `onProgress` | `({ played, playedSeconds, duration, loaded }) => void` | `undefined` | Callback fired periodically with playback progress. |
| `onComplete` | `() => void` | `undefined` | Callback fired when the video finishes or reaches >= 95%. |

### Imperative Ref Methods (`playerRef.current`)

- `play()`: Promise that begins playback.
- `pause()`: Pauses playback and displays the opaque shield immediately.
- `seekTo(seconds)`: Seeks to a specific timestamp in seconds.
- `requestFullscreen()`: Requests container fullscreen (or fallback in-page expansion).
- `exitFullscreen()`: Exits fullscreen.
- `toggleFullscreen()`: Toggles fullscreen mode.

---

## 🧪 Testing

To run the automated test suite:

```bash
# Unit & component tests (44 tests)
npx vitest run src/tests/course/VideoPlayer.test.jsx src/tests/course/YouTubeSurface.test.jsx src/tests/course/youtubeApi.test.js

# Real browser sandbox & redirect tests (Playwright)
npx playwright test --config playwright.player.config.js
```
