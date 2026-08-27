import { useState, useMemo } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import CopyButton from '@/components/CopyButton'
import Button from '@/components/Button'

const TOOL = TOOLS.find((t) => t.path === '/jwt')!

// JWT 用 base64url 编码：先还原 -/_，补 padding，再 atob，最后 UTF-8 安全解码。
function decodeSegment(seg: string): string {
  const b64 = seg.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : ''
  const binary = atob(b64 + pad)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

// 秒级时间戳字段，友好展示为本地可读时间。
const TIME_FIELDS = ['exp', 'iat', 'nbf'] as const

function formatTimestamp(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return new Date(value * 1000).toLocaleString()
}

interface TimeInfo {
  field: string
  raw: number
  readable: string
  expired?: boolean
}

interface ParseResult {
  header: string
  payload: string
  times: TimeInfo[]
  error: string
}

function parseJwt(token: string): ParseResult {
  const empty: ParseResult = { header: '', payload: '', times: [], error: '' }
  const trimmed = token.trim()
  if (trimmed === '') return empty

  const parts = trimmed.split('.')
  if (parts.length !== 3) {
    return { ...empty, error: '格式无效：JWT 应包含三段（header.payload.signature）' }
  }

  let header: string
  let payloadObj: Record<string, unknown>
  let payload: string
  try {
    const headerObj = JSON.parse(decodeSegment(parts[0]))
    header = JSON.stringify(headerObj, null, 2)
  } catch {
    return { ...empty, error: 'Header 解析失败：不是有效的 base64url JSON' }
  }
  try {
    payloadObj = JSON.parse(decodeSegment(parts[1])) as Record<string, unknown>
    payload = JSON.stringify(payloadObj, null, 2)
  } catch {
    return { ...empty, error: 'Payload 解析失败：不是有效的 base64url JSON' }
  }

  const now = Date.now()
  const times: TimeInfo[] = []
  for (const field of TIME_FIELDS) {
    const readable = formatTimestamp(payloadObj[field])
    if (readable === null) continue
    const raw = payloadObj[field] as number
    const info: TimeInfo = { field, raw, readable }
    if (field === 'exp') info.expired = raw * 1000 < now
    times.push(info)
  }

  return { header, payload, times, error: '' }
}

const FIELD_LABELS: Record<string, string> = {
  exp: '过期时间 (exp)',
  iat: '签发时间 (iat)',
  nbf: '生效时间 (nbf)',
}

// 示例 JWT：header {alg:HS256,typ:JWT}，payload 含 sub/name/iat（不含 exp，避免示例随时间过期）。
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

export default function JwtPage() {
  useSeo(TOOL.name, TOOL.description)
  const [input, setInput] = useState(SAMPLE_JWT)

  const { header, payload, times, error } = useMemo(() => parseJwt(input), [input])
  const hasResult = header !== '' || payload !== ''

  return (
    <div className="page jwt-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <Button onClick={() => setInput('')}>清空</Button>
        </div>
      </header>

      <div className="jwt-body">
        <section className="jwt-input-pane">
          <div className="pane-header">
            <span className="pane-label">JWT</span>
            {error && <span className="error-badge">{error}</span>}
          </div>
          <textarea
            className="jwt-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴 JWT（形如 xxxxx.yyyyy.zzzzz）"
            spellCheck={false}
          />
        </section>

        {hasResult && (
          <div className="jwt-result">
            <section className="jwt-pane">
              <div className="pane-header">
                <span className="pane-label">Header</span>
                <CopyButton text={header} />
              </div>
              <pre className="jwt-output">{header}</pre>
            </section>

            <section className="jwt-pane">
              <div className="pane-header">
                <span className="pane-label">Payload</span>
                <CopyButton text={payload} />
              </div>
              <pre className="jwt-output">{payload}</pre>
              {times.length > 0 && (
                <ul className="jwt-times">
                  {times.map((t) => (
                    <li key={t.field} className="jwt-time-item">
                      <span className="jwt-time-label">{FIELD_LABELS[t.field] ?? t.field}</span>
                      <span className="jwt-time-value">{t.readable}</span>
                      {t.field === 'exp' && (
                        <span className={`error-badge ${t.expired ? '' : 'jwt-time-ok'}`}>
                          {t.expired ? '已过期' : '未过期'}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {!hasResult && !error && (
          <p className="error-hint">粘贴 JWT 后显示解析结果</p>
        )}
      </div>
    </div>
  )
}
