import * as github from "@actions/github"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { Config } from "../config.ts"
import { initializeClientsAndOptions } from "./githubClient.ts"

describe("initializeClientsAndOptions", () => {
  const originalGetOctokit = github.getOctokit
  beforeAll(() => {
    vi.spyOn(github, "getOctokit").mockImplementation(() => "mockOctokit" as any)
  })
  afterAll(() => {
    ;(github.getOctokit as any) = originalGetOctokit
  })

  const config: Config = {
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
    aicoreServiceKey: {
      clientid: "test-client-id",
      clientsecret: "test-client-secret",
      serviceurls: { AI_API_URL: "https://ai.example.com" },
      url: "https://service.example.com",
    },
    includeFiles: [],
    excludeFiles: [],
    model: "gpt-4o-mini",
    modelParameters: {},
    modelVersion: "",
    deploymentConfig: {},
    showModelMetadataFooter: false,
    disclaimerPrompt: "",
  }

  it("returns correct structure and values", () => {
    const result = initializeClientsAndOptions(config)
    expect(result.octokit).toBe("mockOctokit")
    expect(result.matchOptions).toEqual({ dot: true, nocase: true })
    expect(result.repoRef).toEqual({ owner: "leanix", repo: "sap-security-action" })
    expect(result.markerStart).toBe("<!-- ai-assisted-review-start -->")
    expect(result.markerEnd).toBe("<!-- ai-assisted-review-end -->")
  })

  it("calls getOctokit with correct arguments", () => {
    initializeClientsAndOptions(config)
    expect(github.getOctokit).toHaveBeenCalledWith(
      "token",
      { baseUrl: "https://api.github.com", throttle: expect.any(Object) },
      expect.any(Function),
      expect.any(Function),
    )
  })
})
