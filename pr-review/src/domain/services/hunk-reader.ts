import * as core from "@actions/core"
import { File } from "parse-diff"
import { AiReview, ReviewComment } from "../model/types.ts"

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

/**
 * Map comments from the AI model to GitHub review comments and ensure a comment references only one single hunk.
 */
export function resolveHunkReferencesInComments(comments: AiReview["comments"], files: File[]): ReviewComment[] {
  const result: ReviewComment[] = []
  comments.forEach(comment => {
    const currentFile = files.find(file => file.from === comment.path || file.to === comment.path)
    if (!currentFile) {
      core.warning(`Could not find file for comment on ${comment.path}, start ${comment.start}, end ${comment.end}, ${comment.comment}, skipping.`)
    } else {
      const hunkChangeMap = currentFile.chunks.flatMap(hunk => hunk.changes.map(change => ({ change, hunk })))

      const startEntry = hunkChangeMap[comment.start - 1]
      const endEntry = hunkChangeMap[comment.end - 1]
      if (!startEntry) {
        core.warning(`Could not find start change for comment on ${comment.path}, start ${comment.start}, skipping.`)
        return
      }
      if (!endEntry) {
        core.warning(`Could not find end change for comment on ${comment.path}, end ${comment.end}, skipping.`)
        return
      }
      let { change: startChange, hunk: startHunk } = startEntry
      let { change: endChange, hunk: endHunk } = endEntry

      if (!startHunk) {
        core.warning(`Could not find hunk for comment on ${comment.path}, start ${comment.start}, end ${comment.end}, ${comment.comment}, skipping.`)
      } else {
        if (startHunk !== endHunk) endChange = startHunk.changes.at(-1)!

        const startSide = startChange.type !== "del" ? "RIGHT" : "LEFT"
        const endSide = endChange.type !== "del" ? "RIGHT" : "LEFT"

        // get start line of the actual comment
        let start: number
        if (startChange.type === "normal") {
          start = startChange.ln2
        } else if (startChange.type === "add" || startChange.type === "del") {
          start = startChange.ln
        } else throw new Error(`Unknown change type.`)

        // get end line of the actual comment
        let end: number
        if (endChange.type === "normal") {
          end = endChange.ln2
        } else if (endChange.type === "add" || endChange.type === "del") {
          end = endChange.ln
        } else throw new Error(`Unknown change type.`)
        // make sure start and end are within the hunk
        end = Math.min(end, endSide === "RIGHT" ? startHunk.newStart + startHunk.newLines - 1 : startHunk.oldStart + startHunk.oldLines - 1)

        result.push({
          path: comment.path,
          start_side: startSide !== endSide ? startSide : undefined, // only set start_side if it is a multi-line comment
          side: startSide !== endSide ? endSide : startSide,
          start_line: start !== end && start < end ? start : undefined, // only set start_line if it is a multi-line comment, start must be less than end
          line: start !== end && start < end ? end : start,
          body: comment.comment,
        })
      }
    }
  })
  return result
}
