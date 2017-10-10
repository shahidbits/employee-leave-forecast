const {WorkEventTestServer, WORK_EVENT_ROUTES} = require('./workevent_test_server');
const {WORK_EVENT_TYPE, WORK_EVENT_ERROR_MSG} = require('../../workEvent');

const chai = require('chai');
const request = require('request');
chai.should();
const expect = chai.expect;

describe('WorkEvent - Acceptance Tests', function () {
  let port;
  let workEventTestServer;

  before(function () {
    this.timeout(5000);
    port = 9876;
    workEventTestServer = new WorkEventTestServer();
    workEventTestServer.init(port);
  });

  after(function () {
    this.timeout(1000);
    workEventTestServer.close();
  });

  beforeEach(function () {
    this.timeout(500);
  });

  it('should give error as period is missing', function (done) {
    this.timeout(5000);

    request.post({url: 'http://localhost:' + port + WORK_EVENT_ROUTES.GENERATE_WORK_EVENT}, (err, httpResponse, body) => {
      let data = JSON.parse(body);
      expect(data.error).to.be.true;
      expect(httpResponse.statusCode).to.equal(400);
      expect(data.message).to.equal(WORK_EVENT_ERROR_MSG.MISSING_PERIOD);
      done();
    });
  });

  it('should give error as country is missing', function (done) {
    this.timeout(5000);

    let formData = {
      "period": {
        "start": "18 Jan 2018",
        "end": "30 Mar 2018"
      }
    };
    request.post({
      url: 'http://localhost:' + port + WORK_EVENT_ROUTES.GENERATE_WORK_EVENT,
      form: formData
    }, function (err, httpResponse, body) {
      let data = JSON.parse(body);
      expect(data.error).to.be.true;
      expect(httpResponse.statusCode).to.equal(400);
      expect(data.message).to.equal(WORK_EVENT_ERROR_MSG.MISSING_COUNTRY);
      done();
    });

  });

  it('should give error as period is invalid', function (done) {
    this.timeout(5000);

    let formData = {
      "period": {
        "start": "18 Apr 2018",
        "end": "30 Mar 2018"
      },
      "country": "Estonia"
    };
    request.post({
      url: 'http://localhost:' + port + WORK_EVENT_ROUTES.GENERATE_WORK_EVENT,
      form: formData
    }, function (err, httpResponse, body) {
      let data = JSON.parse(body);
      expect(data.error).to.be.true;
      expect(httpResponse.statusCode).to.equal(400);
      expect(data.message).to.equal(WORK_EVENT_ERROR_MSG.INVALID_PERIOD);
      done();
    });
  });

  it('should give error as leave period is invalid', function (done) {
    this.timeout(5000);

    let formData = {
      "period": {
        "start": "18 Jan 2018",
        "end": "30 Mar 2018"
      },
      "country": "Estonia",
      "leaves": [
        {
          "start": "16 Jan 2019",
          "end": "22 Jan 2018"
        }
      ]
    };
    request.post({
      url: 'http://localhost:' + port + WORK_EVENT_ROUTES.GENERATE_WORK_EVENT,
      form: formData
    }, function (err, httpResponse, body) {
      let data = JSON.parse(body);
      expect(data.error).to.be.true;
      expect(httpResponse.statusCode).to.equal(400);
      expect(data.message).to.equal(WORK_EVENT_ERROR_MSG.INVALID_LEAVE);
      done();
    });
  });

  it('should give error as period dates are invalid', function (done) {
    this.timeout(5000);

    let formData = {
      "period": {
        "start": "invalid start date",
        "end": "invalid end date"
      },
      "country": "Estonia"
    };
    request.post({
      url: 'http://localhost:' + port + WORK_EVENT_ROUTES.GENERATE_WORK_EVENT,
      form: formData
    }, function (err, httpResponse, body) {
      let data = JSON.parse(body);
      expect(data.error).to.be.true;
      expect(httpResponse.statusCode).to.equal(400);
      expect(data.message).to.equal(WORK_EVENT_ERROR_MSG.INVALID_DATE_FORMAT);
      done();
    });
  });

  it('should give error as leave dates are invalid', function (done) {
    this.timeout(5000);

    let formData = {
      "period": {
        "start": "invalid start date",
        "end": "invalid end date"
      },
      "country": "Estonia",
      "leaves": [
        {
          "start": "16 Jan 2019",
          "end": "invalid_date"
        }
      ]
    };
    request.post({
      url: 'http://localhost:' + port + WORK_EVENT_ROUTES.GENERATE_WORK_EVENT,
      form: formData
    }, function (err, httpResponse, body) {
      let data = JSON.parse(body);
      expect(data.error).to.be.true;
      expect(httpResponse.statusCode).to.equal(400);
      expect(data.message).to.equal(WORK_EVENT_ERROR_MSG.INVALID_DATE_FORMAT);
      done();
    });
  });

  it('should give the work event in basic format', function (done) {
    this.timeout(50000);

    let formData = {
      "country": "Estonia",
      "formatType": WORK_EVENT_TYPE.BASIC,
      "skip": 1,
      "limit": 2,
      "period": {
        "start": "18 Jan 2018",
        "end": "30 Mar 2018"
      },
      "weekOff": [
        "sat",
        "sun"
      ],
      "leaves": [
        {
          "start": "16 Jan 2018",
          "end": "22 Jan 2018"
        },
        {
          "start": "21 Mar 2018",
          "end": "28 Mar 2018"
        }
      ]
    };

    request.post({
      url: 'http://localhost:' + port + WORK_EVENT_ROUTES.GENERATE_WORK_EVENT,
      form: formData
    }, function (err, httpResponse, body) {
      let data = JSON.parse(body);
      expect(err).to.equal(null);
      expect(httpResponse.statusCode).to.equal(200);
      expect(data).to.include.all.keys('totalDays', 'totalWeeklyOffs', 'totalHolidays', 'leaveDetails', 'totalLeaves', 'totalWorkingDays');
      expect(data.totalDays).to.equal(72);
      expect(data.totalWeeklyOffs).to.equal(20);
      expect(data.totalHolidays).to.equal(2);
      expect(data.leaveDetails).to.be.an('array').to.have.lengthOf(9);
      expect(data.totalLeaves).to.equal(9);
      expect(data.totalWorkingDays).to.equal(41);
      done();
    });
  });

  it('should give the work event in detail format', function (done) {
    this.timeout(50000);

    let formData = {
      "country": "Estonia",
      "formatType": WORK_EVENT_TYPE.DETAIL,
      "skip": 1,
      "limit": 2,
      "period": {
        "start": "18 Jan 2018",
        "end": "30 Mar 2018"
      },
      "weekOff": [
        "sat",
        "sun"
      ],
      "leaves": [
        {
          "start": "16 Jan 2018",
          "end": "22 Jan 2018"
        },
        {
          "start": "21 Mar 2018",
          "end": "28 Mar 2018"
        }
      ]
    };

    request.post({
      url: 'http://localhost:' + port + WORK_EVENT_ROUTES.GENERATE_WORK_EVENT,
      form: formData
    }, function (err, httpResponse, body) {
      let data = JSON.parse(body);
      expect(err).to.equal(null);
      expect(httpResponse.statusCode).to.equal(200);
      expect(data).to.include.all.keys('totalDays', 'totalWeeklyOffs', 'totalHolidays', 'leaveDetails', 'totalLeaves', 'totalWorkingDays');
      expect(data.totalDays).to.equal(72);
      expect(data.totalWeeklyOffs).to.equal(20);
      expect(data.totalHolidays).to.equal(2);
      expect(data.leaveDetails).to.be.an('array').to.have.lengthOf(9);
      expect(data.totalLeaves).to.equal(9);
      expect(data.totalWorkingDays).to.equal(41);
      expect(data.leaveDetails).to.be.an('array').to.have.lengthOf(9);
      expect(data.monthlyDetails).to.be.an('array').to.have.lengthOf(2);
      done();
    });
  });

});
