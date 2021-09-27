module.exports = function (config) {
  config.set({
    frameworks: ["mocha", "chai", "karma-typescript"],
    files: [
      "src/**/*.+(ts|tsx)", // *.tsx for React Jsx
      {
        pattern: "node_modules/@dittolive/ditto/web/ditto.wasm",
        included: false,
        served: true,
        type: "wasm",
      },
    ],
    preprocessors: {
      "**/*.+(ts|tsx)": ["karma-typescript"],
    },
    reporters: ["mocha", "karma-typescript"],
    port: 9876, // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity,
    singleRun: true,
    mime: {
      "application/wasm": ["wasm"],
    },
    karmaTypescriptConfig: {
      tsconfig: "./tsconfig.json",
      bundlerOptions: {
        transforms: [
          require("karma-typescript-es6-transform")({
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    chrome: "92",
                  },
                },
              ],
            ],
          }),
        ],
      },
    },
  });
};
