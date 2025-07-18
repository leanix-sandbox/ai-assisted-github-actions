import * as core from "@actions/core"
import { ChatMessage } from "@sap-ai-sdk/orchestration"
import { inspect } from "node:util"
import { File } from "parse-diff"
import * as aiCoreClient from "../ai-core-client.js"
import { Config } from "../config.js"
import { resolveHunkReferencesInComments } from "../hunk-reader.js"
import { AiReview } from "../review.js"

export async function generateAIReview(config: Config, content: string[]) {
  core.startGroup(`Ask LLM for review based on the diff/patch of the PR`)
  const message: ChatMessage[] = [
    { role: "system", content: `${config.prompt}\n${config.promptAddition}` },
    { role: "user", content: content.join("\n") },
  ]
  core.info(inspect(message, { depth: undefined, colors: true }))
  const aiReview: AiReview = await aiCoreClient.chatCompletionWithJsonSchema(AiReview, message)
  core.info(inspect(aiReview, { depth: undefined, colors: true }))
  return aiReview
}

export function processAIReviewComments(aiReview: AiReview, processedFiles: File[]) {
  core.startGroup(`Process the chat completion to create PR review comments`)
  const comments = resolveHunkReferencesInComments(aiReview.comments, processedFiles)
  core.info(inspect(comments, { depth: undefined, colors: true }))
  core.setOutput("comments", comments)
  return comments
}
