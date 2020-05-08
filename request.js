const https = require('https');
const ATTEMPTS = 3;

function makeRequest(url) {
  const httpCall = (resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
      res.on('error', (err) => {
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  };
  return new Promise((resolve, reject) => httpCall(resolve, reject)).then(handleResponse)
    .catch(() => {
      return retry(() => new Promise((resolve, reject) => httpCall(resolve, reject))).then(handleResponse);
    });
}

function retry(fn, retries = ATTEMPTS, err = null) {
  if (!retries) {
    return Promise.reject(err);
  }
  return fn().catch(err => {
    return retry(fn, (retries - 1), err);
  });
}

function handleResponse(res) {
  return JSON.parse(res);
}

module.exports = makeRequest;
