const makeRequest = require('./request');
const qs = require('querystring');
const BASE_URL = 'https://motorway-challenge-api.herokuapp.com/api';
const ROUTES = {
  LOGIN: BASE_URL + '/login',
  VISITS: BASE_URL + '/visits'
};
const PAGE_SIZE = 15;
const CONCURRENCY_LIMIT = 5;
const TODAY = new Date().toDateString();
const WEEKEND_DAYS = [0, 6];

async function main() {
  const token = await getToken(ROUTES.LOGIN);
  console.log(token);
  return await getVisits(token);
}

const isWeekend = (date) => WEEKEND_DAYS.includes(new Date(date).getDay());
const isToday = (date) => TODAY === new Date(date).toDateString();

function calculateVisitsFactory(allVisits) {
  //avoid duplication when data comes during the requests are performing
  const uniqueIds = [];
  return (visits) => {
    visits
      .filter((item) => !isWeekend(item.date) && !isToday(item.date))
      .reduce((acc, item) => {
      if (uniqueIds.includes(item.id)) return acc;
      uniqueIds.push(item.id);

      if (acc[item.name]) {
          acc[item.name].count++;
      } else {
        acc[item.name] = { count: 1 };
      }
      return acc;
    }, allVisits);
  };
}

async function getToken() {
  const { token } = await makeRequest(ROUTES.LOGIN);
  return token;
}

const getVisitsUrl = ({ token, page }) => `${ROUTES.VISITS}?` + qs.stringify({ token, page });
const totalPages = (count) => Math.ceil(count / PAGE_SIZE);

async function getVisits(token) {
  let pageNumber = 1;
  const visits = {}, calculateVisits = calculateVisitsFactory(visits);
  //init request
  const { total, data } = await makeRequest(getVisitsUrl({ token, page: pageNumber }));
  calculateVisits(data);

  let totalItems = total, batch = [];
  for (pageNumber = 2; pageNumber <= totalPages(totalItems); pageNumber++) {
    batch.push(
      makeRequest(getVisitsUrl({ token, page: pageNumber })).then(({ total, data }) => {
        totalItems = Math.max(total, totalItems);
        calculateVisits(data);
      })
    );

    if (batch.length >= CONCURRENCY_LIMIT || pageNumber === totalPages(totalItems)) {
      await Promise.all(batch);
      batch = [];
    }
  }

  return visits;
}

module.exports = main;




