const nodemon = require("nodemon");
const path = require("path");

const projectRoot = path.resolve(__dirname, "../");

nodemon({
  script: path.resolve(projectRoot, "server/index.js"),
  ext: "js json graphql",
  ignore: [
    path.resolve(projectRoot, "client/"),
    "node_modules/**/node_modules",
    ".git"
  ],
  watch: [path.resolve(projectRoot, "server/")]
});

nodemon
  .on("start", function() {
    console.log("App has started");
  })
  .on("quit", function() {
    console.log("App has quit");
  })
  .on("restart", function(files) {
    console.log("App restarted due to: ", files);
  });
