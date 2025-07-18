import * as core from "@actions/core"
import { ChatMessage } from "@sap-ai-sdk/orchestration"
import { inspect } from "node:util"
import { Config } from "../../domain/model/config.ts"
import { AiReview } from "../../domain/model/review.ts"
import { resolveHunkReferencesInComments } from "../../domain/service/resolveHunkReferencesInComments.js"
import * as aiCoreClient from "./ai-core-client.ts"

export async function generateAIReview(config: Config, userPrompt: string[]) {
  core.startGroup(`Ask LLM for review based on the diff/patch of the PR`)
  const message: ChatMessage[] = [
    { role: "system", content: `${config.prompt}\n${config.promptAddition}` },
    { role: "user", content: userPrompt.join("\n") },
  ]
  core.info(inspect(message, { depth: undefined, colors: true }))
  const aiReview: AiReview = await aiCoreClient.chatCompletionWithJsonSchema(AiReview, message)
  core.info(inspect(aiReview, { depth: undefined, colors: true }))
  return aiReview
}

export function processAIReviewComments(aiReview: AiReview, processedFiles: any[]) {
  core.startGroup(`Process the chat completion to create PR review comments`)
  const comments = resolveHunkReferencesInComments(aiReview.comments, processedFiles)
  core.info(inspect(comments, { depth: undefined, colors: true }))
  core.setOutput("comments", comments)
  return comments
}

export async function getDisclaimer(config: Config) {
  core.startGroup(`Ask LLM for a disclaimer text to add to the review description`)
  const disclaimer = await aiCoreClient.chatCompletion([{ role: "user", content: config.disclaimerPrompt }])
  core.info(inspect(disclaimer, { depth: undefined, colors: true }))
  core.setOutput("disclaimer", disclaimer)
  return disclaimer
}
