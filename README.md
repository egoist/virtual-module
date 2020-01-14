# virtual-module

[![NPM version](https://badgen.net/npm/v/virtual-module)](https://npmjs.com/package/virtual-module) [![NPM downloads](https://badgen.net/npm/dm/virtual-module)](https://npmjs.com/package/virtual-module) [![CircleCI](https://badgen.net/circleci/github/egoist/virtual-module/master)](https://circleci.com/gh/egoist/virtual-module/tree/master) [![chat](https://badgen.net/badge/chat%20on/discord/7289DA)](https://chat.egoist.sh)

**Evaluate a module in sandbox.** This package is extracted and modified from vue-server-renderer.

## Install

```bash
yarn add virtual-module
```

## Usage

```js
const { createModule } = require('virtual-module')

const evaluate = createModule({
  'entry.js': `
    const isThree = require('./is-three')
    module.exports = context => isThree(context.a + context.b)
  `,
  'is-three.js': `
    module.exports = input => input === 3
  `
})

evaluate('entry.js')({ a: 1, b: 2 })
//=> true

evaluate('is-three.js')(4)
//=> false
```

## API

https://virtual-module.egoist.sh

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

**virtual-module** © [EGOIST](https://github.com/egoist), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by EGOIST with help from contributors ([list](https://github.com/egoist/virtual-module/contributors)).

> [egoist.sh](https://egoist.sh) · GitHub [@EGOIST](https://github.com/egoist) · Twitter [@\_egoistlily](https://twitter.com/_egoistlily)
