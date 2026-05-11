import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { check, sleep } from 'k6';

const cacheHitCounter = new Counter('tts_cache_hit');
const cacheMissCounter = new Counter('tts_cache_miss');

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const TTS_PATH = __ENV.TTS_PATH || '/api/tts';
const TTS_TEXT =
  __ENV.TTS_TEXT || '무엇이 궁금하신가요?';

export const options = {
  scenarios: {
    warm_and_repeat: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 3),
      duration: __ENV.DURATION || '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  const response = http.post(
    `${BASE_URL}${TTS_PATH}`,
    JSON.stringify({ text: TTS_TEXT }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: {
        api: 'tts',
      },
    },
  );

  check(response, {
    'tts status is 200': (r) => r.status === 200,
    'tts content-type is audio/wav': (r) =>
      (r.headers['Content-Type'] || '').includes('audio/wav'),
  });

  const cacheHeader = response.headers['X-TTS-Cache'];
  if (cacheHeader === 'HIT') {
    cacheHitCounter.add(1);
  } else if (cacheHeader === 'MISS') {
    cacheMissCounter.add(1);
  }

  sleep(Number(__ENV.SLEEP_SECONDS || 1));
}
