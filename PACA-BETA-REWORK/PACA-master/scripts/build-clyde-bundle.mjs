import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"

const projectRoot = process.cwd()
const upstreamRoot = path.join(projectRoot, "third_party", "clyde")
const upstreamDist = path.join(upstreamRoot, "dist")
const outputRoot = path.join(projectRoot, "web", "src", "generated", "clyde")
const browserDeclarations = path.join(projectRoot, "scripts", "clyde-browser-entry.d.ts")
const licenseTarget = path.join(projectRoot, "THIRD_PARTY_CLYDE_LICENSE.txt")

async function requireFile(filePath, label) {
  try {
    await access(filePath)
  } catch {
    throw new Error(`${label} is missing: ${filePath}. Fetch and build sfr-development/Lua-Obfuscator-Clyde-Protection first.`)
  }
}

for (const [relativePath, label] of [
  ["index.js", "Clyde compiled entry point"],
  ["lexer/Lexer.js", "Clyde lexer"],
  ["parser/Parser.js", "Clyde parser"],
  ["obfuscator/Obfuscator.js", "Clyde AST transformer"],
  ["obfuscator/Printer.js", "Clyde AST printer"],
  ["vm/Compiler.js", "Clyde VM compiler"],
  ["vm/vm-gen.js", "Clyde VM generator"],
  ["index.d.ts", "Clyde TypeScript declarations"],
]) {
  await requireFile(path.join(upstreamDist, relativePath), label)
}
await requireFile(path.join(upstreamRoot, "LICENSE"), "Clyde license")
await requireFile(browserDeclarations, "PACA browser entry declarations")

await rm(outputRoot, { recursive: true, force: true })
await mkdir(outputRoot, { recursive: true })
await cp(upstreamDist, outputRoot, { recursive: true })
// Use a browser-only entry point so the web worker does not pull in the upstream
// Express/CLI validation server through the full package barrel.
const browserEntry = [
  'export { lex } from "./lexer/Lexer.js"',
  'export { parseWithErrors } from "./parser/Parser.js"',
  'export { obfuscate } from "./obfuscator/Obfuscator.js"',
  'export { printChunk } from "./obfuscator/Printer.js"',
  'export { compile } from "./vm/Compiler.js"',
  'export { generateVM } from "./vm/vm-gen.js"',
  "",
].join("\n")
await writeFile(path.join(outputRoot, "index.js"), browserEntry, "utf8")
await cp(browserDeclarations, path.join(outputRoot, "index.d.ts"))
const license = await readFile(path.join(upstreamRoot, "LICENSE"), "utf8")
await writeFile(licenseTarget, license, "utf8")
console.log("Bundled the MIT-licensed Clyde Luau core (browser-only lexer/parser/AST/VM exports) into web/src/generated/clyde/.")
