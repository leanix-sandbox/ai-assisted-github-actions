import * as core from "@actions/core"
import * as github from "@actions/github"
import { retry } from "@octokit/plugin-retry"
import { throttling, ThrottlingOptions } from "@octokit/plugin-throttling"
import { MinimatchOptions } from "minimatch"
import { inspect } from "node:util"
import { Config } from "../../domain/model/config.ts"

export function initializeClientsAndOptions(config: Config) {
  const markerStart = "<!-- ai-assisted-review-start -->"
  const markerEnd = "<!-- ai-assisted-review-end -->"

  core.startGroup("Create GitHub API & AI Core client")
  core.info(`Using the following configuration: ${inspect(config, { depth: undefined, colors: true })}`)

  const throttlingOptions: ThrottlingOptions = { onSecondaryRateLimit: () => true, onRateLimit: () => true }
  const octokit = github.getOctokit(config.userToken, { baseUrl: config.githubApiUrl, throttle: throttlingOptions }, throttling, retry)
  const matchOptions: MinimatchOptions = { dot: true, nocase: true }
  const repoRef = { owner: config.owner, repo: config.repo }
  return { octokit, matchOptions, repoRef, markerStart, markerEnd }
}
