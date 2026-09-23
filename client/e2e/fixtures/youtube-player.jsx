import { createRoot } from 'react-dom/client';
import VideoPlayer from '../../src/features/course/components/learning/VideoPlayer';
import '../../src/index.css';

// A transformed, clipped ancestor reproduces the mobile fullscreen bug.
createRoot(document.getElementById('root')).render(
  <main
    style={{
      transform: 'translateZ(0)',
      overflow: 'hidden',
      width: 'min(720px, 100%)',
      margin: '60px auto',
    }}
  >
    <VideoPlayer url="https://www.youtube.com/watch?v=W6NZfCO5SIk" />
  </main>
);
