// import { describe, expect, it } from "vitest"
// import { hasChunks, initializeClientsAndOptions, isExcluded, isIncluded } from "./githubClient.ts"

// describe("githubClient helpers", () => {
//   const config = {
//     userToken: "token",
//     githubApiUrl: "https://api.github.com",
//     owner: "test-owner",
//     repo: "test-repo",
//     includeFiles: ["*.ts"],
//     excludeFiles: ["*.spec.ts"],
//   } as any
//   const matchOptions = { dot: true, nocase: true }

//   it("initializeClientsAndOptions returns correct structure", () => {
//     const result = initializeClientsAndOptions(config)
//     expect(result).toHaveProperty("octokit")
//     expect(result).toHaveProperty("matchOptions")
//     expect(result).toHaveProperty("repoRef")
//     expect(result).toHaveProperty("markerStart")
//     expect(result).toHaveProperty("markerEnd")
//   })

//   it("isIncluded returns true for included file", () => {
//     expect(isIncluded({ from: "foo.ts", to: "foo.ts" }, config, matchOptions)).toBe(true)
//   })

//   it("isExcluded returns true for excluded file", () => {
//     expect(isExcluded({ to: "foo.spec.ts" }, config, matchOptions)).toBe(true)
//   })

//   it("hasChunks returns true if file has chunks", () => {
//     expect(hasChunks({ chunks: [1, 2] })).toBeTruthy()
//     expect(hasChunks({})).toBeFalsy()
//   })
// })
