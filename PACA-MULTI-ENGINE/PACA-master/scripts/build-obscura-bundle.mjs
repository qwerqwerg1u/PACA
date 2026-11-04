import { readdir, readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"

const projectRoot = process.cwd()
const upstreamRoot = path.join(projectRoot, "third_party", "obscura")
const outputFile = path.join(projectRoot, "web", "src", "generated", "obscuraPythonSources.ts")
const requiredFiles = ["config.py", "obfuscator.py"]

async function exists(filePath) {
  try {
    await readFile(filePath)
    return true
  } catch {
    return false
  }
}

async function walk(directory, root, found = []) {
  const entries = await readdir(directory, { withFileTypes: true })
  entries.sort((a, b) => a.name.localeCompare(b.name))

  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "__pycache__" || entry.name === "tests") continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(absolute, root, found)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith(".py")) continue

    const relative = path.relative(root, absolute).split(path.sep).join("/")
    const include = requiredFiles.includes(relative)
      || relative.startsWith("parser/")
      || relative.startsWith("layers/")
      || relative.startsWith("utils/")
    if (include) {
      found.push([relative, await readFile(absolute, "utf8")])
    }
  }

  return found
}

for (const required of requiredFiles) {
  if (!(await exists(path.join(upstreamRoot, required)))) {
    throw new Error(
      `Missing Obscura source: ${path.join(upstreamRoot, required)}. `
      + "The deploy workflow must check out vo3pal/obscura into third_party/obscura.",
    )
  }
}

const entries = await walk(upstreamRoot, upstreamRoot)
if (entries.length < 8) {
  throw new Error(`Obscura source bundle is unexpectedly small (${entries.length} Python files).`)
}

const sourceObject = Object.fromEntries(entries)
const moduleText = [
  "// Generated from vo3pal/obscura during the PACA build. Do not edit by hand.",
  "export const obscuraPythonSources: Record<string, string> = ",
  JSON.stringify(sourceObject),
  "\n",
].join("")

await mkdir(path.dirname(outputFile), { recursive: true })
await writeFile(outputFile, moduleText, "utf8")
console.log(`Bundled ${entries.length} Obscura Python files (${Buffer.byteLength(moduleText)} bytes).`)
