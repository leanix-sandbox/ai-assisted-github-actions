/* eslint-disable @typescript-eslint/no-redeclare */
import { ResourceGroupConfig } from "@sap-ai-sdk/ai-api"
import { ChatModel, LlmModelParams } from "@sap-ai-sdk/orchestration"
import { z, ZodType } from "zod"

// ServiceKey
export const ServiceKey = z
  .object({
    clientid: z.string(),
    clientsecret: z.string(),
    serviceurls: z
      .object({
        AI_API_URL: z.string(),
      })
      .catchall(z.any()),
    url: z.string(),
  })
  .catchall(z.any())

// ServiceKeyOrCredentials
export const ServiceKeyOrCredentials = z.union([
  ServiceKey,
  z.object({
    credentials: ServiceKey,
  }),
])

// ModelName
export const ModelName: ZodType<ChatModel> = z.string()

// DeploymentConfig
export const DeploymentConfig: ZodType<ResourceGroupConfig> = z.record(z.any())

// ModelParameters
export const ModelParameters: ZodType<LlmModelParams> = z.record(z.any())
