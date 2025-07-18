import * as core from "@actions/core"
import { inspect } from "node:util"
import { Config, getConfig } from "./domain/model/config.ts"
import { getContextFilesContent } from "./domain/service/contextFiles.ts"
import { generateAIReview, processAIReviewComments } from "./io/ai/aiReview.js"
import { initializeClientsAndOptions } from "./io/github/githubClient.js"
import { getAndPreprocessDiff, getPullRequestDetails } from "./io/github/pullRequest.js"
import { handleReviewDisplay } from "./io/github/reviewDisplay.js"

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export async function run(config: Config = getConfig()): Promise<void> {
  const { octokit, matchOptions, repoRef, markerStart, markerEnd } = initializeClientsAndOptions(config)
  core.startGroup("Create GitHub API & AI Core client")
  core.info(`Using the following configuration: ${inspect(config, { depth: undefined, colors: true })}`)

  const { pullRequest, base, head } = await getPullRequestDetails(octokit, repoRef, config, markerStart, markerEnd)

  const { content, processedFiles } = await getAndPreprocessDiff(octokit, repoRef, pullRequest, config, matchOptions, markerStart, markerEnd, base, head)

  if (content.length === 0) {
    core.info("No diff/patch to process.")
    return
  }
  core.info(content.join("\n"))

  await getContextFilesContent(octokit, repoRef, pullRequest, config, matchOptions, content)

  const aiReview = await generateAIReview(config, content)

  const comments = processAIReviewComments(aiReview, processedFiles)
  if (comments.length === 0) {
    core.info("No comments to post.")
    return
  }

  await handleReviewDisplay(octokit, repoRef, config, comments, aiReview, pullRequest, base, head, markerStart, markerEnd, processedFiles)
}
