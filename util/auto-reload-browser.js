const path = require("node:path");
const rootPath = require("./path");
const liveReload = require("livereload");
const connectLiveReload = require("connect-livereload");

// open livereload high port and start to watch public directory for changes
const liveReloadServer = liveReload.createServer();
const watchPath = path.join(rootPath);
liveReloadServer.watch(watchPath);

// ping browser on Express boot, once browser has reconnected and handshaken
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 10);
});

module.exports = connectLiveReload;

// // monkey patch every served HTML so they know of changes
// app.use(connectLivereload());
