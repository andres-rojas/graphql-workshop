const fs = require("fs");
const path = require("path");
const { generate: generateId } = require("shortid");

const originData = path.resolve(__dirname, "../data/monstersRaw.json");

const data = JSON.parse(fs.readFileSync(originData));

const environmentNames = Object.keys(data);

const { environments, monsters } = environmentNames.reduce(
  ({ environments, monsters }, environment) => {
    const newEnvironment = { id: generateId(), name: environment };
    const newMonsters = data[environment].map(monster => ({
      ...monster,
      environmentIds: [newEnvironment.id],
      id: generateId()
    }));
    newEnvironment.monsterIds = newMonsters.map(monster => monster.id);
    return {
      environments: environments.concat([newEnvironment]),
      monsters: monsters.concat(newMonsters)
    };
  },
  { environments: [], monsters: [] }
);

const outputPath = path.resolve(__dirname, "../data/seed.json");

fs.writeFileSync(
  outputPath,
  JSON.stringify({ environments, monsters }, null, 4)
);
