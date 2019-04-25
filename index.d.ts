interface Files {
  [filename: string]: string
}

type BundleRunner = (context: any) => Promise<any>

type CreateBundleRunner = (entryFile: string, files: Files, basedir: string, runInNewContext?: boolean | 'once') => BundleRunner

declare let createBundleRunner: CreateBundleRunner

export {
  createBundleRunner,
  BundleRunner
}
