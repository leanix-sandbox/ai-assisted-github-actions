import * as github from "@actions/github"
import { retry } from "@octokit/plugin-retry"
import { throttling, ThrottlingOptions } from "@octokit/plugin-throttling"
import { MinimatchOptions } from "minimatch"
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
