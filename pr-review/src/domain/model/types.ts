// Types, interfaces, and enums for the PR review domain
import { GitHub } from "@actions/github/lib/utils.js"
import { MinimatchOptions } from "minimatch"
import { Config } from "./config.ts"

export interface AiReview {
  comments: any[]
}

export interface RepoRef {
  owner: string
  repo: string
}

export interface GithubContext {
  octokit: InstanceType<typeof GitHub>
  repoRef: RepoRef
  config: Config
  markerStart: string
  markerEnd: string
  matchOptions: MinimatchOptions
}

export interface PullRequestDetails {
  pullRequest: any
  base: string
  head: string
}

export interface DiffResult {
  content: string[]
  processedFiles: any[]
}

export interface ReviewDisplayContext extends GithubContext, PullRequestDetails, DiffResult {
  comments: any[]
  aiReview: any
}

export interface ContextFilesContentParams extends GithubContext, PullRequestDetails {}
