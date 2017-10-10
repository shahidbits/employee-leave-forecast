const {WorkEventApp, WorkEventController, WORK_EVENT_ROUTES} = require('../../workevent_server');

class WorkEventTestServer {
  constructor() {
    this.server = null;
  }

  init(port) {
    const getDelay = () => 0;
    const workEventController = new WorkEventController();
    this.server = new WorkEventApp(workEventController);
    this.server.init(port);
  }

  close() {
    this.server.close();
  }
}

module.exports = {WorkEventTestServer, WORK_EVENT_ROUTES};
