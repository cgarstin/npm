const PATH = require('path');

module.exports = {
    verbose: false,
    testMatch: ['**/__tests__/**/*.js?(x)'], // only files inside the __tests__ folder
    transform: {
        '^.+\\.jsx?$': PATH.join(__dirname, 'lib', 'test-transform'),
    },
};
