export const getServiceKeyFromEnv = (): string => {
  const { readFileSync } = require("fs")
  const { resolve } = require("path")
  const { parse } = require("dotenv")

  const env = parse(readFileSync(resolve(process.cwd(), ".env")))

  return env.AICORE_SERVICE_KEY || "missing service key"
}
