// import { describe, expect, it, vi } from "vitest"
// import { generateAIReview, getDisclaimer, processAIReviewComments } from "./aiReview.ts"

// vi.mock("../../ai-core-client.js", () => ({
//   chatCompletionWithJsonSchema: vi.fn(() => ({ comments: ["test comment"] })),
//   chatCompletion: vi.fn(() => "disclaimer text"),
// }))

// describe("aiReview helpers", () => {
//   const config = {
//     prompt: "Prompt",
//     promptAddition: "Addition",
//     disclaimerPrompt: "Disclaimer?",
//   } as any

//   it("generateAIReview returns aiReview object", async () => {
//     const result = await generateAIReview(config, ["diff"])
//     expect(result).toHaveProperty("comments")
//   })

//   it("processAIReviewComments returns comments", () => {
//     const aiReview = { comments: ["test"] }
//     const processed = processAIReviewComments(aiReview as any, [])
//     expect(processed).toEqual(["test"])
//   })

//   it("getDisclaimer returns disclaimer text", async () => {
//     const disclaimer = await getDisclaimer(config)
//     expect(disclaimer).toBe("disclaimer text")
//   })
// })
