ExplorerLib
=======

[![NPM Package](https://img.shields.io/npm/v/@owstack/explorer-lib.svg?style=flat-square)](https://www.npmjs.org/package/@owstack/explorer-lib)
[![Build Status](https://img.shields.io/travis/owstack/explorer-lib.svg?branch=master&style=flat-square)](https://travis-ci.org/owstack/explorer-lib)
[![Coverage Status](https://img.shields.io/coveralls/owstack/explorer-lib.svg?style=flat-square)](https://coveralls.io/r/owstack/explorer-lib)

A JavaScript blockchain explorer library.

## Get Started

```
npm install @owstack/explorer-lib
```

## Documentation

The complete docs are hosted here: [explorer-api documentation](https://github.com/owstack/explorer-api/blob/master/README.md).

## Security

If you find a security issue, please email security@openwalletstack.com.

## Contributing

Please send pull requests for bug fixes, code optimization, and ideas for improvement. For more information on how to contribute, please refer to our [CONTRIBUTING](https://github.com/owstack/key-lib/blob/master/CONTRIBUTING.md) file.

## Building the Browser Bundle

To build a explorer-lib full bundle for the browser:

```sh
gulp browser
```

This will generate files named `explorer-lib.js` and `explorer-lib.min.js`.

## Development & Tests

```sh
git clone https://github.com/owstack/explorer-lib
cd explorer-lib
npm install
```

Run all the tests:

```sh
gulp test
```

You can also run just the Node.js tests with `gulp test:node`, just the browser tests with `gulp test:browser`
or create a test coverage report (you can open `coverage/lcov-report/index.html` to visualize it) with `gulp coverage`.

## License

Code released under [the MIT license](https://github.com/owstack/explorer-lib/blob/master/LICENSE).

Copyright 2019 Open Wallet Stack.
