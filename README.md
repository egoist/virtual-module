# bundle-runner

[![NPM version](https://badgen.net/npm/v/bundle-runner)](https://npmjs.com/package/bundle-runner) [![NPM downloads](https://badgen.net/npm/dm/bundle-runner)](https://npmjs.com/package/bundle-runner) [![CircleCI](https://badgen.net/circleci/github/egoist/bundle-runner/master)](https://circleci.com/gh/egoist/bundle-runner/tree/master) [![donate](https://badgen.net/badge/support%20me/donate/ff69b4)](https://patreon.com/egoist) [![chat](https://badgen.net/badge/chat%20on/discord/7289DA)](https://chat.egoist.moe)

**Evaluate a module in sandbox.** This module is extracted and modified from vue-server-renderer.

## Install

```bash
yarn add @egoist/bundle-runner
```

## Usage

```js
const { createBundleRunner } = require('@egoist/bundle-runner')

const runner = createBundleRunner('entry.js', {
  'entry.js': `
    const isThree = require('./is-three')
    module.exports = context => isThree(context.a + context.b)
  `,
  'is-three.js': `
    module.exports = input => input === 3
  `
})

runner({ a: 1, b: 2 }).then(result => {
  console.log(result)
  //=> true
})
```

Note: the entry file must have a default export, i.e. `module.exports` or `module.exports.default`

## API

Check out the type documentations at https://bundle-runner.egoist.sh

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

**bundle-runner** © [EGOIST](https://github.com/egoist), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by EGOIST with help from contributors ([list](https://github.com/egoist/bundle-runner/contributors)).

> [egoist.sh](https://egoist.sh) · GitHub [@EGOIST](https://github.com/egoist) · Twitter [@\_egoistlily](https://twitter.com/_egoistlily)
