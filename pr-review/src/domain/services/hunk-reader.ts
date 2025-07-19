import { File } from "parse-diff"

/** Because GitHub comments referencing a diff need to reference lines of the same hunk, we add/collect some metadata to find the corresponding hunk after AI processing */
export function helpAIwithHunksInDiff(file: File): string {
  const diff: string[] = []
  let lineNo = 0

  const fileStatus = file.deleted ? "deleted" : file.new ? "added" : file.from !== file.to ? "renamed" : "modified" // eslint-disable-line sonarjs/no-nested-conditional
  if (file.chunks.length > 0) {
    diff.push("", `## Diff of the ${fileStatus} file \`${file.to ?? file.from}\``, "\n")
    file.chunks.forEach(hunk => {
      diff.push("```")
      hunk.changes.forEach(change => {
        diff.push(`line ${++lineNo}: ${change.content}`)
      })
      diff.push("```", "")
    })
  }
  return diff.join("\n")
}
