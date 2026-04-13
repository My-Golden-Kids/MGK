type PlayTtsOptions = {
  signal?: AbortSignal;
  onStart?: () => void;
  onEnd?: () => void;
};

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let activeRequestController: AbortController | null = null;

function cleanupAudio() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = '';
    activeAudio.load();
    activeAudio = null;
  }

  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

export function cancelTtsPlayback() {
  activeRequestController?.abort();
  activeRequestController = null;
  cleanupAudio();
}

export async function playTts(text: string, options: PlayTtsOptions = {}) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return;
  }

  cancelTtsPlayback();

  const requestController = new AbortController();
  activeRequestController = requestController;

  const abortPlayback = () => {
    requestController.abort();
    cleanupAudio();
  };

  options.signal?.addEventListener('abort', abortPlayback, { once: true });

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: normalizedText }),
      signal: requestController.signal,
    });

    if (!response.ok) {
      throw new Error(`TTS request failed with status ${response.status}`);
    }

    const audioBlob = await response.blob();

    if (requestController.signal.aborted) {
      return;
    }

    const objectUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(objectUrl);

    activeObjectUrl = objectUrl;
    activeAudio = audio;

    const playbackCompleted = new Promise<void>((resolve, reject) => {
      audio.onended = () => {
        resolve();
      };
      audio.onerror = () => {
        reject(new Error('Audio playback failed.'));
      };
    });

    await audio.play();
    options.onStart?.();
    await playbackCompleted;
    options.onEnd?.();
  } finally {
    options.signal?.removeEventListener('abort', abortPlayback);

    if (activeRequestController === requestController) {
      activeRequestController = null;
      cleanupAudio();
    }
  }
}
