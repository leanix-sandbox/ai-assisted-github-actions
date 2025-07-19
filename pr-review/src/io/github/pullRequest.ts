import * as core from "@actions/core"
import { minimatch, MinimatchOptions } from "minimatch"
import { inspect } from "node:util"
import parseDiff, { Chunk, File } from "parse-diff"
import { Config } from "../../domain/model/config.ts"
import { helpAIwithHunksInDiff } from "../../domain/services/hunk-reader.ts"

export async function getPullRequestDetails(octokit: any, repoRef: any, config: Config, markerStart: string, markerEnd: string) {
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

export async function getAndPreprocessDiff(
  octokit: any,
  repoRef: any,
  pullRequest: any,
  config: Config,
  matchOptions: MinimatchOptions,
  markerStart: string,
  markerEnd: string,
  base: string,
  head: string,
) {
  core.startGroup(`Preprocess PR diff/patch to help the model understand the changes`)
  core.info(`Get diff for PR #${config.prNumber} (${base}...${head})`)
  const processedFiles: File[] = []
  const { data: diff } = await octokit.rest.repos.compareCommits({ ...repoRef, base: pullRequest.base.sha, head, mediaType: { format: "diff" } })
  let comparison = parseDiff(diff as unknown as string)

  if (config.displayMode === "review-comment-delta" && base !== pullRequest.base.sha) {
    core.info("Looking for chunks already reviewed in previous review to remove them from the diff")
    const { data: previousDiff } = await octokit.rest.repos.compareCommits({ ...repoRef, base: pullRequest.base.sha, head: base, mediaType: { format: "diff" } })
    const previousComparison = parseDiff(previousDiff as unknown as string)
    const createPatch = (hunk: Chunk) => hunk.changes.map(c => c.content).join("\n")
    comparison.forEach(file => {
      const previousFile = previousComparison.find(f => f.from === file.from && f.to === file.to)
      if (previousFile) {
        file.chunks = file.chunks.filter(hunk => !previousFile?.chunks.some(previousHunk => createPatch(hunk) === createPatch(previousHunk)))
      }
    })
    comparison = comparison.filter(file => file.chunks.length > 0)
  }

  const content: string[] = []
  comparison.forEach(file => {
    const fileName = file.from === file.to ? file.from : `${file.from} → ${file.to}`
    if (!config.includeFiles.some(pattern => (file.from && minimatch(file.from, pattern, matchOptions)) || (file.to && minimatch(file.to, pattern, matchOptions)))) {
      core.info(`Skipping ${fileName} (not included).`)
    } else if (config.excludeFiles.some(pattern => file.to && minimatch(file.to, pattern, matchOptions))) {
      core.info(`Skipping ${fileName} (is excluded).`)
    } else if (!file.chunks?.length) {
      core.info(`Skipping ${fileName} (has no patch).`)
    } else {
      core.info(`Reading diff/patch of ${fileName}.`)
      const preprocessedDiff = helpAIwithHunksInDiff(file)
      processedFiles.push(file)
      content.push(preprocessedDiff)
    }
  })
  return { content, processedFiles }
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
  let base = currentHead
  previousReviews.forEach((comment: { body?: string }) => {
    ;[...(comment.body?.matchAll(regex) ?? [])].forEach(match => {
      const commentBase = match.groups!.base
      const commentHead = match.groups!.head
      if (commentHead) base = commentHead !== currentHead ? commentHead : commentBase
    })
  })
  return base
}
