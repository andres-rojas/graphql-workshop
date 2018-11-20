const getMonster = async (context, id) =>
  context.api.get(`/monsters/${id}`).then(r => r.data);
const getEnvironment = async (context, id) =>
  context.api.get(`/environments/${id}`).then(r => r.data);

// A map of functions which return data for the schema.
module.exports = {
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
