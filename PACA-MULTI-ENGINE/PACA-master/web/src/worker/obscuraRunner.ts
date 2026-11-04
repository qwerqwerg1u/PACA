import { obscuraPythonSources } from "@/generated/obscuraPythonSources"
import type { PrometheusLog, PrometheusOptions, PrometheusResult } from "@/lib/prometheusTypes"

const PYODIDE_VERSION = "0.29.5"
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`
const OBSCURA_ROOT = "/home/pyodide/paca_obscura"

type PyodideRuntime = {
  FS: {
    mkdirTree(path: string): void
    writeFile(path: string, contents: string): void
  }
  globals: {
    set(name: string, value: unknown): void
  }
  runPythonAsync(code: string): Promise<unknown>
}

type PyodideModule = {
  loadPyodide(options: { indexURL: string }): Promise<PyodideRuntime>
}

let runtimePromise: Promise<PyodideRuntime> | null = null

function getPythonFiles(): Record<string, string> {
  const files = Object.entries(obscuraPythonSources)
  if (!files.some(([name]) => name.endsWith("/config.py") || name === "config.py")) {
    throw new Error(
      "Obscura Luau 엔진 파일이 빌드에 포함되지 않았습니다. GitHub Actions에서 third_party/obscura 체크아웃 단계를 확인해 주세요.",
    )
  }

  const normalized: Record<string, string> = {}
  for (const [sourcePath, contents] of files) {
    const marker = "/obscura/"
    const markerIndex = sourcePath.indexOf(marker)
    const relativePath = markerIndex >= 0
      ? sourcePath.slice(markerIndex + marker.length)
      : sourcePath.replace(/^\.\//, "")

    if (!relativePath || relativePath.startsWith("../") || relativePath.includes("/tests/")) {
      continue
    }

    normalized[relativePath] = contents
  }

  return normalized
}

async function initializeRuntime(): Promise<PyodideRuntime> {
  const pythonFiles = getPythonFiles()
  const moduleUrl = `${PYODIDE_BASE}pyodide.mjs`
  const pyodideModule = await import(/* @vite-ignore */ moduleUrl) as PyodideModule
  const runtime = await pyodideModule.loadPyodide({ indexURL: PYODIDE_BASE })

  runtime.FS.mkdirTree(OBSCURA_ROOT)
  for (const [relativePath, contents] of Object.entries(pythonFiles)) {
    const absolutePath = `${OBSCURA_ROOT}/${relativePath}`
    const parent = absolutePath.slice(0, absolutePath.lastIndexOf("/"))
    runtime.FS.mkdirTree(parent)
    runtime.FS.writeFile(absolutePath, contents)
  }

  await runtime.runPythonAsync(`
import sys
_engine_root = ${JSON.stringify(OBSCURA_ROOT)}
if _engine_root not in sys.path:
    sys.path.insert(0, _engine_root)
`)

  return runtime
}

async function getRuntime(): Promise<PyodideRuntime> {
  if (!runtimePromise) {
    runtimePromise = initializeRuntime().catch((error) => {
      runtimePromise = null
      throw error
    })
  }
  return runtimePromise
}

function makePythonProgram(options: PrometheusOptions): string {
  const minify = !options.prettyPrint
  return `
from config import ObfuscationConfig, ProtectionLevel
from obfuscator import Obfuscator

_preset = PACA_PRESET
if _preset == "Minify":
    _config = ObfuscationConfig(
        seed=PACA_SEED,
        rename_identifiers=False,
        encrypt_strings=False,
        obfuscate_numbers=False,
        control_flow_flatten=False,
        opaque_predicates=False,
        inject_dead_code=False,
        table_indirection=False,
        anti_tamper=False,
        virtualize=False,
        minify=${minify ? "True" : "False"},
        strip_comments=True,
        strip_types=True,
    )
elif _preset == "Weak":
    _config = ObfuscationConfig(level=ProtectionLevel.MINIMAL, seed=PACA_SEED, minify=${minify ? "True" : "False"})
elif _preset == "Medium":
    _config = ObfuscationConfig(level=ProtectionLevel.STANDARD, seed=PACA_SEED, minify=${minify ? "True" : "False"})
else:
    _config = ObfuscationConfig(level=ProtectionLevel.PARANOID, seed=PACA_SEED, minify=${minify ? "True" : "False"})

_obfuscated = Obfuscator(_config).obfuscate(PACA_SOURCE)

# Parse the generated output again before it is returned to the user.
from parser.parser import Parser
Parser.from_source(_obfuscated).parse()
_obfuscated
`
}

export async function runObscura(options: PrometheusOptions): Promise<PrometheusResult> {
  const logs: PrometheusLog[] = [
    { level: "info", message: "Luau 엔진: Obscura 1.1.0 (MIT)" },
    { level: "info", message: "Pyodide WebAssembly 런타임을 준비하고 있습니다." },
  ]

  try {
    const runtime = await getRuntime()
    runtime.globals.set("PACA_SOURCE", options.source)
    runtime.globals.set("PACA_PRESET", options.preset)
    runtime.globals.set("PACA_SEED", Math.max(1, Math.floor(options.seed)))
    logs.push({ level: "info", message: "Luau Lexer → Parser → AST 변환을 시작합니다." })

    const rawOutput = await runtime.runPythonAsync(makePythonProgram(options))
    const output = typeof rawOutput === "string" ? rawOutput : String(rawOutput ?? "")
    if (!output.trim()) {
      throw new Error("Obscura가 빈 결과를 반환했습니다.")
    }

    logs.push({ level: "info", message: "Obscura 변환 및 생성 코드 파싱 검증을 완료했습니다." })
    return {
      ok: true,
      output: `--[[ PACA Obfuscator | Luau engine: Obscura | MIT ]]
${output}`,
      logs,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logs.push({ level: "error", message })
    return {
      ok: false,
      error: `PACA Luau 엔진 오류:\n${message}`,
      logs,
    }
  }
}
