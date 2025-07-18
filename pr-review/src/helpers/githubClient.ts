import * as github from "@actions/github"
import { retry } from "@octokit/plugin-retry"
import { throttling, ThrottlingOptions } from "@octokit/plugin-throttling"
import { minimatch, MinimatchOptions } from "minimatch"
import { Config } from "../config.js"

export function initializeClientsAndOptions(config: Config) {
  const markerStart = "<!-- ai-assisted-review-start -->"
  const markerEnd = "<!-- ai-assisted-review-end -->"
  const throttlingOptions: ThrottlingOptions = { onSecondaryRateLimit: () => true, onRateLimit: () => true }
  const octokit = github.getOctokit(config.userToken, { baseUrl: config.githubApiUrl, throttle: throttlingOptions }, throttling, retry)
  const matchOptions: MinimatchOptions = { dot: true, nocase: true }
  const repoRef = { owner: config.owner, repo: config.repo }
  return { octokit, matchOptions, repoRef, markerStart, markerEnd }
}

export function isIncluded(file: { from: string; to: string }, config: Config, matchOptions: MinimatchOptions) {
  return config.includeFiles.some(pattern => (file.from && minimatch(file.from, pattern, matchOptions)) || (file.to && minimatch(file.to, pattern, matchOptions)))
}

export function isExcluded(file: { to: string }, config: Config, matchOptions: MinimatchOptions) {
  return config.excludeFiles.some(pattern => file.to && minimatch(file.to, pattern, matchOptions))
}

export function hasChunks(file: { chunks?: any[] }) {
  return file.chunks?.length
}
