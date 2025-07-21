import { Config } from "../model/types.ts"

export function createMockConfig(): Config {
  return {
    userToken: "mockUserToken",
    githubApiUrl: "https://api.github.com",
    owner: "mockOwner",
    repo: "mockRepo",
    prNumber: 1,
    headSha: "mockHeadSha",
    baseSha: "mockBaseSha",
    displayMode: "review-comment",
    includeContextFiles: [],
    excludeContextFiles: [],
    prompt: "Please review the following changes:",
    promptAddition: "Consider the following points:",
    headerText: "AI Review",
    footerText: "End of AI Review",
    previousResults: "hide",
    aicoreServiceKey: {
      clientid: "mockClientId",
      clientsecret: "mockClientSecret",
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
}
