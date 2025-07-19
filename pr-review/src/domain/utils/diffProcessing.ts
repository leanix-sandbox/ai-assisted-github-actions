import * as core from "@actions/core"
import { minimatch, MinimatchOptions } from "minimatch"
import parseDiff from "parse-diff"
import { Config } from "../model/types.ts"

export function diffInScope(file: parseDiff.File, config: Config, matchOptions: MinimatchOptions): boolean {
  const fileName = file.from === file.to ? file.from : `${file.from} → ${file.to}`

  if (!isIncluded(file, config, matchOptions)) {
    core.info(`Skipping ${fileName} (not included).`)
    return false
  }
  if (isExcluded(file, config, matchOptions)) {
    core.info(`Skipping ${fileName} (is excluded).`)
    return false
  }
  if (!hasChunks(file)) {
    core.info(`Skipping ${fileName} (has no patch).`)
    return false
  }
  return true
}

function hasChunks(file: parseDiff.File) {
  return file.chunks?.length
}

function isExcluded(file: parseDiff.File, config: Config, matchOptions: MinimatchOptions): boolean {
  return config.excludeFiles.some(pattern => file.to && minimatch(file.to, pattern, matchOptions))
}

function isIncluded(file: parseDiff.File, config: Config, matchOptions: MinimatchOptions): boolean {
  return config.includeFiles.some(pattern => (file.from && minimatch(file.from, pattern, matchOptions)) || (file.to && minimatch(file.to, pattern, matchOptions)))
}
