import * as core from "@actions/core"
import { minimatch, MinimatchOptions } from "minimatch"
import { Config } from "../config.js"

export async function getContextFilesContent(octokit: any, repoRef: any, pullRequest: any, config: Config, matchOptions: MinimatchOptions, content: string[]) {
  if (config.includeContextFiles.length > 0) {
    core.startGroup(`Get static files for PR`)
    const {
      data: { tree },
    } = await octokit.rest.git.getTree({ ...repoRef, tree_sha: pullRequest.head.sha, recursive: "true" })
    for (const file of tree) {
      if (file.path && file.sha && config.includeContextFiles.some(pattern => minimatch(file.path!, pattern, matchOptions))) {
        if (config.excludeContextFiles.some(pattern => minimatch(file.path!, pattern, matchOptions))) {
          core.info(`Skipping context file ${file.path} (is excluded).`)
        } else {
          core.info(`Reading context file ${file.path}`)
          const { data: blob } = await octokit.rest.git.getBlob({ ...repoRef, file_sha: file.sha, mediaType: { format: "raw" } })
          const result = [`Context file ${file.path}:`, "```", blob as unknown as string, "```", ""]
          core.info(result.join("\n"))
          content.push(...result)
        }
      }
    }
  }
}
