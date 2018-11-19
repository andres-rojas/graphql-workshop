// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", err => {
  throw err;
});

// Ensure environment variables are read.
require("../config/env");

const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const chalk = require("chalk");
const webpack = require("webpack");
const WebpackDevMiddleware = require("webpack-dev-middleware");
const clearConsole = require("react-dev-utils/clearConsole");
const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles");
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls
} = require("react-dev-utils/WebpackDevServerUtils");
const openBrowser = require("react-dev-utils/openBrowser");
const paths = require("../config/paths");
const config = require("../config/webpack.config.dev");
const createDevServerConfig = require("../config/webpackDevServer.config");

const useYarn = fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTTY;
const express = require("express");
const jsonServer = require("json-server");
const { ApolloServer, gql } = require("apollo-server-express");
const axios = require("axios");

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// Tools like Cloud9 rely on this.
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();

const getMonster = async (context, id) =>
  context.api.get(`/monsters/${id}`).then(r => r.data);
const getEnvironment = async (context, id) =>
  context.api.get(`/environments/${id}`).then(r => r.data);
// A map of functions which return data for the schema.
const resolvers = {
  Mutation: {
    createMonster: async (_parent, args, context) => {
      return context.api
        .post(`/monsters`, {
          ...args.monster
        })
        .then(r => r.data);
    }
  },
  Query: {
    monsters: async (_parent, args, context) => {
      const filter = Object.keys(args.filter || {})
        .map(key => `${key}_like=${args.filter[key]}`)
        .join("&");
      return context.api.get(`/monsters?${filter}`).then(r => r.data);
    },
    environments: (_parent, _args, context) =>
      context.api.get("/environments").then(r => r.data),
    monster: async (_parent, args, context) => getMonster(context, args.id),
    environment: async (_parent, args, context) =>
      getEnvironment(context, args.id)
  },
  Monster: {
    armor: monster => Number.parseInt(monster.armor, 10),
    attack_tags: monster =>
      monster.attack_tags
        .split(",")
        .map(t => t.trim().toUpperCase())
        .filter(t => t.length > 0),
    hp: monster => Number.parseInt(monster.hp, 10),
    specialQualities: monster => monster.special_qualities,
    environments: async (monster, _args, context) =>
      Promise.all(
        monster.environmentIds.map(envId => getEnvironment(context, envId))
      )
  },
  Environment: {
    monsters: async (environment, _args, context) =>
      Promise.all(
        environment.monsterIds.map(monsterId =>
          context.api.get(`/monsters/${monsterId}`).then(r => r.data)
        )
      )
  }
};

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(
    `Learn more here: ${chalk.yellow("http://bit.ly/CRA-advanced-config")}`
  );
  console.log();
}

const ensureDB = async () => {
  const dbPath = path.resolve(__dirname, "../data/db.json");
  const seedPath = path.resolve(__dirname, "../data/seed.json");
  console.log(
    chalk.cyan(`Ensuring database is setup at: ${chalk.yellow(dbPath)}`)
  );
  const fileExists = promisify(fs.exists);

  const dbIsSeeded = await fileExists(
    path.resolve(__dirname, "../data/db.json")
  );

  if (dbIsSeeded) return true;

  console.log(
    chalk.red(
      `No DB currently exists, seeding data from ${chalk.yellow(seedPath)}`
    )
  );

  return promisify(fs.copyFile)(
    path.resolve(__dirname, "../data/seed.json"),
    path.resolve(__dirname, "../data/db.json")
  ).then(() => true);
};

// We require that you explictly set browsers and do not fall back to
// browserslist defaults.
const { checkBrowsers } = require("react-dev-utils/browsersHelper");
Promise.all([checkBrowsers(paths.appPath, isInteractive), ensureDB()])
  .then(() => {
    // We attempt to use the default port but if it is busy, we offer the user to
    // run on a different port. `choosePort()` Promise resolves to the next free port.
    return choosePort(HOST, DEFAULT_PORT);
  })
  .then(port => {
    if (port == null) {
      // We have not found a port.
      return;
    }
    const protocol = process.env.HTTPS === "true" ? "https" : "http";
    const appName = require(paths.appPackageJson).name;
    const urls = prepareUrls(protocol, HOST, port);
    // Create a webpack compiler that is configured with custom messages.
    const compiler = createCompiler(webpack, config, appName, urls, useYarn);
    // Load proxy config
    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(proxySetting, paths.appPublic);

    // Serve webpack assets generated by the compiler over a web server.
    const serverConfig = createDevServerConfig(
      proxyConfig,
      urls.lanUrlForConfig
    );

    // const devServer = new WebpackDevServer(compiler, serverConfig);
    const devMiddleware = new WebpackDevMiddleware(compiler, serverConfig);
    app.use(devMiddleware);
    app.use(require("webpack-hot-middleware")(compiler));
    app.use(
      "/rest",
      jsonServer.router(path.resolve(__dirname, "../data/db.json"))
    );
    const graphQLServer = new ApolloServer({
      typeDefs: fs.readFileSync(path.join(__dirname, "schema.graphql"), "utf8"),
      resolvers,
      context: {
        api: axios.create({
          baseURL: `http://${HOST}:${port}/rest`
        })
      }
    });
    graphQLServer.applyMiddleware({ app });
    const server = app.listen(port, HOST, err => {
      if (err) {
        return console.log(err);
      }
      // if (isInteractive) {
      //   clearConsole();
      // }
      console.log(chalk.cyan("Starting the development server...\n"));
      // openBrowser(urls.localUrlForBrowser);
    });
    ["SIGINT", "SIGTERM"].forEach(function(sig) {
      process.on(sig, function() {
        server.close();
        process.exit();
      });
    });
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
