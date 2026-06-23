module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      startServerCommand: 'cd backend && PORT=3000 node --loader tsx src/server.ts',
      numberOfRuns: 3,
      startServerReadyTimeout: 60000,
    },
    upload: {
      target: 'filesystem',
    },
  },
};
