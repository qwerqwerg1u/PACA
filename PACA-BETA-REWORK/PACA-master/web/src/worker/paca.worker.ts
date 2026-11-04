import type { WorkerRequest, WorkerResponse } from "@/lib/pacaTypes"
import { runPacaEngine } from "./pacaEngine"

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  try {
    const result = await runPacaEngine(request.options)
    const response: WorkerResponse = { id: request.id, type: "result", result }
    self.postMessage(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const response: WorkerResponse = {
      id: request.id,
      type: "result",
      result: { ok: false, error: message, logs: [{ level: "error", message }] },
    }
    self.postMessage(response)
  }
}
