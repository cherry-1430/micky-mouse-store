import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
  { duration: "10s", target: 500 },
  { duration: "10s", target: 1000 },
  { duration: "10s", target: 1500 },
  { duration: "10s", target: 2500 },
  { duration: "10s", target: 0 },
],

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const response = http.get(
    'http://localhost:5000/api/products'
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  if (response.status !== 200) {
    console.log(`FAILED: status=${response.status} body=${response.body}`);
}

  sleep(1);
}