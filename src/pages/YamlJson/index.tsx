import { useState, useMemo, useCallback } from 'react'
import './index.css'
import * as yaml from 'js-yaml'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import CopyButton from '@/components/CopyButton'
import Button from '@/components/Button'
import ToggleGroup from '@/components/ToggleGroup'

const TOOL = TOOLS.find((t) => t.path === '/yaml')!

type Mode = 'y2j' | 'j2y'

const SAMPLE_YAML = `name: 开发者工具箱
version: 1.0.0
private: true
tags:
  - yaml
  - json
  - 转换
server:
  host: localhost
  port: 5173
  ssl: false
authors:
  - name: 张三
    email: zhangsan@example.com
  - name: 李四
    email: lisi@example.com
license: null`

function convert(input: string, mode: Mode): { output: string; error: string } {
  if (input.trim() === '') return { output: '', error: '' }
  try {
    if (mode === 'y2j') {
      const obj = yaml.load(input)
      return { output: JSON.stringify(obj, null, 2), error: '' }
    }
    const obj = JSON.parse(input)
    return { output: yaml.dump(obj, { indent: 2 }), error: '' }
  } catch (err) {
    if (err instanceof yaml.YAMLException) {
      return { output: '', error: `YAML 解析失败: ${err.message}` }
    }
    if (err instanceof Error) {
      const prefix = mode === 'y2j' ? 'YAML 解析失败' : 'JSON 解析失败'
      return { output: '', error: `${prefix}: ${err.message}` }
    }
    return { output: '', error: '转换失败' }
  }
}

export default function YamlJsonPage() {
  useSeo(TOOL.name, TOOL.description)
  const [mode, setMode] = useState<Mode>('y2j')
  const [input, setInput] = useState(SAMPLE_YAML)

  const { output, error } = useMemo(() => convert(input, mode), [input, mode])

  const handleSwap = useCallback(() => {
    if (output && !error) setInput(output)
    setMode((m) => (m === 'y2j' ? 'j2y' : 'y2j'))
  }, [output, error])

  const handleClear = useCallback(() => {
    setInput('')
  }, [])

  const inputLabel = mode === 'y2j' ? 'YAML' : 'JSON'
  const outputLabel = mode === 'y2j' ? 'JSON' : 'YAML'
  const inputPlaceholder =
    mode === 'y2j' ? '输入要转换的 YAML' : '输入要转换的 JSON'
  const outputPlaceholder =
    mode === 'y2j' ? '输入 YAML 后显示 JSON 结果' : '输入 JSON 后显示 YAML 结果'

  return (
    <div className="page yaml-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <ToggleGroup
            value={mode}
            onChange={setMode}
            options={[
              { value: 'y2j', label: 'YAML → JSON' },
              { value: 'j2y', label: 'JSON → YAML' },
            ]}
          />
          <Button onClick={handleSwap}>交换</Button>
          <Button onClick={handleClear}>清空</Button>
        </div>
      </header>

      <div className="yaml-body">
        <section className="yaml-pane">
          <div className="pane-header">
            <span className="pane-label">{inputLabel}</span>
          </div>
          <textarea
            className="yaml-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={inputPlaceholder}
            spellCheck={false}
          />
        </section>

        <section className="yaml-pane">
          <div className="pane-header">
            <span className="pane-label">{outputLabel}</span>
            {error && <span className="error-badge">转换失败</span>}
          </div>
          <div className="yaml-output">
            {output === '' ? (
              <p className="error-hint">{error || outputPlaceholder}</p>
            ) : (
              <>
                <textarea
                  className="yaml-textarea"
                  value={output}
                  readOnly
                  spellCheck={false}
                />
                <div className="yaml-output-actions">
                  <CopyButton text={output} />
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
