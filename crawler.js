const cheerio = require('cheerio');
const request = require('request');
// const url = "http://www.officeholidays.com/countries/";
const url = "https://www.timeanddate.com/holidays/";

class Crawler {

  constructor() {
  }

  getHolidayData(country, year, cb) {

    let sourceUrl = url + country + "/" + year;
    request(sourceUrl, (error, response, body) => {

      if (error) {
        cb("Error in retrieving data from Internet", null, null);
      } else {
        const $ = cheerio.load(body);
        let dataArr = $('.nw').toArray();

        let holidayDates = [];
        let holidayDays = [];

        for (var i = 0; i < dataArr.length; i++) {
          let temp = cheerio.load(dataArr[i]);
          if (i % 2 == 0) {
            holidayDates.push(temp('.nw').text() + " " + year);
          } else {
            holidayDays.push(temp('.nw').text());
          }
        }
        cb(null, holidayDates, holidayDays);
      }
    });
  }
}


module.exports = {Crawler};
