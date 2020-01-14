import assert from 'assert'
import { createModule } from '../src'

const files = {
  'entry.js': `
    const inc = require('./inc')

    global.count = 42

    module.exports = () => {
      return inc()
    }
  `,
  'inc.js': `
    let count = 0
    module.exports = () => count++
  `
}

const evaluate = createModule(files, {
  sandbox: false
})

const entry = evaluate<() => number, keyof typeof files>('entry.js')

entry()

entry()
entry()

assert(entry() === 3)
// @ts-ignore
assert(global.count === 42)

console.log(`Test passed!`)
