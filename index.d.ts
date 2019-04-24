interface Files {
  [filename: string]: string
}

type Runner = (context: any) => any

type CreateBundleRunner = (entryFile: string, files: Files, basedir: string, runInNewContext?: boolean | 'once') => Runner

declare let createBundleRunner: CreateBundleRunner

export {
  createBundleRunner
}
