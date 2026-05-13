
export default function VideoPlayer({ url, onProgress, onComplete }) {
  const handleProgress = state => {
    onProgress?.(state);
    if (state.played >= 0.9) {
      onComplete?.();
    }
  };

  return (
    <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
      {url ? (
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          controls
          onProgress={handleProgress}
          config={{
            youtube: { playerVars: { modestbranding: 1 } },
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-dark-400">
          <div className="text-center">
            <div className="text-4xl mb-2">🎬</div>
            <p>No video available</p>
          </div>
        </div>
      )}
    </div>
  );
}
