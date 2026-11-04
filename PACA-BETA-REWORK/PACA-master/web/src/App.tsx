import { useEffect, useRef, useState } from "react"
import {
  Check, Copy, Download, FileCode2, Loader2, Upload, Zap,
} from "lucide-react"
import { toast, Toaster } from "sonner"
import {
  PRESETS,
  type PacaPreset,
  type PacaLog,
  type PacaResult,
  type WorkerRequest,
  type WorkerResponse,
} from "@/lib/pacaTypes"

const initialSource = `local message = "Hello, World!"
print(message)`

const styles = `
*{box-sizing:border-box}
html,body,#root{margin:0;min-height:100%;background:#090909;color:#ededed}
body{font-family:Inter,system-ui,-apple-system,sans-serif;font-size:13px}
button,input,select,textarea{font:inherit}button{cursor:pointer}button:disabled{opacity:.42;cursor:not-allowed}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid #f0a4be;outline-offset:2px}
.app{min-height:100vh;background:radial-gradient(ellipse at 50% -20%,#241019 0%,#0b090a 44%,#090909 100%)}
.topbar{min-height:74px;border-bottom:1px solid #32232a;display:flex;align-items:center;justify-content:space-between;padding:14px 24px;gap:14px;background:#0b090ae8}
.brand{display:flex;align-items:center;gap:12px;min-width:0}.brand-icon{width:38px;height:38px;border-radius:10px;border:1px solid #63374a;display:grid;place-items:center;background:#1b1016;color:#f2a6c1}
.brand-line{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.brand-name{font-size:16px;font-weight:780;letter-spacing:.015em}.beta-tag{border-radius:999px;font-size:9px;line-height:1;border:1px solid #a14c6c;background:#29121c;color:#ffb5ce;padding:5px 7px;font-weight:800;letter-spacing:.13em}
.brand-sub{font-size:11px;color:#9b8990;margin-top:4px}.top-actions,.panel-actions{display:flex;align-items:center;gap:7px}
.btn,.small-btn{min-height:36px;border-radius:7px;border:1px solid #49313c;background:#151014;color:#eee5e9;padding:0 12px;display:inline-flex;align-items:center;justify-content:center;gap:7px;transition:background .15s,border-color .15s}
.btn:hover:not(:disabled),.small-btn:hover:not(:disabled){background:#281922;border-color:#986078}.btn-primary{background:#d77b9d;color:#180c12;border-color:#d77b9d;font-weight:800}.btn-primary:hover:not(:disabled){background:#ee9fba;color:#180c12}
.toolbar{display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:14px 24px;border-bottom:1px solid #2c2026;background:#100c0f}
.field{display:flex;align-items:center;gap:9px}.field label{font-size:11px;color:#b49fa8}.select,.seed-input{height:36px;border-radius:7px;border:1px solid #4a333e;background:#171116;color:#eee5e9;padding:0 10px;outline:none}.select:focus,.seed-input:focus{border-color:#d77b9d}.seed-input{width:130px}
.target-chip{border-radius:7px;margin-left:auto;display:flex;align-items:center;gap:8px;color:#c7aeb9;font-size:11px;border:1px solid #49313c;padding:9px 11px;background:#151014}.target-dot{width:7px;height:7px;background:#78c9a0}
.workspace{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;padding:18px 24px}.panel{min-width:0;border-radius:11px;overflow:hidden;border:1px solid #3a2931;background:#0d0b0d}.panel-head{min-height:49px;padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid #34252c}.panel-title{display:flex;align-items:center;gap:9px;font-weight:700;font-size:12px}.dot{width:7px;height:7px;background:#aa7187;flex-shrink:0}
.editor{display:block;width:100%;height:390px;resize:vertical;border:0;outline:0;padding:16px;background:#0a090a;color:#f0e8ec;font:12px/1.8 "SFMono-Regular",Consolas,monospace;white-space:pre;overflow:auto}.editor:focus{box-shadow:inset 0 0 0 1px #694154}.editor::placeholder{color:#695b62}
.panel-foot{min-height:38px;padding:9px 12px;border-top:1px solid #34252c;display:flex;align-items:center;justify-content:space-between;color:#8e7b84;font-size:10px}
.upload-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:0 24px 18px}.hint{font-size:11px;color:#9a8790}.protection-note{border-radius:7px;display:flex;align-items:center;gap:7px;color:#c6a7b5;font-size:10px;border:1px solid #46303a;padding:9px 11px;background:#120e11}.protection-note svg{color:#e79ab6}
.logs{margin:0 24px 22px;border-radius:10px;overflow:hidden;border:1px solid #3a2931;background:#0a090a}.logs-head{padding:12px 14px;border-bottom:1px solid #34252c;color:#c6b2bb;font-size:11px;font-weight:750}.logs-body{padding:12px 14px;min-height:45px;max-height:170px;overflow:auto;font:11px/1.8 monospace;color:#a08e96;white-space:pre-wrap;overflow-wrap:anywhere}.log-error{color:#ff8585}.log-warn{color:#e4c47b}.log-info{color:#bcaab2}
.top-status{display:flex;align-items:center;gap:8px;border:1px solid #3c3036;border-radius:999px;padding:9px 12px;color:#bca9b1;font-size:10px;letter-spacing:.04em;background:#130f12}.top-status i{display:block;width:7px;height:7px;border-radius:50%;background:#78c9a0;box-shadow:0 0 12px #78c9a066}
.status{display:flex;align-items:center;gap:7px}.status-dot{width:6px;height:6px;background:#555}.status-dot.ok{background:#76d5a1}.hidden-file{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
.footer{padding:0 24px 20px;color:#806d76;font-size:10px;display:flex;justify-content:space-between;gap:10px}
@media(max-width:760px){.topbar{padding:12px;align-items:center}.top-status{font-size:0;gap:0;padding:10px}.top-status i{width:7px;height:7px}.brand-sub{max-width:210px;line-height:1.4}.hide-mobile{display:none}.toolbar{padding:12px;gap:12px}.field{flex:1;min-width:125px;justify-content:space-between}.select{max-width:145px;width:100%;min-width:0}.seed-input{width:100px}.target-chip{margin-left:0;width:100%;justify-content:center}.workspace{grid-template-columns:minmax(0,1fr);padding:12px;gap:12px}.editor{height:290px}.upload-row{padding:0 12px 14px;align-items:stretch}.upload-row>.btn{width:100%}.protection-note{width:100%;justify-content:center}.logs{margin:0 12px 18px}.footer{padding:0 12px 16px;flex-direction:column}.panel-head{align-items:flex-start}.panel-actions{flex-wrap:wrap;justify-content:flex-end}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
`

function makeSeed() {
  return Math.floor(Math.random() * 2147483646) + 1
}

function saveLua(text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "PACA_BETA_obfuscated.luau"
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function App() {
  const [source, setSource] = useState(initialSource)
  const [output, setOutput] = useState("")
  const [preset, setPreset] = useState<PacaPreset>("Medium")
  const [seed, setSeed] = useState(makeSeed)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [logs, setLogs] = useState<PacaLog[]>([])
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    const worker = new Worker(new URL("./worker/paca.worker.ts", import.meta.url), { type: "module" })
    workerRef.current = worker
    worker.onerror = (event) => {
      setLogs((old) => [...old, { level: "error", message: event.message || "엔진 처리 중 오류가 발생했습니다." }])
      setBusy(false)
      toast.error("엔진 처리 중 오류가 발생했습니다.")
    }
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  async function obfuscate() {
    if (busy) return
    if (!source.trim()) {
      toast.error("Luau 코드를 입력해 주세요.")
      return
    }

    setBusy(true)
    setOutput("")
    setLogs([])
    const id = ++requestId.current

    try {
      let worker = workerRef.current
      if (!worker) {
        worker = new Worker(new URL("./worker/paca.worker.ts", import.meta.url), { type: "module" })
        workerRef.current = worker
      }

      const request: WorkerRequest = {
        id,
        action: "obfuscate",
        options: { source, preset, seed },
      }

      const result = await new Promise<PacaResult>((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          cleanup()
          reject(new Error("처리 시간이 초과되었습니다."))
        }, 240000)

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

      setLogs((old) => [...old, ...result.logs])
      if (result.ok) {
        setOutput(result.output)
        setSeed(makeSeed())
        toast.success("PACA 난독화가 완료되었습니다.")
      } else {
        setLogs((old) => [...old, { level: "error", message: result.error }])
        toast.error("난독화에 실패했습니다. 로그를 확인해 주세요.")
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setLogs((old) => [...old, { level: "error", message }])
      toast.error("실행 중 오류가 발생했습니다. 로그를 확인해 주세요.")
    } finally {
      setBusy(false)
    }
  }

  async function copyOutput() {
    if (!output) {
      toast.error("복사할 결과가 없습니다.")
      return
    }
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      toast.success("결과를 클립보드에 복사했습니다.")
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("클립보드에 접근할 수 없습니다.")
    }
  }

  async function uploadFile(file?: File) {
    if (!file) return
    try {
      setSource(await file.text())
      setOutput("")
      setLogs([])
      toast.success("파일을 불러왔습니다.")
    } catch {
      toast.error("파일을 읽지 못했습니다.")
    }
  }

  return (
    <div className="app">
      <style>{styles}</style>
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><FileCode2 size={19} /></div>
          <div>
            <div className="brand-line">
              <div className="brand-name">파카난독화기</div>
              <span className="beta-tag">BETA</span>
            </div>
            <div className="brand-sub">Roblox Luau · 브라우저 기반 보호 도구</div>
          </div>
        </div>
        <div className="top-actions">
          <div className="top-status"><i />BROWSER PROCESSING</div>
        </div>
      </header>

      <section className="toolbar">
        <div className="field">
          <label htmlFor="preset">보호 강도</label>
          <select id="preset" className="select" value={preset} disabled={busy}
            onChange={(e) => setPreset(e.target.value as PacaPreset)}>
            {PRESETS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="seed">Seed</label>
          <input id="seed" className="seed-input" type="number" min="1" value={seed} disabled={busy}
            onChange={(e) => setSeed(Math.max(1, Number(e.target.value) || 1))} />
        </div>
        <div className="target-chip"><span className="target-dot" />대상 언어 · Roblox Luau</div>
      </section>

      <main className="workspace">
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title"><span className="dot" />입력 코드</div>
            <div className="panel-actions">
              <label className="small-btn" style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}>
                <Upload size={13} />파일 열기
                <input className="hidden-file" type="file" accept=".lua,.luau,.txt,text/plain"
                  onChange={(e) => { void uploadFile(e.currentTarget.files?.[0]); e.currentTarget.value = "" }} />
              </label>
              <button className="small-btn" onClick={() => setSource("")} disabled={!source || busy}>지우기</button>
            </div>
          </div>
          <textarea className="editor" value={source} onChange={(e) => setSource(e.target.value)}
            placeholder="Roblox Luau 코드를 입력해 주세요." spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-label="Luau 입력 코드" />
          <div className="panel-foot"><span>Luau 소스</span><span>{source.length.toLocaleString()}자</span></div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-title"><span className="dot" style={{ background: output ? "#76d5a1" : "#555" }} />난독화 결과</div>
            <div className="panel-actions">
              <button className="small-btn" onClick={copyOutput} disabled={!output}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "복사 완료" : "복사"}</button>
              <button className="small-btn" onClick={() => saveLua(output)} disabled={!output}><Download size={13} />다운로드</button>
            </div>
          </div>
          <textarea className="editor" value={output} readOnly placeholder="난독화 결과가 여기에 표시됩니다." spellCheck={false} aria-label="난독화 결과" />
          <div className="panel-foot">
            <span className="status"><span className={`status-dot ${output ? "ok" : ""}`} />{output ? "완료" : "대기 중"}</span>
            <span>{output.length.toLocaleString()}자</span>
          </div>
        </section>
      </main>

      <section className="upload-row">
        <button className="btn btn-primary" onClick={obfuscate} disabled={busy}>
          {busy ? <Loader2 size={14} className="spin" /> : <Zap size={14} />}
          {busy ? "처리 중..." : "난독화 실행"}
        </button>
        <div className="protection-note">내장 무결성 검사는 VM 보호 프리셋에 자동 적용됩니다.</div>
        <span className="hint">Minify / Weak는 경량 AST 변환, Medium / Strong은 VM 보호를 사용합니다.</span>
      </section>

      <section className="logs">
        <div className="logs-head">실행 로그</div>
        <div className="logs-body">{logs.length === 0 ? "표시할 로그가 없습니다." : logs.map((log, index) => (
          <div key={`${log.level}-${index}`} className={log.level === "error" ? "log-error" : log.level === "warn" ? "log-warn" : "log-info"}>
            [{log.level.toUpperCase()}] {log.message}
          </div>
        ))}</div>
      </section>

      <footer className="footer">
        <span>파카난독화기 <span style={{ color: "#ffb5ce", fontWeight: 800 }}>BETA</span></span>
        <span>Luau · 브라우저 내 처리 · PACA</span>
      </footer>

      <Toaster theme="dark" position="top-center" closeButton richColors toastOptions={{
        style: { background: "#151014", color: "#f2e8ed", border: "1px solid #563848", borderRadius: 8, boxShadow: "0 8px 30px #0009" },
      }} />
    </div>
  )
}
