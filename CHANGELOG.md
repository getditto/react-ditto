# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.11.2](https://github.com/getditto/react-ditto/compare/v0.11.1...v0.11.2) (2024-12-02)

### [0.11.1](https://github.com/getditto/react-ditto/compare/v0.11.0...v0.11.1) (2024-05-22)


### Features

* add support for async setup functions ([78a7509](https://github.com/getditto/react-ditto/commit/78a7509eb241155e410b9e9bfe20c54983a3af29))
* match supported browsers with the `@dittolive/ditto` package. see [Ditto's documentation](https://docs.ditto.live/compatibility/js-web) for details. ([35c29d4](https://github.com/getditto/react-ditto/commit/35c29d476e6579f4dcf2527b9908849dc0b781f9)), closes [#48](https://github.com/getditto/react-ditto/issues/48)


### Bug Fixes

* remove implicit dependency on `lodash` ([9b56f93](https://github.com/getditto/react-ditto/commit/9b56f9331de4e5718478717d0c9527dca2764d15))
* throw when setup closure does not return a `Ditto` instance ([36d7e58](https://github.com/getditto/react-ditto/commit/36d7e58ea62c719ff44265716c4d09a46c85bd5b))

## [0.11.0](https://github.com/getditto/react-ditto/compare/v0.11.0-alpha.0...v0.11.0) (2023-03-22)

### ⚠ BREAKING CHANGES

* upgrade `@dittolive/ditto` peer dependency to ^4.0.0

### Features

* upgrade `@dittolive/ditto` peer dependency to ^4.0.0 ([8dd7043](https://github.com/getditto/react-ditto/commit/8dd7043d8c5b07b151415577415947b7348be082))

## [0.11.0-alpha.0](https://github.com/getditto/react-ditto/compare/v0.10.0...v0.11.0-alpha.0) (2023-01-23)


### ⚠ BREAKING CHANGES

* upgrade `@dittolive/ditto` peer dependency to ^4.0.0-alpha2

### Features

* upgrade `@dittolive/ditto` peer dependency to ^4.0.0-alpha2 ([184fb1c](https://github.com/getditto/react-ditto/commit/184fb1c053b1d8332712c359915f4f4226703f94))

## [0.10.0](https://github.com/getditto/react-ditto/compare/v0.9.3...v0.10.0) (2023-01-23)


### ⚠ BREAKING CHANGES

* upgrade `@dittolive/ditto` peer dependency to ^3.0.0

### Features

* upgrade `@dittolive/ditto` peer dependency to ^3.0.0 ([38ea43d](https://github.com/getditto/react-ditto/commit/38ea43d3f433aed0228e00f1e1010824e00adf1d))

### [0.9.3](https://github.com/getditto/react-ditto/compare/v0.9.2...v0.9.3) (2022-11-23)

### Features

* added hook for creating onlinePlayground identities ([2ae0aed](https://github.com/getditto/react-ditto/commit/2ae0aedc607d9d336571eb1c5765790aff52d968))

### [0.9.2](https://github.com/getditto/react-ditto/compare/v0.9.1...v0.9.2) (2022-11-10)

### [0.9.1](https://github.com/getditto/react-ditto/compare/v0.9.0...v0.9.1) (2022-11-10)


### Features

* replace deprecated usages of `observe` with `subscribe` and `observeLocal` ([54b7dcf](https://github.com/getditto/react-ditto/commit/54b7dcf80c9886f018a550b25c2ce570261fcc12))
* upgrade `@dittolive/ditto` to v2.1.0 ([4c16cf7](https://github.com/getditto/react-ditto/commit/4c16cf7b2b91212370e8dd64483780e4034337fa))

## [0.9.0](https://github.com/getditto/react-ditto/compare/v0.9.0-alpha.0...v0.9.0) (2022-08-04)


### Features

* upgrade `@dittolive/ditto` to v2.0.0 ([d87a378](https://github.com/getditto/react-ditto/commit/d87a37893b376971e37c67ab47742acb69c1d285))


### Bug Fixes

* use `DocumentID` as ID type instead of `DocumentIDValue` ([7748d45](https://github.com/getditto/react-ditto/commit/7748d4512277ebbb7c4bfce355dbb0340d19c30d))

## [0.9.0-alpha.0](https://github.com/getditto/react-ditto/compare/v0.8.0...v0.9.0-alpha.0) (2022-07-26)


### ⚠ BREAKING CHANGES

* upgrade `@dittolive/ditto` to v2.0.0-alpha1

### Features

* upgrade `@dittolive/ditto` to v2.0.0-alpha1 ([84962f6](https://github.com/getditto/react-ditto/commit/84962f6d963b2554e39b7614003755459fae3707))

## [0.8.0](https://github.com/getditto/react-ditto/compare/v0.7.0...v0.8.0) (2022-07-25)


### ⚠ BREAKING CHANGES

* remove `insert` in favor of `upsert`

### Features

* remove `insert` in favor of `upsert` ([7350f6a](https://github.com/getditto/react-ditto/commit/7350f6a9907f1a78183b12c792e51a759b2fb593))
