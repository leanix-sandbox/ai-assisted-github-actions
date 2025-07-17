import { describe, expect, it } from "vitest"
import { run } from "../src/main.ts"

const config = {
  userToken: process.env.GITHUB_TOKEN!,
  githubApiUrl: process.env.GITHUB_API_URL!,
  owner: "leanix",
  repo: "sap-security-action",
  prNumber: 187,
  headSha: "393bfb22c434814a297b83c8cdbe86331a027e68",
  baseSha: "c58eab39d11d079cc9ddb144bf26606de1f0ce2d",
  displayMode: "review-comment",
  includeContextFiles: [],
  excludeContextFiles: [],
  prompt: "Please review the following changes:",
  promptAddition: "Consider the following points:",
  headerText: "AI Review",
  footerText: "End of AI Review",
  previousResults: "hide",
  aicoreServiceKey: "<your-service-key>",
  includeFiles: [],
  excludeFiles: [],
  model: "gpt-4o-mini",
  modelParameters: {},
  modelVersion: "",
  deploymentConfig: {},
  showModelMetadataFooter: false,
  disclaimerPrompt: "",
}

describe("AI-Powered Code Review", () => {
  it("should returns a resolvable Promise", async () => {
    const result = run(config)
    expect(result).toBeInstanceOf(Promise)

    await result
  })
})
