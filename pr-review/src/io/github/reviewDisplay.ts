import * as core from "@actions/core"
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types.js"
import { inspect } from "node:util"
import { ReviewDisplayContext } from "../../domain/model/types.ts"
import * as aiCoreClient from "../ai/ai-core-client.ts"

export async function handleReviewDisplay(ctx: ReviewDisplayContext) {
  const { octokit, repoRef, config, comments, aiReview, pullRequest, base, head, markerStart, markerEnd, processedFiles } = ctx
  switch (config.displayMode) {
    case "review-comment":
    case "review-comment-delta": {
      if (config.previousResults === "hide") {
        await hidePreviousComments(octokit, repoRef, config.prNumber, markerStart, markerEnd)
      }

      const disclaimer = await getDisclaimer(config)
      core.setOutput("disclaimer", disclaimer)

      const reviewComment = await generateReviewComment({
        base,
        head,
        config,
        pullRequest,
        markerStart,
        markerEnd,
        getDisclaimerFn: async () => disclaimer,
        aiCoreClient,
      })

      await submitReview(octokit, repoRef, config, comments, reviewComment, head)

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

async function hidePreviousComments(octokit: any, repoRef: any, prNumber: number, markerStart: string, markerEnd: string) {
  core.startGroup("Process previous reviews.")

  await Promise.all(
    (await octokit.paginate(octokit.rest.pulls.listReviews, { ...repoRef, pull_number: prNumber }))
      .filter((review: any) => markedComment(review, markerStart, markerEnd))
      .map((review: any) => minimizeComment(octokit, review)),
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

export async function submitReview(octokit: any, repoRef: any, config: any, comments: any, reviewComment: string, head: string) {
  type CreateReviewParameter = RestEndpointMethodTypes["pulls"]["createReview"]["parameters"]
  const review: CreateReviewParameter = { ...repoRef, pull_number: config.prNumber, commit_id: head, event: "COMMENT", body: reviewComment, comments }
  core.info(inspect(review, { depth: undefined, colors: true }))
  const { data: result } = await octokit.rest.pulls.createReview(review)
  core.info(inspect(result, { depth: undefined, colors: true }))
  core.setOutput("reviewId", result.id)
  core.setOutput("review", result)
}

export async function generateReviewComment({
  base,
  head,
  config,
  pullRequest,
  markerStart,
  markerEnd,
  getDisclaimerFn,
  aiCoreClient,
}: {
  base: string
  head: string
  config: any
  pullRequest: any
  markerStart: string
  markerEnd: string
  getDisclaimerFn: () => Promise<string>
  aiCoreClient: any
}): Promise<string> {
  core.startGroup(`Create a PR review as comment with the generated comments`)
  const baseheadMaker = `<!-- ${base}...${head} -->`
  const header = config.headerText ? `${config.headerText}\n` : ""
  const disclaimer = await getDisclaimerFn()
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
