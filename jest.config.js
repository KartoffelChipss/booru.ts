/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // Integration tests hit real booru APIs, which can be slow.
    testTimeout: 20000,
};
