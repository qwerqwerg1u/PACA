export const PRESETS = ["Minify", "Weak", "Medium", "Strong"] as const

export type PacaPreset = (typeof PRESETS)[number]
export type PacaLogLevel = "info" | "warn" | "error"

export interface PacaOptions {
  source: string
  preset: PacaPreset
  seed: number
}

export interface PacaLog {
  level: PacaLogLevel
  message: string
}

export interface PacaSuccess {
  ok: true
  output: string
  logs: PacaLog[]
}

export interface PacaFailure {
  ok: false
  error: string
  logs: PacaLog[]
}

export type PacaResult = PacaSuccess | PacaFailure

export interface WorkerRequest {
  id: number
  action: "obfuscate"
  options: PacaOptions
}

export type WorkerResponse =
  | { id: number; type: "result"; result: PacaResult }
  | { id: number; type: "log"; log: PacaLog }
