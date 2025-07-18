// import { describe, expect, it } from "vitest"
// import { readPreviousHeadFromComments } from "./pullRequest.ts"

// describe("pullRequest helpers", () => {
//   it("readPreviousHeadFromComments returns currentHead if no comments", async () => {
//     const octokit = { paginate: async () => [] }
//     const repoRef = {}
//     const prNumber = 1
//     const markerStart = "<!-- ai-assisted-review-start -->"
//     const markerEnd = "<!-- ai-assisted-review-end -->"
//     const currentHead = "abc123"
//     const result = await readPreviousHeadFromComments(octokit, repoRef, prNumber, markerStart, markerEnd, currentHead)
//     expect(result).toBe(currentHead)
//   })
// })
