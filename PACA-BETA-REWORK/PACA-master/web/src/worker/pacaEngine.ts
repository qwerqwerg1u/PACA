import {
  compile,
  generateVM,
  lex,
  obfuscate,
  parseWithErrors,
  printChunk,
} from "@/generated/clyde/index.js"
import type { PacaLog, PacaOptions, PacaResult } from "@/lib/pacaTypes"

const WATERMARK = "--[[ PACA BETA | Protected by PACA ]]\n"

type DiagnosticLike = {
  message?: unknown
  loc?: { start?: { line?: number; column?: number } }
}

function formatDiagnostics(items: DiagnosticLike[]): string {
  return items.map((item) => {
    const line = item.loc?.start?.line
    const column = item.loc?.start?.column
    const position = typeof line === "number"
      ? `line ${line}${typeof column === "number" ? `, column ${column}` : ""}: `
      : ""
    return `${position}${String(item.message ?? "Luau syntax error")}`
  }).join("\n")
}

function parseSource(source: string) {
  const lexical = lex(source)
  if (lexical.errors.length > 0) {
    throw new Error(`Lexer 오류:\n${formatDiagnostics(lexical.errors)}`)
  }

  const parsed = parseWithErrors(lexical.tokens)
  if (parsed.errors.length > 0) {
    throw new Error(`Parser 오류:\n${formatDiagnostics(parsed.errors)}`)
  }
  return parsed.ast
}

export function validateLuauSource(source: string): { valid: boolean; error?: string } {
  try {
    parseSource(source)
    return { valid: true }
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function runPacaEngine(options: PacaOptions): Promise<PacaResult> {
  const logs: PacaLog[] = []
  const log = (message: string, level: PacaLog["level"] = "info") => logs.push({ level, message })

  try {
    if (!options.source.trim()) throw new Error("입력 코드가 비어 있습니다.")
    const seed = Math.max(1, Math.floor(options.seed) || 1)

    log("PACA Luau Lexer를 시작합니다.")
    const ast = parseSource(options.source)
    log("Luau Parser가 입력 코드를 AST로 변환했습니다.")

    if (options.preset === "Minify") {
      const output = printChunk(ast)
      parseSource(output)
      log("AST Printer 출력 검증이 완료되었습니다.")
      return { ok: true, output: WATERMARK + output, logs }
    }

    const transformedAst = obfuscate(ast, {
      renameLocals: true,
      preserveGlobals: true,
      seed,
    })

    if (options.preset === "Weak") {
      const output = printChunk(transformedAst)
      parseSource(output)
      log("식별자 변환 및 출력 파싱 검증이 완료되었습니다.")
      return { ok: true, output: WATERMARK + output, logs }
    }

    log("AST를 Luau VM 바이트코드로 컴파일합니다.")
    const bytecode = compile(transformedAst)
    // Clyde emits its runtime code-hash check only for the max VM level.
    // Both VM presets therefore use max; Medium disables selected costly layers.
    const isStrong = options.preset === "Strong"
    const mediumDisabledFeatures = [
      "fakeHandlers",
      "opaquePredicates",
      "cff",
      "handlerMutation",
      "handlerNoise",
      "antiDebug",
      "nopCamouflage",
      "contextOpcodes",
      "nonLinearJumps",
      "antiHookDeep",
      "antiDump",
      "sandboxDetect",
      "runtimeMonitor",
      "stringMutation",
      "adaptiveFragments",
      "stackPooling",
    ]

    log(`${isStrong ? "Strong" : "Medium"} VM 보호 계층과 코드 무결성 검사를 생성합니다.`)
    const output = generateVM(bytecode, {
      level: "max",
      executorGlobals: true,
      polymorphicSeed: seed,
      forceSingleVM: true,
      _noWatermark: true,
      forceFeatures: ["antiTamper"],
      disableFeatures: isStrong ? [] : mediumDisabledFeatures,
    })

    if (!output.trim()) throw new Error("VM 엔진이 빈 결과를 반환했습니다.")
    parseSource(output)
    log("VM 생성, 내장 무결성 검사, 생성 코드 파싱 검증이 완료되었습니다.")
    return { ok: true, output: WATERMARK + output, logs }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log(message, "error")
    return { ok: false, error: message, logs }
  }
}
