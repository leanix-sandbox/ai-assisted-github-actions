// import { describe, expect, it } from "vitest"
// import { createMockConfig } from "../../domain/util/mocks.ts"
// import { getContextFilesContent } from "./contextFiles.ts"

// describe("contextFiles helpers", () => {
//   it("getContextFilesContent does not throw with empty context", async () => {
//     const octokit = { rest: { git: { getTree: async () => ({ data: { tree: [] } }) } } }
//     const repoRef = {}
//     const pullRequest = { head: { sha: "sha" } }
//     const config = createMockConfig()
//     const matchOptions = { dot: true, nocase: true }
//     const userPrompt: string[] = []
//     await getContextFilesContent(octokit, repoRef, pullRequest, config, matchOptions, userPrompt)
//     expect(userPrompt).toEqual([])
//   })
// })
