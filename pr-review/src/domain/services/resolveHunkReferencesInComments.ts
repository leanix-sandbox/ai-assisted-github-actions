import * as core from "@actions/core"
import { File } from "parse-diff"
import type { AiReview } from "../model/types.ts"
import { ReviewComment } from "../model/types.ts"

/**
 * Map comments from the AI model to GitHub review comments and ensure a comment references only one single hunk.
 */
export function resolveHunkReferencesInComments(comments: AiReview["comments"], files: File[]): ReviewComment[] {
  const result: ReviewComment[] = []
  comments.forEach((comment: any) => {
    const currentFile = files.find(file => file.from === comment.path || file.to === comment.path)
    if (!currentFile) {
      core.warning(`Could not find file for comment on ${comment.path}, start ${comment.start}, end ${comment.end}, ${comment.comment}, skipping.`)
    } else {
      const hunkChangeMap = currentFile.chunks.flatMap(hunk => hunk.changes.map(change => ({ change, hunk })))
      let { change: startChange, hunk: startHunk } = hunkChangeMap[comment.start - 1]
      let { change: endChange, hunk: endHunk } = hunkChangeMap[comment.end - 1]

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
          start_side: startSide !== endSide ? startSide : undefined,
          side: startSide !== endSide ? endSide : startSide,
          start_line: start !== end && start < end ? start : undefined,
          line: start !== end && start < end ? end : start,
          body: comment.comment,
        })
      }
    }
  })
  return result
}
