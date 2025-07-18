// Types, interfaces, and enums for the PR review domain

export interface Config {
  userToken: string
  githubApiUrl: string
  owner: string
  repo: string
  prNumber: number
  headSha?: string
  baseSha?: string
  displayMode: string
  includeContextFiles: string[]
  excludeContextFiles: string[]
  prompt: string
  promptAddition: string
  headerText?: string
  footerText?: string
  previousResults?: string
  aicoreServiceKey?: any
  includeFiles: string[]
  excludeFiles: string[]
  model?: string
  modelParameters?: any
  modelVersion?: string
  deploymentConfig?: any
  showModelMetadataFooter?: boolean
  disclaimerPrompt?: string
}

export interface AiReview {
  comments: any[]
}
