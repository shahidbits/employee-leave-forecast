const moment = require('moment');
const {DetailGenerator} = require('./detailGenerator');
const {PeriodGenerator} = require('./periodGenerator');
const WORK_EVENT_TYPE = {BASIC: "1", DETAIL: "2"};

const WORK_EVENT_ERROR_MSG = {
  MISSING_PERIOD: "MISSING_PERIOD: Provide a period object (Eg- {start: 1 Jan 2018, end: 31 Mar 2018})",
  MISSING_COUNTRY: "MISSING_COUNTRY: Provide a country (Eg- Estonia)",
  INVALID_PERIOD: "INVALID_PERIOD: End date is falling before start date of the period",
  INVALID_LEAVE: "INVALID_LEAVE: End date is falling before start date of a leave period",
  INVALID_DATE_FORMAT: "INVALID_DATE_FORMAT: Please provide date in correct format (Eg - 1 Mar 2018)"
};

const WORK_EVENT_ERROR_TYPE = {
  INVALID: 'INVALID',
  SERVER: 'SERVER',
  NOT_FOUND: 'NOT_FOUND'
};

class WorkEvent {

  generate(country, period, leaves, weekOff, formatType, pagination, callback) {

    const self = this;
    let start;
    let end;

    this.isDataMising(period, country);
    this.isPeriodValid(period);
    this.isLeavePeriodValid(leaves);

    switch (formatType) {

      case WORK_EVENT_TYPE.DETAIL:
        let monthlyData = new DetailGenerator(country, period, leaves, weekOff, pagination);
        monthlyData.getWorkEvent((err, data) => {
          if (err) {
            throw new WorkEventError(WORK_EVENT_ERROR_TYPE.SERVER, err);
          } else {
            callback(err, data);
          }
        });
        break;

      case WORK_EVENT_TYPE.BASIC:
      default:
        let periodData = new PeriodGenerator(country, period, leaves, weekOff);
        periodData.getWorkEvent((err, data) => {
          if (err) {
            throw new WorkEventError(WORK_EVENT_ERROR_TYPE.SERVER, err);
          } else {
            callback(err, data);
          }
        });
        break;
    }
  }

  isDataMising(period, country) {
    if (!period || period == {}) {
      throw new WorkEventError(WORK_EVENT_ERROR_TYPE.INVALID, WORK_EVENT_ERROR_MSG.MISSING_PERIOD);
    }

    if (!country) {
      throw new WorkEventError(WORK_EVENT_ERROR_TYPE.INVALID, WORK_EVENT_ERROR_MSG.MISSING_COUNTRY);
    }
    return true;
  }

  isPeriodValid(period) {
    let start = moment(new Date(period.start));
    let end = moment(new Date(period.end));
    if (!start.isValid() || !end.isValid()) {
      throw new WorkEventError(WORK_EVENT_ERROR_TYPE.INVALID, WORK_EVENT_ERROR_MSG.INVALID_DATE_FORMAT);
    }

    if (end.diff(start) < 0) {
      throw new WorkEventError(WORK_EVENT_ERROR_TYPE.INVALID, WORK_EVENT_ERROR_MSG.INVALID_PERIOD);
    }
    return true;
  }

  isLeavePeriodValid(leaves) {
    if (leaves && leaves.length > 0) {
      let startLeave;
      let endLeave;
      for (let i = 0; i < leaves.length; i++) {
        startLeave = moment(new Date(leaves[i].start));
        endLeave = moment(new Date(leaves[i].end));
        if (!startLeave.isValid() || !endLeave.isValid()) {
          throw new WorkEventError(WORK_EVENT_ERROR_TYPE.INVALID, WORK_EVENT_ERROR_MSG.INVALID_DATE_FORMAT);
        }
        if (endLeave.diff(startLeave) < 0) {
          throw new WorkEventError(WORK_EVENT_ERROR_TYPE.INVALID, WORK_EVENT_ERROR_MSG.INVALID_LEAVE);
        }
      }
    }
    return true;
  }
}

class WorkEventError {
  constructor(type, message) {
    this.type = type;
    this.message = message;
  }
}

module.exports = {WorkEvent, WorkEventError, WORK_EVENT_ERROR_TYPE, WORK_EVENT_TYPE, WORK_EVENT_ERROR_MSG};
