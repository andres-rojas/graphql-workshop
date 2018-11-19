const fs = require("fs");
const path = require("path");
const { generate: generateId } = require("shortid");

const originData = path.resolve(__dirname, "../data/monstersRaw.json");

const data = JSON.parse(fs.readFileSync(originData));

const environmentNames = Object.keys(data);

const { environments, monsters } = environmentNames.reduce(
  ({ environments, monsters }, environment) => {
    const newEnvironment = { id: generateId(), name: environment };
    return {
      environments: environments.concat([newEnvironment]),
      monsters: monsters.concat(
        data[environment].map(monster => ({
          ...monster,
          environmentId: newEnvironment.id,
          id: generateId()
        }))
      )
    };
  },
  { environments: [], monsters: [] }
);

const outputPath = path.resolve(__dirname, "../data/db.json");

fs.writeFileSync(
  outputPath,
  JSON.stringify({ environments, monsters }, null, 4)
);
