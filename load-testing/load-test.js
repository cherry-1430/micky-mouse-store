import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 400,
  duration: '1m',
};

export default function () {
  const res = http.get('http://localhost:5000/api/products');

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
  });

  if (!success) {
    console.log(
      `FAILED | status=${res.status} | error=${res.error || 'none'}`
    );
  }

  sleep(1);
}