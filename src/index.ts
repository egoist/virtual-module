import vm, { Script as VmScript } from 'vm'
import path from 'path'
import resolve from 'resolve'
import NativeModule from 'module'

export interface Files {
  [filename: string]: string
}

export type RunInNewContext = boolean | 'once'

function createSandbox() {
  const sandbox: any = {
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

function compileModule(
  files: Files,
  basedir?: string,
  runInNewContext?: RunInNewContext
) {
  const compiledScripts: { [k: string]: VmScript } = {}
  const resolvedModules: { [k: string]: string } = {}

  function getCompiledScript(filename: string) {
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

  type EvaluatedFile = (...args: any[]) => any

  function evaluateModule(
    filename: string,
    sandbox: any,
    evaluatedFiles: { [filename: string]: EvaluatedFile } = {}
  ) {
    if (evaluatedFiles[filename]) {
      return evaluatedFiles[filename]
    }

    const script = getCompiledScript(filename)
    const compiledWrapper =
      runInNewContext === false
        ? script.runInThisContext()
        : script.runInNewContext(sandbox)
    const m: { exports: any; default?: any } = { exports: {} }
    const r = (file: string) => {
      file = path.posix.join('.', file).replace(/(\.js)?$/, '.js') // Ensure it ends with .js
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

/**
 * Execute the entry file in the bundle
 * `args` are passed to underlying entry file
 */
export type BundlerRunner = (...args: any[]) => Promise<any>

export function createBundleRunner(
  entry: string,
  files: Files,
  basedir?: string,
  runInNewContext?: RunInNewContext
): BundlerRunner {
  const evaluate = compileModule(files, basedir, runInNewContext)
  if (runInNewContext !== false && runInNewContext !== 'once') {
    // new context mode: creates a fresh context and re-evaluate the bundle
    // on each render. Ensures entire application state is fresh for each
    // render, but incurs extra evaluation cost.
    return (...args: any[]) =>
      new Promise(resolve => {
        const res = evaluate(entry, createSandbox())
        resolve(typeof res === 'function' ? res(...args) : res)
      })
  } else {
    // direct mode: instead of re-evaluating the whole bundle on
    // each render, it simply calls the exported function. This avoids the
    // module evaluation costs but requires the source code to be structured
    // slightly differently.
    let runner: BundlerRunner // lazy creation so that errors can be caught by user
    return (...args: any[]) =>
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
