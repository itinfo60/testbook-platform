let pendingApi;

// One request for every mounted player. A failed request is discarded so an
// in-player retry can recover without reloading the entire learning page.
export function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (pendingApi) return pendingApi;

  pendingApi = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    const script = existing || document.createElement('script');
    const previousReady = window.onYouTubeIframeAPIReady;
    let settled = false;
    let timeout;

    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      script.removeEventListener('error', fail);
      if (window.onYouTubeIframeAPIReady === ready) {
        window.onYouTubeIframeAPIReady = previousReady;
      }
      if (error) {
        if (!existing) script.remove();
        reject(error);
      } else {
        resolve(window.YT);
      }
    };
    const fail = () => finish(new Error('Unable to load the video player. Please retry.'));
    const ready = () => {
      try {
        if (typeof previousReady === 'function') previousReady();
      } finally {
        if (window.YT?.Player) finish();
        else fail();
      }
    };

    window.onYouTubeIframeAPIReady = ready;
    script.addEventListener('error', fail);
    timeout = setTimeout(fail, 15000);
    if (!existing) {
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    pendingApi = undefined;
    throw error;
  });
  return pendingApi;
}
