import vm, { Script as VmScript } from 'vm'
import path from 'path'
import resolve from 'resolve'
import NativeModule from 'module'

export interface Files {
  [filename: string]: string
}

function createSandbox() {
  const sandbox: { [k: string]: any } = {
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

function compileModule(files: Files, sandbox: boolean, baseDir?: string) {
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
    sandbox: ReturnType<typeof createSandbox>,
    evaluatedFiles: { [filename: string]: EvaluatedFile } = {}
  ) {
    if (evaluatedFiles[filename]) {
      return evaluatedFiles[filename]
    }

    const script = getCompiledScript(filename)
    const compiledWrapper = sandbox
      ? script.runInNewContext(sandbox)
      : script.runInThisContext()
    const m: { exports: any } = { exports: {} }
    const r = (file: string) => {
      file = path.posix.join('.', file)
      if (files[file]) {
        return evaluateModule(file, sandbox, evaluatedFiles)
      } else if (baseDir) {
        return require(resolvedModules[file] ||
          (resolvedModules[file] = resolve.sync(file, { basedir: baseDir })))
      } else {
        return require(file)
      }
    }
    compiledWrapper.call(m.exports, m.exports, r, m)

    evaluatedFiles[filename] = m.exports
    return m.exports
  }
  return evaluateModule
}

export type EvaluateModule = <
  TModuleExports extends any = any,
  TFile extends string = string
>(
  file: TFile
) => TModuleExports

export interface Options {
  baseDir?: string
  sandbox?: boolean | typeof createSandbox
}

export function createModule(
  files: Files,
  options: Options = {}
): EvaluateModule {
  const { sandbox = true, baseDir } = options
  const evaluate = compileModule(files, Boolean(sandbox), baseDir)
  return file =>
    evaluate(
      file,
      sandbox
        ? typeof sandbox === 'function'
          ? sandbox()
          : createSandbox()
        : global
    )
}
