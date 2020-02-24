import assert from 'assert'
import path from 'path'
import { createModule } from '../src'

const files = {
  'entry.js': `
    const inc = require('inc.js')

    global.count = 42

    module.exports = () => {
      return inc()
    }

    module.exports.foo = () => require('foo')
  `,
  'inc.js': `
    let count = 0
    module.exports = () => count++
  `
}

const evaluate = createModule(files, {
  sandbox: false,
  baseDir: path.join(__dirname, 'fixture')
})

const entry = evaluate<any, keyof typeof files>('entry.js')

entry()

entry()
entry()

assert(entry() === 3)
// @ts-ignore
assert(global.count === 42)

console.log(`Test passed!`)

assert(entry.foo() === 'foo')
