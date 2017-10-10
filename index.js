const {WorkEventApp, WorkEventController} = require('./workevent_server');
const workEventController = new WorkEventController();
const server = new WorkEventApp(workEventController);
server.init(8765);
