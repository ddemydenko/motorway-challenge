const time = process.hrtime();
const main = require('./main.js');
main().then((data) => {
  console.log(data, Object.keys(data).length);
  const diff = process.hrtime(time);
  const timeInMs = (diff[0] * 1000000000 + diff[1]) / 1000000;
  console.log("timeInMs:", timeInMs);
}).catch((err) => {
  console.error(err);
});
