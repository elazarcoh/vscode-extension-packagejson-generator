const config = {
  require: ['ts-node/register', 'mocha-suppress-logs', 'mocha-steps'],
  spec: ['test/*.test.ts'],
};
module.exports = config;
