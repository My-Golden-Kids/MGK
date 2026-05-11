import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { check, sleep } from 'k6';

const cacheHitCounter = new Counter('talk_cache_hit');
const cacheMissCounter = new Counter('talk_cache_miss');

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const TALK_PATH = __ENV.TALK_PATH || '/api/talk';
const TALK_TEXT = __ENV.TALK_TEXT || '상품 추천해줘';
const TALK_TOKEN = __ENV.TALK_TOKEN || '';
const TALK_PET_ID = __ENV.TALK_PET_ID ? Number(__ENV.TALK_PET_ID) : null;

export const options = {
  scenarios: {
    warm_and_repeat: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 2),
      duration: __ENV.DURATION || '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (TALK_TOKEN) {
    headers.Authorization = `Bearer ${TALK_TOKEN}`;
  }

  const response = http.post(
    `${BASE_URL}${TALK_PATH}`,
    JSON.stringify({
      transcript: TALK_TEXT,
      petId: TALK_PET_ID,
    }),
    {
      headers,
      tags: {
        api: 'talk',
      },
    },
  );

  check(response, {
    'talk status is 200': (r) => r.status === 200,
  });

  const cacheHeader = response.headers['X-Talk-Cache'];
  if (cacheHeader === 'HIT') {
    cacheHitCounter.add(1);
  } else if (cacheHeader === 'MISS') {
    cacheMissCounter.add(1);
  }

  sleep(Number(__ENV.SLEEP_SECONDS || 1));
}
