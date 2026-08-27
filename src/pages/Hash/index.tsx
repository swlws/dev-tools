import { useState, useEffect } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import CopyButton from '@/components/CopyButton'
import Button from '@/components/Button'

const TOOL = TOOLS.find((t) => t.path === '/hash')!

type Algo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

const ALGOS: Algo[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

// Digest `text` with the given algorithm, returning a lowercase hex string.
async function sha(algo: Algo, text: string): Promise<string> {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

type Results = Record<Algo, string>

export default function HashPage() {
  useSeo(TOOL.name, TOOL.description)
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (input === '') {
      setResults(null)
      setError('')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const hashes = await Promise.all(ALGOS.map((algo) => sha(algo, input)))
        if (cancelled) return
        const next = {} as Results
        ALGOS.forEach((algo, i) => {
          next[algo] = hashes[i]
        })
        setResults(next)
        setError('')
      } catch {
        if (cancelled) return
        setResults(null)
        setError('哈希计算失败')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [input])

  const handleClear = () => setInput('')

  return (
    <div className="page hash-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <Button onClick={handleClear}>清空</Button>
        </div>
      </header>

      <div className="hash-body">
        <section className="hash-pane">
          <div className="pane-header">
            <span className="pane-label">原文</span>
            {error && <span className="error-badge">{error}</span>}
          </div>
          <textarea
            className="hash-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要计算哈希的文本"
            spellCheck={false}
          />
        </section>

        <section className="hash-pane">
          <div className="pane-header">
            <span className="pane-label">哈希结果</span>
          </div>
          {results ? (
            <div className="hash-results">
              {ALGOS.map((algo) => (
                <div className="hash-field" key={algo}>
                  <span className="hash-algo">{algo}</span>
                  <div className="hash-field-row">
                    <span className="hash-value">{results[algo]}</span>
                    <CopyButton text={results[algo]} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="error-hint">输入文本后显示 SHA-1 / SHA-256 / SHA-384 / SHA-512 结果</p>
          )}
        </section>
      </div>
    </div>
  )
}
