export interface SourcePosition {
  line: number
  column: number
  offset?: number
}

export interface SourceLocation {
  start: SourcePosition
  end: SourcePosition
}

export interface Diagnostic {
  message: string
  loc?: SourceLocation
}

export interface LexResult {
  tokens: unknown[]
  errors: Diagnostic[]
}

export interface ParseResult {
  ast: unknown
  errors: Diagnostic[]
}

export interface ObfuscatorOptions {
  renameLocals?: boolean
  preserveGlobals?: boolean
  seed?: number
}

export type FeatureFlag =
  | "fakeHandlers" | "opaquePredicates" | "cff"
  | "handlerMutation" | "handlerNoise" | "antiDebug"
  | "antiTamper" | "superOperators" | "constantFolding"
  | "minification" | "stringFragment" | "lazyDecode" | "nopCamouflage"
  | "contextOpcodes" | "nonLinearJumps" | "antiHookDeep" | "antiDump"
  | "sandboxDetect" | "cfi" | "runtimeMonitor" | "stringMutation"
  | "adaptiveFragments" | "stackPooling"

export interface VMGenOptions {
  level?: "debug" | "normal" | "max"
  executorGlobals?: boolean
  polymorphicSeed?: number
  forceSingleVM?: boolean
  forceFeatures?: FeatureFlag[]
  disableFeatures?: FeatureFlag[]
  _noWatermark?: boolean
  noCompression?: boolean
}

export declare function lex(source: string): LexResult
export declare function parseWithErrors(tokens: unknown[]): ParseResult
export declare function obfuscate(ast: unknown, options?: ObfuscatorOptions): unknown
export declare function printChunk(ast: unknown): string
export declare function compile(ast: unknown): unknown
export declare function generateVM(bytecode: unknown, options?: VMGenOptions): string
