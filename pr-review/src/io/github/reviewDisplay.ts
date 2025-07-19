import * as core from "@actions/core"
import { inspect } from "node:util"
import { CreateReviewParameter, GithubContext, PullRequestDetailsWithBaseAndHead, ReviewComment } from "../../domain/model/types.ts"
import * as aiCoreClient from "../ai/ai-core-client.ts"

export async function handleReviewDisplay(githubContext: GithubContext, pullRequestDetails: PullRequestDetailsWithBaseAndHead, comments: ReviewComment[]) {
  const { octokit, repoRef, config, markerStart, markerEnd } = githubContext
  switch (config.displayMode) {
    case "review-comment":
    case "review-comment-delta": {
      if (config.previousResults === "hide") {
        core.startGroup("Process previous reviews.")

        await hidePreviousComments({ octokit, repoRef, config, markerStart, markerEnd })
      }

      const disclaimer = await getDisclaimer(config)

      const displayText = await generateDisplayText(githubContext, pullRequestDetails, disclaimer)

      await submitReview(githubContext, comments, displayText, pullRequestDetails.head)

      break
    }
    case "none": {
      core.info("Skipping display.")
      break
    }
    default: {
      throw new Error(`Invalid display mode: ${String(config.displayMode)}`)
    }
  }
}

async function hidePreviousComments(githubContext: GithubContext) {
  const { octokit, repoRef, config, markerStart, markerEnd } = githubContext
  const previousReviews = await octokit.paginate(octokit.rest.pulls.listReviews, { ...repoRef, pull_number: config.prNumber })
  const regex = new RegExp(`^${markerStart}([\\s\\S]*?)${markerEnd}$`, "g")
  await Promise.all(
    previousReviews.map(async (review: { body: string; id: any; node_id: any }) => {
      if (regex.test(review.body)) {
        core.info(`Minimizing review ${review.id}`)
        await octokit.graphql(`mutation { minimizeComment(input: {classifier: OUTDATED, subjectId: "${review.node_id}"}) { minimizedComment { isMinimized } } }`)
      }
    }),
  )
}

export function markedComment(review: { body?: string }, markerStart: string, markerEnd: string): boolean {
  const includesMarkers = new RegExp(`^${markerStart}([\s\S]*?)${markerEnd}$`, "g")
  return !!review.body && includesMarkers.test(review.body)
}

export function minimizeComment(octokit: any, review: { id: any; node_id: any }): Promise<any> {
  core.info(`Minimizing review ${review.id}`)
  return octokit.graphql(`mutation { minimizeComment(input: {classifier: OUTDATED, subjectId: "${review.node_id}"}) { minimizedComment { isMinimized } } }`)
}

export async function submitReview(githubContext: GithubContext, comments: ReviewComment[], reviewComment: string, head: string) {
  const { octokit, repoRef, config } = githubContext
  const review: CreateReviewParameter = { ...repoRef, pull_number: config.prNumber, commit_id: head, event: "COMMENT", body: reviewComment, comments }
  core.info(inspect(review, { depth: undefined, colors: true }))
  const { data: result } = await octokit.rest.pulls.createReview(review)
  core.info(inspect(result, { depth: undefined, colors: true }))
  core.setOutput("reviewId", result.id)
  core.setOutput("review", result)
}

export async function generateDisplayText(
  githubContext: GithubContext,
  pullRequestDetailsWithBaseAndHead: PullRequestDetailsWithBaseAndHead,
  disclaimer: string,
): Promise<string> {
  core.startGroup(`Create a PR review as comment with the generated comments`)
  const { config, markerStart, markerEnd } = githubContext
  const { pullRequest, base, head } = pullRequestDetailsWithBaseAndHead
  const baseheadMaker = `<!-- ${base}...${head} -->`
  const header = config.headerText ? `${config.headerText}\n` : ""
  const footer = config.footerText ? `\n${config.footerText}` : ""
  const metadata = [
    `Model: ${aiCoreClient.getModelName()}`,
    `Prompt Tokens: ${aiCoreClient.getPromptTokens()}`,
    `Completion Tokens: ${aiCoreClient.getCompletionTokens()}`,
    base !== pullRequest.base.sha || head !== pullRequest.head.sha ? `Diff Range: ${base.slice(0, 7)}...${head.slice(0, 7)}` : "",
  ]
  const modelMetadataFooter = config.showModelMetadataFooter ? `<sub>${metadata.filter(Boolean).join(" | ")}</sub>` : ""
  const displayText = [markerStart, baseheadMaker, header, disclaimer, footer, modelMetadataFooter, markerEnd].filter(Boolean).join("\n")
  return displayText
}

export async function getDisclaimer(config: any) {
  core.startGroup(`Ask LLM for a disclaimer text to add to the review description`)
  const disclaimer = await aiCoreClient.chatCompletion([{ role: "user", content: config.disclaimerPrompt }])
  core.info(inspect(disclaimer, { depth: undefined, colors: true }))
  core.setOutput("disclaimer", disclaimer)
  return disclaimer
}
