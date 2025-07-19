import * as core from "@actions/core"
import { MinimatchOptions } from "minimatch"
import { inspect } from "node:util"
import parseDiff, { Chunk, File } from "parse-diff"
import { DiffResult, GithubContext, PullRequestDetailsWithBaseAndHead } from "../../domain/model/types.ts"
import { helpAIwithHunksInDiff } from "../../domain/services/hunk-reader.ts"
import { diffInScope } from "../../domain/utils/diffProcessing.ts"

export async function getPullRequestDetails(ctx: GithubContext): Promise<PullRequestDetailsWithBaseAndHead> {
  const { octokit, repoRef, config, markerStart, markerEnd } = ctx
  core.info(`Get PR #${config.prNumber} from ${repoRef.owner}/${repoRef.repo}`)
  const { data: pullRequest } = await octokit.rest.pulls.get({ ...repoRef, pull_number: config.prNumber })
  core.info(inspect(pullRequest, { depth: undefined, colors: true }))
  let base = config.baseSha || pullRequest.base.sha
  const head = config.headSha || pullRequest.head.sha
  if (config.displayMode === "review-comment-delta") {
    base = await readPreviousHeadFromComments(octokit, repoRef, config.prNumber, markerStart, markerEnd, head)
  }
  return { pullRequest, base, head }
}

export async function getAndPreprocessDiff(ctx: GithubContext, matchOptions: MinimatchOptions, prDetails: PullRequestDetailsWithBaseAndHead): Promise<DiffResult> {
  const { octokit, repoRef, config } = ctx
  const { pullRequest, base, head } = prDetails
  core.startGroup(`Preprocess PR diff/patch to help the model understand the changes`)
  core.info(`Get diff for PR #${config.prNumber} (${base}...${head})`)
  const processedFiles: File[] = []
  const { data: diff } = await octokit.rest.repos.compareCommits({ ...repoRef, base: pullRequest.base.sha, head, mediaType: { format: "diff" } })
  let diffFiles = parseDiff(diff as unknown as string)

  if (config.displayMode === "review-comment-delta" && base !== pullRequest.base.sha) {
    core.info("Looking for chunks already reviewed in previous review to remove them from the diff")
    const { data: previousDiff } = await octokit.rest.repos.compareCommits({ ...repoRef, base: pullRequest.base.sha, head: base, mediaType: { format: "diff" } })
    const previousDiffFiles = parseDiff(previousDiff as unknown as string)
    const createPatch = (hunk: Chunk) => hunk.changes.map(c => c.content).join("\n")
    diffFiles.forEach(file => {
      const previousFile = previousDiffFiles.find(f => f.from === file.from && f.to === file.to)
      if (previousFile) {
        file.chunks = file.chunks.filter(hunk => !previousFile?.chunks.some(previousHunk => createPatch(hunk) === createPatch(previousHunk)))
      }
    })
    diffFiles = diffFiles.filter(file => file.chunks.length > 0)
  }

  const userPrompt: string[] = []
  diffFiles
    .filter(file => diffInScope(file, config, matchOptions))
    .forEach(file => {
      const fileName = file.from === file.to ? file.from : `${file.from} → ${file.to}`
      core.info(`Reading diff/patch of ${fileName}.`)
      const preprocessedDiff = helpAIwithHunksInDiff(file)
      processedFiles.push(file)
      userPrompt.push(preprocessedDiff)
    })
  return { userPrompt, processedFiles }
}

export async function readPreviousHeadFromComments(
  octokit: any,
  repoRef: any,
  prNumber: number,
  markerStart: string,
  markerEnd: string,
  currentHead: string,
): Promise<string> {
  core.info(`Searching for preceding review comments to set old head SHA as new base SHA`)
  const previousReviews = await octokit.paginate(octokit.rest.pulls.listReviews, { ...repoRef, pull_number: prNumber })
  const regex = new RegExp(`^${markerStart}\\s+<!-- (?<base>\\w+)\\.\\.\\.(?<head>\\w+) -->([\\s\\S]*?)${markerEnd}$`, "g")
  let head = currentHead
  previousReviews.forEach((comment: { body?: string }) => {
    ;[...(comment.body?.matchAll(regex) ?? [])].forEach(match => {
      const commentBase = match.groups!.base
      const commentHead = match.groups!.head
      if (commentHead) head = commentHead !== currentHead ? commentHead : commentBase
    })
  })
  return head
}
