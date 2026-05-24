export default {
  testEnvironment: 'node',
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/cluster.js',
    '!src/config/**/*.js',
  ],
  coverageDirectory: 'coverage',
  testMatch: ['**/tests/**/*.test.js'],
};
