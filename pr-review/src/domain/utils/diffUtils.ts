// Utility functions for diff and string operations

export function createPatch(hunk: { changes: { content: string }[] }): string {
  return hunk.changes.map(c => c.content).join("\n")
}

export function fileNameFromDiff(file: { from: string; to: string }): string {
  return file.from === file.to ? file.from : `${file.from} → ${file.to}`
}
