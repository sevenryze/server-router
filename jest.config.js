// Import node.js libraries

// Import third-party libraries

// Import own libraries

/**********************************************************************************************************************/
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },

  testMatch: ["**/__tests__/**/*.ts?(x)"],
  testPathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/node_modules/"],
  watchPathIgnorePatterns: ["<rootDir>/(?!src)"],
  collectCoverageFrom: ["<rootDir>/src/**/*.ts"],

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
};
