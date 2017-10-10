const moment = require('moment');
const async = require('async');
const {PeriodGenerator} = require('./periodGenerator');

class DetailGenerator {

  constructor(country, period, leaves, weekOff, pagination) {
    this.country = country.toLowerCase();
    this.period = period;
    this.weekOff = weekOff;
    this.leaves = leaves;
    this.skip = pagination.skip || 0;
    this.limit = pagination.limit || 1;
  }

  getWorkEvent(cb) {

    const self = this;
    let periodGenerator = new PeriodGenerator(self.country, self.period, self.leaves, self.weekOff);
    periodGenerator.getWorkEvent((err, data) => {
      let workEvent = {};
      workEvent = data;
      workEvent.skip = self.skip;
      workEvent.limit = self.limit;
      self.getWorkEventMonthly((err, res) => {
        workEvent.monthlyDetails = res;
        cb(null, workEvent);
      });
    });
  }

  getWorkEventMonthly(cb) {

    const self = this;
    let workEvent = {};

    this.getPeriodMonths((monthlyPeriods) => {

      if (self.skip >= monthlyPeriods.length) {
        callback(null, []);
      } else {

        async.map(monthlyPeriods.slice(self.skip, self.skip + self.limit), function (period, callback) {

          let periodGenerator = new PeriodGenerator(self.country, period, self.leaves, self.weekOff);
          periodGenerator.getWorkEvent((err, data) => {
            callback(null, data);
          });
        }, function (err, results) {
          cb(err, results);
        });

      }
    });
  }

  getPeriodMonths(cb) {

    const self = this;

    let start = moment(new Date(this.period.start));
    let end = moment(new Date(this.period.end));
    let differDum = end.diff(start);
    let differ = end.diff(start, 'months');

    if (differDum < 0) {
      return [];
    } else {
      let currMonth = start;
      let monthsArr = [];

      for (let i = 0; i <= differ; i++) {

        let monthStart = "";
        if (i == 0) {
          monthStart = start.format("D MMM YYYY");
        } else {
          monthStart = currMonth.startOf("month").format("D MMM YYYY");
        }

        let monthEnd = currMonth.endOf("month").format("D MMM YYYY");
        if (i == differ) {
          monthEnd = end.format("D MMM YYYY");
        }

        let monthObj = {
          start: monthStart,
          end: monthEnd
        };
        monthsArr.push(monthObj);
        currMonth = currMonth.add(1, "months");
      }
      cb(monthsArr);
    }
  }

}


module.exports = {DetailGenerator};
