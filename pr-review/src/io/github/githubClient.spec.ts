import { describe, expect, it } from "vitest"
import { createMockConfig } from "../../domain/utils/mocks.ts"
import { initializeClientsAndOptions } from "./githubClient.ts"

describe("githubClient helpers", () => {
  const config = createMockConfig()

  it("initializeClientsAndOptions returns correct structure", () => {
    const result = initializeClientsAndOptions(config)
    expect(result).toHaveProperty("octokit")
    expect(result).toHaveProperty("matchOptions")
    expect(result).toHaveProperty("repoRef")
    expect(result).toHaveProperty("markerStart")
    expect(result).toHaveProperty("markerEnd")
  })
})
