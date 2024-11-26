module.exports = function (config) {
  config.set({
    frameworks: ['mocha', 'chai', 'karma-typescript'],
    files: [
      'src/**/*.+(ts|tsx)', // *.tsx for React Jsx
      {
        pattern: 'node_modules/@dittolive/ditto/web/ditto.wasm',
        included: false,
        served: true,
        type: 'wasm',
      },
    ],
    preprocessors: {
      '**/*.+(ts|tsx)': ['karma-typescript'],
    },
    reporters: ['mocha', 'karma-typescript'],
    port: 9876, // karma web server port
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    autoWatch: false,
    // singleRun: false, // Karma captures browsers, runs the tests and exits
    concurrency: Infinity,
    singleRun: true,
    mime: {
      'application/wasm': ['wasm'],
    },
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.json',
      bundlerOptions: {
        // Explicitly configure Karma's parser to expect ES2020 syntax.
        acornOptions: {
          ecmaVersion: 2020,
        },
        transforms: [
          require('karma-typescript-es6-transform')({
            presets: [['@babel/preset-env']],
          }),
        ],
      },
    },
    parallelOptions: {
      executors: 8, // Defaults to cpu-count - 1
      shardStrategy: 'round-robin',
    },
    client: {
      captureConsole: true,
    },
  })
}
