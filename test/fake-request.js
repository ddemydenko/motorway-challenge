const mock = require('./mock');
const qs = require('querystring');
const ATTEMPTS = 3;

function makeRequest(url) {
  const fakeHttpCall = (resolve, reject) =>{
    console.log(url);
    const { page } = qs.parse(url);
    if (Math.random() > 0.5) {
      setTimeout(() => {
        reject(Error('test'));
      }, 500);
    }else{
      setTimeout(() => {
        resolve({ total: 150, data: mock.slice((page - 1) * 15, page * 15) });
      }, 500);
    }
  };

  return new Promise((resolve, reject) => {
    fakeHttpCall(resolve, reject);
  }).catch(() => {
    return retry(() => new Promise((resolve, reject) => fakeHttpCall(resolve, reject)));
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

module.exports = makeRequest;
