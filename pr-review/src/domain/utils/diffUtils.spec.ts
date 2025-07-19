// import { describe, expect, it } from "vitest"
// import { createPatch, fileNameFromDiff } from "./diffUtils.js"

// describe("diffUtils", () => {
//   it("createPatch joins hunk changes", () => {
//     const hunk = { changes: [{ content: "a" }, { content: "b" }] }
//     expect(createPatch(hunk)).toBe("a\nb")
//   })

//   it("fileNameFromDiff returns correct name for unchanged file", () => {
//     expect(fileNameFromDiff({ from: "foo.js", to: "foo.js" })).toBe("foo.js")
//   })

//   it("fileNameFromDiff returns correct name for renamed file", () => {
//     expect(fileNameFromDiff({ from: "foo.js", to: "bar.js" })).toBe("foo.js → bar.js")
//   })
// })
