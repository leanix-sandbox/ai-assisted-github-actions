import { MinimatchOptions } from "minimatch"

export function diffInScope(
  file: { from: string; to: string; chunks?: any[] },
  config: any,
  matchOptions: MinimatchOptions,
  isIncluded: any,
  isExcluded: any,
  hasChunks: any,
  core: any,
): boolean {
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
