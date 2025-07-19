import * as core from "@actions/core"
import { Config, getConfig } from "./domain/model/config.ts"
import { GithubContext, PullRequestDetailsWithBaseAndHead } from "./domain/model/types.ts"
import { getContextFilesContent } from "./domain/services/contextFiles.ts"
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
  const githubCtx: GithubContext = { octokit, repoRef, markerStart, markerEnd, config }

  const prDetails: PullRequestDetailsWithBaseAndHead = await getPullRequestDetails(githubCtx)

  const { userPrompt, processedFiles } = await getAndPreprocessDiff(githubCtx, matchOptions, prDetails)

  if (userPrompt.length === 0) {
    core.info("No diff/patch to process.")
    return
  }
  core.info(userPrompt.join("\n"))

  const contextFilesContent = await getContextFilesContent(githubCtx, matchOptions, prDetails)
  const mergedContent = [...userPrompt, ...contextFilesContent]
  const aiReview = await generateAIReview(config, mergedContent)

  const comments = processAIReviewComments(aiReview, processedFiles)
  if (comments.length === 0) {
    core.info("No comments to post.")
    return
  }

  await handleReviewDisplay(githubCtx, prDetails, comments)
}
