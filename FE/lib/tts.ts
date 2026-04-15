type PlayTtsOptions = {
  signal?: AbortSignal;
  onStart?: () => void;
  onEnd?: () => void;
};

let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let activeRequestController: AbortController | null = null;

async function playBrowserTts(text: string, options: PlayTtsOptions = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    throw new Error('Browser TTS is not available.');
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.95;
  utterance.pitch = 1;

  const availableVoices = window.speechSynthesis.getVoices();
  const koreanVoice = availableVoices.find((voice) =>
    voice.lang.toLowerCase().startsWith('ko'),
  );

  if (koreanVoice) {
    utterance.voice = koreanVoice;
  }

  const abortPlayback = () => {
    window.speechSynthesis.cancel();
  };

  options.signal?.addEventListener('abort', abortPlayback, { once: true });

  try {
    await new Promise<void>((resolve, reject) => {
      utterance.onstart = () => {
        options.onStart?.();
      };
      utterance.onend = () => {
        options.onEnd?.();
        resolve();
      };
      utterance.onerror = () => {
        reject(new Error('Browser TTS playback failed.'));
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  } finally {
    options.signal?.removeEventListener('abort', abortPlayback);
  }
}

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
  if (typeof window !== 'undefined') {
    window.speechSynthesis?.cancel();
  }
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

      await new Promise<void>((resolve, reject) => {
        let settled = false;

        const finish = () => {
          if (settled) {
            return;
          }

          settled = true;
          resolve();
        };

        const fail = (error: Error) => {
          if (settled) {
            return;
          }

          settled = true;
          reject(error);
        };

        audio.onended = () => {
          options.onEnd?.();
          finish();
        };

        audio.onerror = () => {
          if (requestController.signal.aborted) {
            finish();
            return;
          }

          fail(new Error('Audio playback failed.'));
        };

        void audio.play().then(
          () => {
            if (requestController.signal.aborted) {
              finish();
              return;
            }

            options.onStart?.();
          },
          (error: unknown) => {
            if (requestController.signal.aborted) {
              finish();
              return;
            }

            fail(
              error instanceof Error
                ? error
                : new Error('Audio playback failed.'),
            );
          },
        );
      });
      return;
    } catch {
      await playBrowserTts(normalizedText, options);
    }
  } finally {
    options.signal?.removeEventListener('abort', abortPlayback);

    if (activeRequestController === requestController) {
      activeRequestController = null;
      cleanupAudio();
    }
  }
}
