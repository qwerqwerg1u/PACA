import { useEffect, useRef, useState } from "react"
import { Check, Copy, Download, FileCode2, Loader2, Upload, Zap } from "lucide-react"
import { toast, Toaster } from "sonner"
import {
  LUA_VERSIONS,
  PRESETS,
  type LuaVersion,
  type PresetName,
  type PrometheusLog,
  type PrometheusResult,
  type WorkerRequest,
  type WorkerResponse,
} from "@/lib/prometheusTypes"

const initialSource = `local message = "Hello, World!"
print(message)`

const styles = `
*{box-sizing:border-box}
html,body,#root{margin:0;min-height:100%;background:#050505;color:#e7e7e7}
body{font-family:Inter,system-ui,-apple-system,sans-serif;font-size:13px}
button,input,select,textarea{font:inherit}
button{cursor:pointer}
button:disabled{opacity:.38;cursor:not-allowed}
.app{min-height:100vh;background:#050505;color:#e7e7e7}
.topbar{height:62px;border-bottom:1px solid #202020;display:flex;align-items:center;justify-content:space-between;padding:0 22px;gap:12px}
.brand{display:flex;align-items:center;gap:10px;min-width:0}
.brand-icon{width:32px;height:32px;border:1px solid #303030;border-radius:8px;display:grid;place-items:center;background:#101010}
.brand-name{font-size:14px;font-weight:650;letter-spacing:-.3px}
.brand-sub{font-size:11px;color:#666;margin-top:3px}
.top-actions{display:flex;align-items:center;gap:8px}
.btn{min-height:36px;border:1px solid #303030;background:#101010;color:#ddd;border-radius:7px;padding:0 12px;display:inline-flex;align-items:center;justify-content:center;gap:7px;white-space:nowrap}
.btn:hover:not(:disabled){background:#191919;border-color:#484848}
.btn-primary{background:#eee;color:#080808;border-color:#eee;font-weight:650}
.btn-primary:hover:not(:disabled){background:#d4d4d4;color:#000}
.toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 22px;border-bottom:1px solid #202020}
.field{display:flex;align-items:center;gap:8px}
.field label{font-size:11px;color:#777}
.select,.seed-input{height:34px;border:1px solid #292929;border-radius:6px;background:#0d0d0d;color:#ddd;padding:0 10px;outline:none}
.seed-input{width:130px}
.workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;padding:16px 22px}
.panel{min-width:0;border:1px solid #242424;border-radius:9px;overflow:hidden;background:#090909}
.panel-head{min-height:47px;padding:9px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid #222}
.panel-title{display:flex;align-items:center;gap:8px;font-weight:600;font-size:12px}
.dot{width:7px;height:7px;border-radius:50%;background:#777}
.panel-actions{display:flex;align-items:center;gap:6px}
.small-btn{height:30px;border:1px solid #303030;border-radius:6px;background:#111;color:#ccc;padding:0 9px;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:11px}
.small-btn:hover:not(:disabled){background:#1b1b1b}
.editor{display:block;width:100%;height:390px;resize:vertical;border:0;outline:0;padding:16px;background:#080808;color:#e5e5e5;font:12px/1.8 "SFMono-Regular",Consolas,monospace;tab-size:2;white-space:pre;overflow:auto}
.editor::placeholder{color:#484848}
.editor:focus{box-shadow:inset 0 0 0 1px #333}
.panel-foot{min-height:37px;padding:8px 12px;border-top:1px solid #202020;display:flex;align-items:center;justify-content:space-between;gap:8px;color:#666;font-size:10px}
.status{display:flex;align-items:center;gap:6px}
.status-dot{width:6px;height:6px;border-radius:50%;background:#555}
.status-dot.ok{background:#65b887}
.status-dot.error{background:#e06d6d}
.upload-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:0 22px 16px}
.hidden-file{display:none}
.hint{color:#666;font-size:11px}
.logs{margin:0 22px 24px;border:1px solid #242424;border-radius:8px;overflow:hidden;background:#080808}
.logs-head{padding:11px 13px;border-bottom:1px solid #202020;color:#999;font-size:11px;font-weight:600}
.logs-body{padding:10px 13px;max-height:150px;overflow:auto;font:11px/1.7 "SFMono-Regular",Consolas,monospace;color:#777;white-space:pre-wrap;overflow-wrap:anywhere}
.log-error{color:#ef8585}
.log-warn{color:#d9b66e}
.log-info{color:#999}
.footer{padding:0 22px 20px;color:#444;font-size:10px}
@media(max-width:760px){
 .topbar{height:auto;min-height:60px;padding:12px;align-items:flex-start}
 .brand-sub{max-width:180px;line-height:1.4}
 .top-actions .hide-mobile{display:none}
 .top-actions .btn{padding:0 10px}
 .toolbar{padding:12px;gap:9px}
 .field{flex:1;min-width:125px;justify-content:space-between}
 .select{max-width:145px;width:100%}
 .seed-input{width:100px}
 .workspace{grid-template-columns:minmax(0,1fr);padding:12px;gap:12px}
 .editor{height:290px;font-size:12px}
 .upload-row{padding:0 12px 14px}
 .logs{margin:0 12px 20px}
 .footer{padding:0 12px 18px}
}
`

function makeSeed() {
  return Math.floor(Math.random() * 2147483646) + 1
}

function saveLua(text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "prometheus.obfuscated.lua"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [source, setSource] = useState(initialSource)
  const [output, setOutput] = useState("")
  const [preset, setPreset] = useState<PresetName>("Medium")
  const [luaVersion, setLuaVersion] = useState<LuaVersion>("Lua51")
  const [seed, setSeed] = useState(makeSeed)
  const [prettyPrint, setPrettyPrint] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [logs, setLogs] = useState<PrometheusLog[]>([])
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    const worker = new Worker(
      new URL("./worker/prometheus.worker.ts", import.meta.url),
      { type: "module" },
    )
    workerRef.current = worker
    worker.onerror = (event) => {
      setLogs((old) => [
        ...old,
        { level: "error", message: event.message || "Worker failed." },
      ])
      setBusy(false)
    }
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  async function obfuscate() {
    if (busy) return
    if (!source.trim()) {
      toast.error("먼저 Lua 코드를 입력해 줘.")
      return
    }

    setBusy(true)
    setOutput("")
    setLogs([])
    const id = ++requestId.current

    try {
      let worker = workerRef.current
      if (!worker) {
        worker = new Worker(
          new URL("./worker/prometheus.worker.ts", import.meta.url),
          { type: "module" },
        )
        workerRef.current = worker
      }

      const request: WorkerRequest = {
        id,
        action: "obfuscate",
        options: {
          source,
          filename: "input.lua",
          preset,
          luaVersion,
          prettyPrint,
          seed,
        },
      }

      const result = await new Promise<PrometheusResult>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          cleanup()
          reject(new Error("실행 시간이 초과됐어."))
        }, 90000)

        const cleanup = () => {
          window.clearTimeout(timeout)
          worker!.removeEventListener("message", listener)
        }

        const listener = (event: MessageEvent<WorkerResponse>) => {
          const message = event.data
          if (message.id !== id) return

          if (message.type === "log") {
            setLogs((old) => [...old, message.log])
            return
          }

          if (message.type === "result") {
            cleanup()
            resolve(message.result)
          }
        }

        worker!.addEventListener("message", listener)
        worker!.postMessage(request)
      })

      setLogs(result.logs)

      if (result.ok) {
        setOutput(result.output)
        setSeed(makeSeed())
        toast.success("난독화 완료")
      } else {
        setLogs([
          ...result.logs,
          { level: "error", message: result.error },
        ])
        toast.error("난독화 실패")
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error)
      setLogs([{ level: "error", message }])
      toast.error("실행 중 오류가 발생했어.")
    } finally {
      setBusy(false)
    }
  }

  async function copyOutput() {
    if (!output) {
      toast.error("복사할 결과가 없어.")
      return
    }

    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      toast.success("결과를 복사했어.")
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("클립보드 접근이 차단됐어.")
    }
  }

  async function uploadFile(file?: File) {
    if (!file) return

    try {
      const text = await file.text()
      setSource(text)
      setOutput("")
      setLogs([])
      toast.success(`${file.name} 불러오기 완료`)
    } catch {
      toast.error("파일을 읽지 못했어.")
    }
  }

  return (
    <div className="app">
      <style>{styles}</style>

      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <FileCode2 size={17} />
          </div>
          <div>
            <div className="brand-name">Prometheus</div>
            <div className="brand-sub">Lua obfuscator · In-browser</div>
          </div>
        </div>

        <div className="top-actions">
          <a
            className="btn hide-mobile"
            href="https://github.com/yunjun3737-ship-it/Prometheus"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            GitHub
          </a>
          <button
            className="btn btn-primary"
            onClick={obfuscate}
            disabled={busy}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            {busy ? "처리 중..." : "난독화"}
          </button>
        </div>
      </header>

      <section className="toolbar">
        <div className="field">
          <label htmlFor="preset">강도</label>
          <select
            id="preset"
            className="select"
            value={preset}
            disabled={busy}
            onChange={(e) => setPreset(e.target.value as PresetName)}
          >
            {PRESETS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="lua-version">Lua 버전</label>
          <select
            id="lua-version"
            className="select"
            value={luaVersion}
            disabled={busy}
            onChange={(e) => setLuaVersion(e.target.value as LuaVersion)}
          >
            {LUA_VERSIONS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="seed">Seed</label>
          <input
            id="seed"
            className="seed-input"
            type="number"
            min="1"
            value={seed}
            disabled={busy}
            onChange={(e) => setSeed(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>

        <label className="field" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={prettyPrint}
            disabled={busy}
            onChange={(e) => setPrettyPrint(e.target.checked)}
          />
          <span style={{ color: "#999", fontSize: 11 }}>Pretty print</span>
        </label>
      </section>

      <main className="workspace">
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title">
              <span className="dot" />
              입력 코드
            </div>
            <div className="panel-actions">
              <label className="small-btn" style={{ cursor: "pointer" }}>
                <Upload size={13} />
                파일 열기
                <input
                  className="hidden-file"
                  type="file"
                  accept=".lua,.luau,.txt,text/plain"
                  onChange={(e) => {
                    void uploadFile(e.target.files?.[0])
                    e.currentTarget.value = ""
                  }}
                />
              </label>
              <button
                className="small-btn"
                onClick={() => setSource("")}
                disabled={!source || busy}
              >
                지우기
              </button>
            </div>
          </div>

          <textarea
            className="editor"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="여기에 Lua 코드를 직접 붙여넣어..."
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Lua 입력 코드"
          />

          <div className="panel-foot">
            <span>Lua source</span>
            <span>{source.length.toLocaleString()} chars</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-title">
              <span className="dot" style={{ background: output ? "#65b887" : "#555" }} />
              난독화 결과
            </div>
            <div className="panel-actions">
              <button
                className="small-btn"
                onClick={copyOutput}
                disabled={!output}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "복사됨" : "복사"}
              </button>
              <button
                className="small-btn"
                onClick={() => saveLua(output)}
                disabled={!output}
              >
                <Download size={13} />
                다운로드
              </button>
            </div>
          </div>

          <textarea
            className="editor"
            value={output}
            readOnly
            placeholder="난독화된 결과가 여기에 표시돼..."
            spellCheck={false}
            aria-label="난독화 결과"
          />

          <div className="panel-foot">
            <span className="status">
              <span className={`status-dot ${output ? "ok" : ""}`} />
              {output ? "완료" : "대기 중"}
            </span>
            <span>{output.length.toLocaleString()} chars</span>
          </div>
        </section>
      </main>

      <section className="upload-row">
        <button className="btn btn-primary" onClick={obfuscate} disabled={busy}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {busy ? "난독화 중..." : "난독화 실행"}
        </button>
        <span className="hint">코드는 브라우저에서 처리돼.</span>
      </section>

      <section className="logs">
        <div className="logs-head">실행 로그</div>
        <div className="logs-body">
          {logs.length === 0
            ? "로그 없음"
            : logs.map((log, index) => (
                <div
                  key={`${log.level}-${index}`}
                  className={
                    log.level === "error"
                      ? "log-error"
                      : log.level === "warn"
                        ? "log-warn"
                        : "log-info"
                  }
                >
                  [{log.level.toUpperCase()}] {log.message}
                </div>
              ))}
        </div>
      </section>

      <footer className="footer">
        Prometheus · Minimal Lua obfuscation playground
      </footer>

      <Toaster theme="dark" position="bottom-center" />
    </div>
  )
}
