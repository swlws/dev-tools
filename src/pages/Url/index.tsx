import { useState, useMemo, useCallback } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import CopyButton from '@/components/CopyButton'
import Button from '@/components/Button'
import ToggleGroup from '@/components/ToggleGroup'
import { parseUrl, type UrlParts } from '@/utils/urlParse'

const TOOL = TOOLS.find((t) => t.path === '/url')!

type Mode = 'encode' | 'decode'

const SAMPLE_TEXT = 'https://example.com/搜索?q=开发者工具箱&lang=zh CN'

function QueryTree({ value }: { value: unknown }) {
  if (value && typeof value === 'object') {
    const entries = Array.isArray(value)
      ? value.map((v, i) => [String(i), v] as const)
      : Object.entries(value)
    return (
      <div className="url-tree">
        {entries.map(([k, v]) => (
          <div key={k} className="url-tree-row">
            <span className="url-tree-key">{k}</span>
            {v && typeof v === 'object' ? (
              <QueryTree value={v} />
            ) : (
              <span className="url-tree-value">
                {String(v)}
                <CopyButton text={String(v)} />
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }
  return (
    <span className="url-tree-value">
      {String(value)}
      <CopyButton text={String(value)} />
    </span>
  )
}

function StructureRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="url-struct-row">
      <span className="url-struct-label">{label}</span>
      <span className="url-struct-value">
        {value}
        <CopyButton text={value} />
      </span>
    </div>
  )
}

function UrlStructure({ parts }: { parts: UrlParts }) {
  return (
    <div className="url-struct">
      <StructureRow label="Protocol" value={parts.protocol} />
      <StructureRow label="Host" value={parts.host} />
      <StructureRow label="Port" value={parts.port} />
      <StructureRow label="Path" value={parts.path} />
      <StructureRow label="Hash" value={parts.hash} />
      {parts.hasQuery && (
        <div className="url-struct-row url-struct-query">
          <span className="url-struct-label">Query</span>
          <QueryTree value={parts.query} />
        </div>
      )}
    </div>
  )
}

export default function UrlPage() {
  useSeo(TOOL.name, TOOL.description)
  const [mode, setMode] = useState<Mode>('decode')
  const [input, setInput] = useState(SAMPLE_TEXT)

  const { output, error } = useMemo(() => {
    if (input === '') return { output: '', error: '' }
    try {
      return {
        output: mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input),
        error: '',
      }
    } catch {
      return { output: '', error: mode === 'encode' ? '编码失败' : '不是有效的 URL 编码' }
    }
  }, [input, mode])

  // 仅解码模式解析结构，且要求输入本身是合法的绝对 URL。
  const structure = useMemo(
    () => (mode === 'decode' ? parseUrl(input) : null),
    [mode, input],
  )

  const handleSwap = useCallback(() => {
    if (output && !error) setInput(output)
    setMode((m) => (m === 'encode' ? 'decode' : 'encode'))
  }, [output, error])

  const handleClear = useCallback(() => {
    setInput('')
  }, [])

  const placeholder =
    mode === 'encode' ? '输入文本后显示编码结果' : '输入 URL 编码后显示原文'

  const inputPane = (
    <section className="url-pane">
      <div className="pane-header">
        <span className="pane-label">{mode === 'encode' ? '原文' : 'URL 编码'}</span>
      </div>
      <textarea
        className="url-textarea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === 'encode' ? '输入要编码的文本' : '输入要解码的 URL 编码'}
        spellCheck={false}
      />
    </section>
  )

  const outputPane = (
    <section className="url-pane">
      <div className="pane-header">
        <span className="pane-label">结果</span>
        {error && <span className="error-badge">{error}</span>}
      </div>
      <div className="url-output">
        {output === '' ? (
          <p className="error-hint">{error ? '' : placeholder}</p>
        ) : (
          <>
            <textarea className="url-textarea" value={output} readOnly spellCheck={false} />
            <div className="url-output-actions">
              <CopyButton text={output} />
            </div>
          </>
        )}
      </div>
    </section>
  )

  return (
    <div className="page url-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <ToggleGroup
            value={mode}
            onChange={setMode}
            options={[
              { value: 'encode', label: '编码' },
              { value: 'decode', label: '解码' },
            ]}
          />
          <Button onClick={handleSwap}>交换</Button>
          <Button onClick={handleClear}>清空</Button>
        </div>
      </header>

      {structure ? (
        <div className="url-body">
          <div className="url-col">
            {inputPane}
            {outputPane}
          </div>
          <section className="url-pane">
            <div className="pane-header">
              <span className="pane-label">URL 结构</span>
            </div>
            <UrlStructure parts={structure} />
          </section>
        </div>
      ) : (
        <div className="url-body">
          {inputPane}
          {outputPane}
        </div>
      )}
    </div>
  )
}
