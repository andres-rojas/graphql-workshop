// A map of functions which return data for the schema.
module.exports = {
  Query: {
    hello: () => "world",
    monsters: (_parent, _args, context) =>
      context.api.get('/monsters').then(r => r.data)
  },
  Mutation: {
    createMonster: (_parent, args, context) =>
      context.api.post('/monsters', args.monster).then(r => r.data)
  },
  Monster: {
    hp: monster => parseInt(monster.hp, 10)
  }
};
