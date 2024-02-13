module.exports = {
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/'],
  testMatch: [
    "<rootDir>/src/server/**/*.test.ts"
  ],
  moduleFileExtensions: ['ts', 'js', 'mjs', 'json'],
  // moduleNameMapper: {
  //   '^axios$': require.resolve('axios'),
  // },
  restoreMocks: true,
  resetMocks: true,
  moduleDirectories: ['node_modules', '<rootDir>/src/'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
};
