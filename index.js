const vm = require('vm')
const path = require('path')
const resolve = require('resolve')
const NativeModule = require('module')

const isPlainObject = obj =>
  Object.prototype.toString.call(obj) === '[object Object]'

function createSandbox() {
  const sandbox = {
    Buffer,
    console,
    process,
    setTimeout,
    setInterval,
    setImmediate,
    clearTimeout,
    clearInterval,
    clearImmediate
  }
  sandbox.global = sandbox
  return sandbox
}

function compileModule(files, basedir, runInNewContext) {
  const compiledScripts = {}
  const resolvedModules = {}

  function getCompiledScript(filename) {
    if (compiledScripts[filename]) {
      return compiledScripts[filename]
    }
    const code = files[filename]
    const wrapper = NativeModule.wrap(code)
    const script = new vm.Script(wrapper, {
      filename,
      displayErrors: true
    })
    compiledScripts[filename] = script
    return script
  }

  function evaluateModule(filename, sandbox, evaluatedFiles = {}) {
    if (evaluatedFiles[filename]) {
      return evaluatedFiles[filename]
    }

    const script = getCompiledScript(filename)
    const compiledWrapper =
      runInNewContext === false
        ? script.runInThisContext()
        : script.runInNewContext(sandbox)
    const m = { exports: {} }
    const r = file => {
      file = path.posix.join('.', file)
      if (files[file]) {
        return evaluateModule(file, sandbox, evaluatedFiles)
      } else if (basedir) {
        return require(resolvedModules[file] ||
          (resolvedModules[file] = resolve.sync(file, { basedir })))
      } else {
        return require(file)
      }
    }
    compiledWrapper.call(m.exports, m.exports, r, m)

    const res = Object.prototype.hasOwnProperty.call(m.exports, 'default')
      ? m.exports.default
      : m.exports
    evaluatedFiles[filename] = res
    return res
  }
  return evaluateModule
}

function deepClone(val) {
  if (isPlainObject(val)) {
    const res = {}
    for (const key in val) {
      res[key] = deepClone(val[key])
    }
    return res
  } else if (Array.isArray(val)) {
    return val.slice()
  } else {
    return val
  }
}

exports.createBundleRunner = function createBundleRunner(
  entry,
  files,
  basedir,
  runInNewContext
) {
  const evaluate = compileModule(files, basedir, runInNewContext)
  if (runInNewContext !== false && runInNewContext !== 'once') {
    // new context mode: creates a fresh context and re-evaluate the bundle
    // on each render. Ensures entire application state is fresh for each
    // render, but incurs extra evaluation cost.
    return (userContext = {}) =>
      new Promise(resolve => {
        userContext._registeredComponents = new Set()
        const res = evaluate(entry, createSandbox(userContext))
        resolve(typeof res === 'function' ? res(userContext) : res)
      })
  } else {
    // direct mode: instead of re-evaluating the whole bundle on
    // each render, it simply calls the exported function. This avoids the
    // module evaluation costs but requires the source code to be structured
    // slightly differently.
    let runner // lazy creation so that errors can be caught by user
    return (...args) =>
      new Promise(resolve => {
        if (!runner) {
          const sandbox = runInNewContext === 'once' ? createSandbox() : global
          // the initial context is only used for collecting possible non-component
          // styles injected by vue-style-loader.
          runner = evaluate(entry, sandbox)

          if (typeof runner !== 'function') {
            throw new Error(
              'bundle export should be a function when using ' +
                '{ runInNewContext: false }.'
            )
          }
        }

        resolve(runner(...args))
      })
  }
}
