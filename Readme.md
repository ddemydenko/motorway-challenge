An API returns data about visits to the fake office. Here are the API details.

At first you need to receive an access token via `GET https://fake.com/api/login` call. The response would be:

```json
{
  "token": "1234567890abcdef"
}
```

The API `GET https://fake.com/api/visits?page={pageNo}&token={token}` returns data about visits to the fake office, in the following format:

```json
{
  "data": [
    { "id": 1, "name": "Bill Murray", "date": "2018-09-02T09:11:00" },
    { "id": 2, "name": "John Doe", "date": "2018-08-30T03:24:00" }
  ],
  "total": 100
}
```
Use test/mock.js for mock data.

Where:

- `token` is the token received on the first step via `/api/login` call
- `id` is the unique key for the record
- `name` is the name of the visitor
- `date` is the date of the visit
- `total` is the total count of records in the system
- `pageNo` starts from 1

You need to write a script that calculates how many times each visitor has visited the office.

**Please take into account:**

- The whole dataset is ordered by the `name` field
- We are only interested in tracking weekday visits, weekend visits should be ignored.
- Data is not static. Visits could occur while you are fetching the API response. However, records can only be inserted and it would be always today’s visits. Visits cannot be undone.
- We should ignore visits from the current day, since the day is still in progress
- It's better to execute parallel requests to API.
- Bonus points for request pool (not necessary).
- Bonus points for retries.
