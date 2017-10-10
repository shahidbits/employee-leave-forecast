const {DetailGenerator} = require('../../detailGenerator');
const {PeriodGenerator} = require('../../periodGenerator');

const moment = require('moment');
const chai = require('chai');
chai.should();
const expect = chai.expect;


describe('WorkEvent - Unit Tests', function () {

  before(function () {
  });

  after(function () {
  });

  beforeEach(function () {
    this.timeout(100);
  });

  it('should calculate the correct number of days in a period', function (done) {

    let period = {
      "start": "18 Jan 2018",
      "end": "30 Mar 2018"
    };

    const periodGenerator = new PeriodGenerator("", period, {}, {});
    expect(periodGenerator.getTotalDays()).to.equal(72);
    done();
  });

  it('should calculate the correct number of weekly offs in a period with two days week off', function (done) {

    let period = {
      "start": "1 Apr 2018",
      "end": "31 Mar 2019"
    };
    let weekOff = [
      "sat",
      "sun"
    ];

    const periodGenerator = new PeriodGenerator("", period, {}, weekOff);
    expect(periodGenerator.getWeeklyOffDetails()).to.equal(105);
    done();
  });

  it('should calculate the correct number of weekly offs in a period with one day week off', function (done) {

    let period = {
      "start": "1 Apr 2018",
      "end": "31 Mar 2019"
    };
    let weekOff = [
      "sun"
    ];

    const periodGenerator = new PeriodGenerator("", period, {}, weekOff);
    expect(periodGenerator.getWeeklyOffDetails()).to.equal(53);
    done();
  });

  it('should calculate the correct number of weekly offs in a period without any week off', function (done) {

    let period = {
      "start": "1 Apr 2018",
      "end": "31 Mar 2019"
    };
    let weekOff = [];

    const periodGenerator = new PeriodGenerator("", period, {}, weekOff);
    expect(periodGenerator.getWeeklyOffDetails()).to.equal(0);
    done();
  });

  it('should re-calculate the leave period according to the given period - start issue', function (done) {

    let period = {
      "start": "18 Jan 2018",
      "end": "31 Mar 2018"
    };
    let leavePeriod = {
      "start": "16 Jan 2018",
      "end": "22 Jan 2018"
    };

    const periodGenerator = new PeriodGenerator("", period, {}, []);
    const data = periodGenerator.getLeavePeriodInPeriodRange(leavePeriod);
    expect(data.start).to.equal(period.start);
    expect(data.end).to.equal(leavePeriod.end);
    done();
  });

  it('should re-calculate the leave period according to the given period - end issue', function (done) {

    let period = {
      "start": "18 Jan 2018",
      "end": "31 Mar 2018"
    };
    let leavePeriod = {
      "start": "29 Mar 2018",
      "end": "2 Apr 2018"
    };

    const periodGenerator = new PeriodGenerator("", period, {}, []);
    const data = periodGenerator.getLeavePeriodInPeriodRange(leavePeriod);
    expect(data.start).to.equal(leavePeriod.start);
    expect(data.end).to.equal(period.end);
    done();
  });

  it('should check if given day is a weekly off or not', function (done) {

    let givenDate1 = "1 Apr 2018";
    let givenDate2 = "5 Mar 2018";
    let givenDate3 = "17 Aug  2018";
    let givenDate4 = "21 Dec 2018";
    let givenDate5 = "31 Mar 2019";

    let weekOff = [
      "sun"
    ];

    const periodGenerator = new PeriodGenerator("", {}, {}, weekOff);
    expect(periodGenerator.isWeeklyOff(moment(new Date(givenDate1)))).to.equal(true);
    expect(periodGenerator.isWeeklyOff(moment(new Date(givenDate2)))).to.equal(false);
    expect(periodGenerator.isWeeklyOff(moment(new Date(givenDate3)))).to.equal(false);
    expect(periodGenerator.isWeeklyOff(moment(new Date(givenDate4)))).to.equal(false);
    expect(periodGenerator.isWeeklyOff(moment(new Date(givenDate5)))).to.equal(true);
    done();
  });

  it('should return years in a given period - single year', function (done) {

    let period = {
      "start": "18 Jan 2018",
      "end": "31 Mar 2018"
    };

    let periodGenerator = new PeriodGenerator("", period, {}, []);
    let data = periodGenerator.getPeriodYears();
    expect(data).to.be.an('array').to.have.lengthOf(1);
    expect(data).to.include(2018);
    done();
  });

  it('should return years in a given period - multiple years', function (done) {

    let period = {
      "start": "1 Apr 2018",
      "end": "31 Mar 2021"
    };

    let periodGenerator = new PeriodGenerator("", period, {}, []);
    let data = periodGenerator.getPeriodYears();
    expect(data).to.be.an('array').to.have.lengthOf(4);
    expect(data).to.include(2018);
    expect(data).to.include(2019);
    expect(data).to.include(2020);
    expect(data).to.include(2021);
    done();
  });

  it('should return leaves details for a given leave period for a set of period, holidays and week offs', function (done) {

    let period = {
      "start": "18 Jan 2018",
      "end": "31 Mar 2018"
    };
    let leavePeriod = {
      "start": "16 Jan 2018",
      "end": "22 Jan 2018"
    };
    let holidays = [
      "16 Jan 2018",
      "18 Jan 2018"
    ];
    let weekOff = [
      "sat",
      "sun"
    ];

    let periodGenerator = new PeriodGenerator("", period, {}, weekOff);
    let data = periodGenerator.evaluateLeavePeriod(leavePeriod, holidays);
    expect(data).to.be.an('array').to.have.lengthOf(3);
    expect(data).to.include("18 Jan 2018");
    expect(data).to.include("19 Jan 2018");
    expect(data).to.include("22 Jan 2018");
    done();
  });

  it('should return leaves details for a set of period, leaves, holidays and week offs', function (done) {

    let period = {
      "start": "1 Jan 2018",
      "end": "31 Mar 2018"
    };
    let weekOff = [
      "sat",
      "sun"
    ];
    let holidays = [
      "16 Jan 2018",
      "18 Jan 2018",
      "22 Feb 2018",
      "3 Mar 2018",
      "22 Mar 2018",
      "23 Mar 2018",
    ];
    let leaves = [
      {
        "start": "16 Jan 2018",
        "end": "22 Jan 2018"
      },
      {
        "start": "21 Mar 2018",
        "end": "28 Mar 2018"
      }
    ];

    const periodGenerator = new PeriodGenerator("", period, leaves, weekOff);
    let data = periodGenerator.getLeaveDetails(holidays);
    expect(data).to.be.an('array').to.have.lengthOf(11);
    expect(data).to.include("16 Jan 2018");
    expect(data).to.include("17 Jan 2018");
    expect(data).to.include("18 Jan 2018");
    expect(data).to.include("19 Jan 2018");
    expect(data).to.include("22 Jan 2018");
    expect(data).to.include("21 Mar 2018");
    expect(data).to.include("22 Mar 2018");
    expect(data).to.include("23 Mar 2018");
    expect(data).to.include("26 Mar 2018");
    expect(data).to.include("27 Mar 2018");
    expect(data).to.include("28 Mar 2018");
    done();
  });

});
