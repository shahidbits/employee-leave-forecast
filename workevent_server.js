const express = require('express');
const bodyParser = require('body-parser');
const {WorkEvent, WorkEventError, WORK_EVENT_ERROR_TYPE, WORK_EVENT_TYPE} = require('./workEvent');

const WORK_EVENT_ROUTES = {
  GENERATE_WORK_EVENT: '/v1/api/generate'
};

class WorkEventApp {

  constructor(workEventController) {
    this.workEventController = workEventController;
    this.server = null;
  }

  init(port) {

    const app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    app.get('/v1/api/generate', (req, res) => {
      console.log(req);
      this.workEventController.generate(req.body, (e, data) => this.serve(res, data))
    });

    app.post(WORK_EVENT_ROUTES.GENERATE_WORK_EVENT, (req, res) => this.workEventController.generate(req.body, (e, data) => this.serve(res, data)));

    // Error handling
    app.use((err, req, res, next) => {
      if (err instanceof WorkEventError) {
        this.serveError(res, WorkEventController.handleError(err));
        return;
      }

      next(err);
    });

    this.server = app.listen(port, () => console.log(`server running on port ${port}`));
  }

  close() {
    this.server && this.server.close();
    this.server = null;
  }

  serve(res, data) {
    res.send(data);
  }

  serveError(res, {status, data}) {
    res.status(status).send(data);
  }
}

class WorkEventController {

  constructor() {
  }

  generate({period, leaves, weekOff, country, skip, limit, formatType}, cb) {

    leaves = leaves || [];
    weekOff = weekOff || [];
    skip = skip || 0;
    limit = limit || 1;
    formatType = formatType || WORK_EVENT_TYPE.BASIC;

    let pagination = {
      skip: skip,
      limit: limit
    };

    const workEvent = new WorkEvent();
    workEvent.generate(country, period, leaves, weekOff, formatType, pagination, (err, data) => {
      cb(err, data);
    });

  }

  static handleError(err) {
    let status;
    switch (err.type) {
      case WORK_EVENT_ERROR_TYPE.INVALID:
        status = 400;
        break;
      case WORK_EVENT_ERROR_TYPE.SERVER:
        status = 500;
        break;
      case WORK_EVENT_ERROR_TYPE.NOT_FOUND:
      default:
        status = 404;
        break;
    }
    return {
      status,
      data: {
        message: err.message,
        error: true
      }
    };
  }
}

module.exports = {WorkEventApp, WorkEventController, WORK_EVENT_ROUTES};
