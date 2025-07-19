// Types, interfaces, and enums for the PR review domain
import { GitHub } from "@actions/github/lib/utils.js"
import { RestEndpointMethodTypes } from "@octokit/action"
import { MinimatchOptions } from "minimatch"
import parseDiff from "parse-diff"
import { z } from "zod"
import { Config } from "./config.ts"
import { AiReviewSchema } from "./review.ts"

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
}

export interface GithubContextWithMatchOptions extends GithubContext {
  matchOptions: MinimatchOptions
}

export interface PullRequestDetailsWithBaseAndHead {
  pullRequest: any // TODO: Change type
  base: string
  head: string
}

export interface DiffResult {
  userPrompt: string[]
  processedFiles: parseDiff.File[]
}

export interface ReviewDisplayContext extends GithubContext, PullRequestDetailsWithBaseAndHead {
  comments: ReviewComment[]
}

export interface ContextFilesContentParams extends GithubContextWithMatchOptions, PullRequestDetailsWithBaseAndHead {}

export type CreateReviewParameter = RestEndpointMethodTypes["pulls"]["createReview"]["parameters"]

export type AiReview = z.infer<typeof AiReviewSchema>

export type ReviewComment = Exclude<RestEndpointMethodTypes["pulls"]["createReview"]["parameters"]["comments"], undefined>[number]
