import * as core from "@actions/core"
import { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types.js"
import { inspect } from "node:util"
import * as aiCoreClient from "../ai-core-client.js"
import { AiReview } from "../review.js"

export async function handleReviewDisplay(
  octokit: any,
  repoRef: any,
  config: any,
  comments: any,
  aiReview: AiReview,
  pullRequest: any,
  base: string,
  head: string,
  markerStart: string,
  markerEnd: string,
  processedFiles: any[],
) {
  switch (config.displayMode) {
    case "review-comment":
    case "review-comment-delta": {
      if (config.previousResults === "hide") {
        core.startGroup("Process previous reviews.")
        const previousReviews = await octokit.paginate(octokit.rest.pulls.listReviews, { ...repoRef, pull_number: config.prNumber })
        const regex = new RegExp(`^${markerStart}([\s\S]*?)${markerEnd}$`, "g")
        await Promise.all(
          previousReviews.map(async (review: { body: string; id: any; node_id: any }) => {
            if (regex.test(review.body)) {
              core.info(`Minimizing review ${review.id}`)
              await octokit.graphql(`mutation { minimizeComment(input: {classifier: OUTDATED, subjectId: "${review.node_id}"}) { minimizedComment { isMinimized } } }`)
            }
          }),
        )
      }

      core.startGroup(`Ask LLM for a disclaimer text to add to the review description`)
      const disclaimer = await aiCoreClient.chatCompletion([{ role: "user", content: config.disclaimerPrompt }])
      core.info(inspect(disclaimer, { depth: undefined, colors: true }))
      core.setOutput("disclaimer", disclaimer)

      core.startGroup(`Create a PR review as comment with the generated comments`)
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

      type CreateReviewParameter = RestEndpointMethodTypes["pulls"]["createReview"]["parameters"]
      const review: CreateReviewParameter = { ...repoRef, pull_number: config.prNumber, commit_id: head, event: "COMMENT", body: displayText, comments }
      core.info(inspect(review, { depth: undefined, colors: true }))

      const { data: result } = await octokit.rest.pulls.createReview(review)
      core.info(inspect(result, { depth: undefined, colors: true }))
      core.setOutput("reviewId", result.id)
      core.setOutput("review", result)

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
