import { createBundleRunner } from '../src'

test('simple', async () => {
  const runner = createBundleRunner('entry.js', {
    'entry.js': `
      const isThree = require('./is-three')
      module.exports = context => isThree(context.a + context.b)
    `,
    'is-three.js': `
      module.exports = input => input === 3
    `
  })

  const result = await runner({ a: 1, b: 2 })
  expect(result).toBe(true)
})
