const moment = require('moment');
const async = require('async');
const NodeCache = require("node-cache");
const {Crawler} = require('./crawler');
const {WorkEvent, WorkEventError, WORK_EVENT_ERROR_TYPE, WORK_EVENT_TYPE} = require('./workEvent');

class PeriodGenerator {

  constructor(country, period, leaves, weekOff) {
    this.country = country.toLowerCase();
    this.period = period;
    this.weekOff = weekOff;
    this.leaves = leaves;
  }

  getWorkEvent(cb) {

    const self = this;
    let workEvent = {};

    workEvent.period = {};
    workEvent.period.start = self.period.start;
    workEvent.period.end = self.period.end;
    workEvent.weekOff = self.weekOff;

    // get total number of days in the given period
    workEvent.totalDays = this.getTotalDays();

    // get total weekly off in the given period
    workEvent.totalWeeklyOffs = this.getWeeklyOffDetails();

    // get total holidays in the given period
    this.getHolidayDetails((err, holidayCount, holidayArr) => {

      if (err) {
        cb(err, null);
      } else {
        workEvent.totalHolidays = holidayCount;

        let holidays = [];
        for (let i = 0; i < holidayArr.length; i++) {
          for (let j = 0; j < holidayArr[i].length; j++) {
            holidays.push(holidayArr[i][j]);
          }
        }
        // get leave details in the given period
        workEvent.leaveDetails = this.getLeaveDetails(holidays);
        workEvent.totalLeaves = workEvent.leaveDetails.length;


        // calculate total working days in the given period
        workEvent.totalWorkingDays = (workEvent.totalDays - workEvent.totalLeaves - workEvent.totalWeeklyOffs - workEvent.totalHolidays);

        cb(null, workEvent);
      }
    });

  }

  getTotalDays() {

    const self = this;
    let start = moment(new Date(self.period.start));
    let end = moment(new Date(self.period.end));
    return (end.diff(start, 'days') + 1);
  }

  getHolidayDetails(cb) {

    const self = this;
    let requiredYears = this.getPeriodYears();

    this.getHolidays(requiredYears, (err, holidayArr) => {
      if (err) {
        cb(err, null, null);
      } else {
        let holidayCount = 0;
        let start = moment(new Date(self.period.start));
        let end = moment(new Date(self.period.end));
        for (let i = 0; i < holidayArr.length; i++) {
          for (let j = 0; j < holidayArr[i].length; j++) {
            let holidayDate = moment(new Date(holidayArr[i][j]));
            if (holidayDate.isSameOrAfter(start) && holidayDate.isSameOrBefore(end)) {
              if (!self.isWeeklyOff(holidayDate)) {
                holidayCount++;
              }
            }
          }
        }

        cb(null, holidayCount, holidayArr);
      }
    });
  }

  getLeaveDetails(holidays) {

    const self = this;
    let totalLeaves = 0;
    let leaveDetails = [];
    for (let i = 0; i < self.leaves.length; i++) {
      let leaveDates = this.evaluateLeavePeriod(self.leaves[i], holidays);
      for (let j = 0; j < leaveDates.length; j++) {
        leaveDetails.push(leaveDates[j]);
      }
    }
    return leaveDetails;
  }

  getWeeklyOffDetails() {

    const self = this;
    let start = moment(new Date(self.period.start));
    let end = moment(new Date(self.period.end));
    let totalDays = end.diff(start, 'days') + 1;

    let weekOffCount = 0;
    for (let curr = start, i = 0; i < totalDays; curr = curr.add(1, 'days'), i++) {
      if (this.isWeeklyOff(curr)) {
        weekOffCount++;
      }
    }

    return weekOffCount;
  }

  getLeavePeriodInPeriodRange(leavePeriod) {

    const self = this;
    let start = moment(new Date(leavePeriod.start));
    let end = moment(new Date(leavePeriod.end));
    let periodStart = moment(new Date(self.period.start));
    let periodEnd = moment(new Date(self.period.end));

    if (start.isAfter(periodEnd) || end.isBefore(periodStart)) {
      return 0;
    }

    let isLeaveStartBefore = true;
    let isLeaveEndAfter = true;

    if (start.isSameOrAfter(periodStart)) {
      isLeaveStartBefore = false;
    }
    if (end.isSameOrBefore(periodEnd)) {
      isLeaveEndAfter = false;
    }

    if (isLeaveStartBefore && isLeaveEndAfter) {
      return 0;
    }

    if (isLeaveStartBefore) {
      start = periodStart;
    }
    if (isLeaveEndAfter) {
      end = periodEnd;
    }

    let retPeriod = {
      start: start.format("D MMM YYYY"),
      end: end.format("D MMM YYYY")
    };

    return retPeriod;
  }

  evaluateLeavePeriod(leavePeriod, holidays) {

    const self = this;
    leavePeriod = this.getLeavePeriodInPeriodRange(leavePeriod);
    let start = moment(new Date(leavePeriod.start));
    let end = moment(new Date(leavePeriod.end));

    let totalCount = end.diff(start, 'days') + 1;

    let leaveDates = [];
    let totalLeaves = 0;
    for (let curr = start, i = 0; i < totalCount; curr = curr.add(1, 'days'), i++) {
      if (!this.isWeeklyOff(curr)) {
        leaveDates.push(curr.format("DD MMM YYYY"));
      }
    }

    start = moment(new Date(leavePeriod.start));

    for (let i = 0; i < holidays.length; i++) {
      let holidayDate = moment(new Date(holidays[i]));
      if (holidayDate.isSameOrAfter(start) && holidayDate.isSameOrBefore(end)) {
        if (this.isWeeklyOff(holidayDate)) {
          let index = leaveDates.indexOf(holidayDate.format("DD MMM YYYY"));
          if (index != -1) {
            leaveDates.splice(index, 1);
          }
        }
      }
    }

    return leaveDates;
  }

  getHolidays(years, cb) {

    const self = this;
    const myCache = new NodeCache();

    async.map(years, function (year, callback) {
      let cacheDataKey = "holidays_" + self.country + "_" + year;
      myCache.get(cacheDataKey, (err, value) => {
        if (err || value == undefined) {

          // key not found in cache - get it from using web crawler
          const crawler = new Crawler();
          crawler.getHolidayData(self.country, year, (error, holidayDates, holidayDays) => {
            if (error) {
              callback(error, null);
            } else {

              let cacheDataValue = {
                dates: holidayDates,
                days: holidayDays
              };

              myCache.set(cacheDataKey, cacheDataValue, 24 * 3600 /* TTL = 1 Day*/, () => {
              });

              callback(null, holidayDates);
            }

          });

        } else {

          // got the key in cache - use it
          callback(null, value);
        }
      });

    }, function (err, results) {
      cb(err, results);
    });
  }

  getPeriodYears() {

    let start = moment(new Date(this.period.start));
    let end = moment(new Date(this.period.end));
    let differDum = end.diff(start);
    let differ = end.diff(start, 'years');
    if (differ != 0) differ++;


    if (differDum < 0) {
      return [];
    } else {
      let startYear = start.year();
      let yearsArr = [];
      for (let i = 0; i <= differ; i++) {
        yearsArr.push(startYear++);
      }
      return yearsArr;
    }
  }

  isWeeklyOff(givenDate) {

    const self = this;
    let weekdaysFull = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    let weekdaysShort = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

    if (self.weekOff.indexOf(weekdaysFull[givenDate.day()]) != -1 ||
      self.weekOff.indexOf(weekdaysShort[givenDate.day()]) != -1) {
      return true;
    }
    return false;
  }
}


module.exports = {PeriodGenerator};
