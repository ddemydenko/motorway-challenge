const sinon = require('sinon');
const assert = require('assert');
const rewire = require('rewire');
const mockData = require('./mock');

const request = rewire('../request');
const main = rewire('../main');

describe('Test', () => {
  const sandbox = sinon.createSandbox();
  const makeRequest = sandbox.stub();
  const getToken = sandbox.stub();
  const spyPromise = sandbox.spy(Promise, 'all');
  const revert = main.__set__('makeRequest', makeRequest);
  main.__set__('getToken', getToken);
  afterEach(async () => {
    sandbox.reset();
  });

  it('should make at least 2 query sequentially when total more than page size', async () => {
    makeRequest.onCall(0).resolves({ total: 16, data: mockData.slice(0, 15) });
    makeRequest.onCall(1).resolves({ total: 16, data: mockData.slice(15, 16) });
    getToken.returns('5f0147ece8768eb');
    const result = await main();
    assert(Object.keys(result).length === 6);
    assert(result['Visitor #0'].count === 1);
    assert(result['Visitor #1'].count === 2);
    console.log(result);
  });

  it('should ignore weekends visits', async () => {
    makeRequest.onCall(0).resolves({ total: 15, data: mockData.slice(0, 15) });
    getToken.returns('5f0147ece8768eb');
    const result = await main();
    assert(Object.keys(result).includes('Visitor #13') === false);
    assert(Object.keys(result).length === 6);
    assert(result['Visitor #0'].count === 1);
    assert(result['Visitor #1'].count === 2);
  });

  it('should ignore today visits', async () => {
    const data = mockData.slice(0, 14);
    data.push({
      'id': 88,
      'name': 'Visitor #113',
      'date': new Date().toISOString()
    },);
    makeRequest.onCall(0).resolves({ total: data.length, data: data });
    getToken.returns('5f0147ece8768eb');
    const result = await main();
    assert(Object.keys(result).includes('Visitor #113') === false);
    assert(Object.keys(result).length === 6);
    assert(result['Visitor #0'].count === 1);
    assert(result['Visitor #1'].count === 2);
  });

  it('should make only one request when total less than page size', async () => {
    makeRequest.onCall(0).resolves({ total: 14, data: mockData.slice(0, 14) });
    makeRequest.onCall(1).resolves({ total: 16, data: mockData.slice(15, 16) });
    getToken.returns('5f0147ece8768eb');
    const result = await main();
    assert(Object.keys(result).length === 6);
    assert(result['Visitor #0'].count === 1);
    assert(result['Visitor #1'].count === 2);
    console.log(result);
    sinon.assert.calledOnce(makeRequest);
  });

  it('should make at least 2 requests in parallel way when total more than page size', async () => {
    makeRequest.onCall(0).resolves({ total: 31, data: mockData.slice(0, 15) });
    makeRequest.onCall(1).resolves({ total: 31, data: mockData.slice(15, 30) });
    makeRequest.onCall(2).resolves({ total: 31, data: mockData.slice(30, 31) });
    getToken.returns('5f0147ece8768eb');
    const result = await main();
    // assert(Object.keys(result).length === 14);
    console.log(result);
    sinon.assert.calledThrice(makeRequest);
    sinon.assert.calledWith(spyPromise, [Promise.resolve(), Promise.resolve()]);
  });

  it('should handle request when date incomes during the requests', async () => {
    makeRequest.onCall(0).resolves({ total: 31, data: mockData.slice(0, 15) });
    makeRequest.onCall(1).resolves({ total: 31, data: mockData.slice(15, 30) });
    //simulate insertion, the same date comes twice
    makeRequest.onCall(2).resolves({ total: 45, data: mockData.slice(15, 30) });
    getToken.returns('5f0147ece8768eb');
    const result = await main();
    assert(result['Visitor #0'].count === 1);
    assert(result['Visitor #20'].count === 1);
    assert(result['Visitor #15'].count === 4);
    assert(Object.keys(result).length === 13);
    console.log(result);
    sinon.assert.calledThrice(makeRequest);
    sinon.assert.calledWith(spyPromise, [Promise.resolve(), Promise.resolve()]);
  });

  it('should retry request when promise return reject', async () => {
    revert();
    const get = sandbox.stub();
    request.__set__('https', { get });
    const spyRetry = sandbox.spy(request.__get__('retry'));
    request.__set__('retry', spyRetry);
    main.__set__('makeRequest', request);

    get.onCall(0).returns({
      on: (err, callback) => {
        callback();
      }
    });

    await main().catch(err => err);
    sinon.assert.callCount(spyRetry, 4);

    spyRetry.resetHistory();
    request.__set__('ATTEMPTS', 1);
    await main().catch(err => err);
    sinon.assert.callCount(spyRetry, 2);
  });

});



