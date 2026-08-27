import { useState, useMemo, useCallback } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import CopyButton from '@/components/CopyButton'
import Button from '@/components/Button'
import ToggleGroup from '@/components/ToggleGroup'

const TOOL = TOOLS.find((t) => t.path === '/base64')!

type Mode = 'encode' | 'decode'

const SAMPLE_TEXT = '你好，开发者工具箱！Hello 🚀'

// UTF-8 safe encode: text -> bytes -> base64 (btoa alone breaks on non-Latin1).
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}

// UTF-8 safe decode: base64 -> bytes -> text. Throws on malformed input.
function decodeBase64(input: string): string {
  const binary = atob(input.trim())
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

export default function Base64Page() {
  useSeo(TOOL.name, TOOL.description)
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState(SAMPLE_TEXT)
  // File-derived base64 output; takes precedence over text input when set.
  const [fileBase64, setFileBase64] = useState('')

  const switchMode = useCallback((next: Mode) => {
    setMode(next)
    setFileBase64('')
  }, [])

  const handleInput = useCallback((value: string) => {
    setInput(value)
    setFileBase64('')
  }, [])

  const { output, error } = useMemo(() => {
    if (input === '') return { output: '', error: '' }
    try {
      return {
        output: mode === 'encode' ? encodeBase64(input) : decodeBase64(input),
        error: '',
      }
    } catch {
      return { output: '', error: mode === 'encode' ? '编码失败' : '不是有效的 Base64' }
    }
  }, [input, mode])

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      const comma = result.indexOf(',')
      setInput('')
      setFileBase64(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleSwap = useCallback(() => {
    if (output && !error) setInput(output)
    setMode((m) => (m === 'encode' ? 'decode' : 'encode'))
    setFileBase64('')
  }, [output, error])

  const handleClear = useCallback(() => {
    setInput('')
    setFileBase64('')
  }, [])

  const shownOutput = fileBase64 || output
  const placeholder =
    mode === 'encode' ? '输入文本或选择文件后显示 Base64' : '输入 Base64 后显示原文'

  return (
    <div className="page base64-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <ToggleGroup
            value={mode}
            onChange={switchMode}
            options={[
              { value: 'encode', label: '编码' },
              { value: 'decode', label: '解码' },
            ]}
          />
          <Button onClick={handleSwap}>交换</Button>
          <Button onClick={handleClear}>清空</Button>
        </div>
      </header>

      <div className="base64-body">
        <section className="base64-pane">
          <div className="pane-header">
            <span className="pane-label">{mode === 'encode' ? '原文' : 'Base64'}</span>
            {mode === 'encode' && (
              <label className="base64-file-label">
                选择文件
                <input
                  type="file"
                  className="base64-file-input"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
          <textarea
            className="base64-textarea"
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本' : '输入要解码的 Base64'}
            spellCheck={false}
          />
        </section>

        <section className="base64-pane">
          <div className="pane-header">
            <span className="pane-label">结果</span>
            {error && <span className="error-badge">{error}</span>}
          </div>
          <div className="base64-output">
            {shownOutput === '' ? (
              <p className="error-hint">{error ? '' : placeholder}</p>
            ) : (
              <>
                <textarea
                  className="base64-textarea"
                  value={shownOutput}
                  readOnly
                  spellCheck={false}
                />
                <div className="base64-output-actions">
                  <CopyButton text={shownOutput} />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
