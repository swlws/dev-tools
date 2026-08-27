import { useState, useCallback, useEffect } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import CopyButton from '@/components/CopyButton'
import Button from '@/components/Button'
import Toggle from '@/components/Toggle'

const TOOL = TOOLS.find((t) => t.path === '/uuid')!

const DEFAULT_COUNT = 5
const MIN_COUNT = 1
const MAX_COUNT = 100

// Apply display options (uppercase / strip hyphens) to a raw UUID.
function formatUuid(uuid: string, upper: boolean, noDash: boolean): string {
  let value = uuid
  if (noDash) value = value.replace(/-/g, '')
  if (upper) value = value.toUpperCase()
  return value
}

export default function UuidPage() {
  useSeo(TOOL.name, TOOL.description)
  const [count, setCount] = useState(DEFAULT_COUNT)
  const [upper, setUpper] = useState(false)
  const [noDash, setNoDash] = useState(false)
  // Store raw UUIDs; display/copy values are derived on the fly so toggling
  // options never requires regenerating.
  const [rawUuids, setRawUuids] = useState<string[]>([])

  const generate = useCallback((n: number) => {
    const clamped = Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.floor(n) || MIN_COUNT))
    const next: string[] = []
    for (let i = 0; i < clamped; i++) next.push(crypto.randomUUID())
    setRawUuids(next)
  }, [])

  // Generate the default batch on first mount.
  useEffect(() => {
    generate(DEFAULT_COUNT)
  }, [generate])

  const handleCountChange = useCallback((value: string) => {
    if (value === '') {
      setCount(MIN_COUNT)
      return
    }
    const num = Number(value)
    if (!Number.isFinite(num)) return
    setCount(Math.min(MAX_COUNT, Math.max(MIN_COUNT, Math.floor(num))))
  }, [])

  const shown = rawUuids.map((u) => formatUuid(u, upper, noDash))
  const allText = shown.join('\n')

  return (
    <div className="page uuid-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <input
            className="uuid-count-input"
            type="number"
            min={MIN_COUNT}
            max={MAX_COUNT}
            value={count}
            onChange={(e) => handleCountChange(e.target.value)}
          />
          <Toggle pressed={upper} label="大写" onToggle={setUpper} />
          <Toggle pressed={noDash} label="去连字符" onToggle={setNoDash} />
          <CopyButton text={allText} disabled={shown.length === 0} />
          <Button onClick={() => generate(count)}>重新生成</Button>
          <Button variant="primary" onClick={() => generate(count)}>
            生成
          </Button>
        </div>
      </header>

      <div className="uuid-body">
        {shown.length === 0 ? (
          <p className="error-hint">点击「生成」产出 UUID 列表</p>
        ) : (
          <ul className="uuid-list">
            {shown.map((value, i) => (
              <li className="uuid-item" key={rawUuids[i]}>
                <span className="uuid-value">{value}</span>
                <CopyButton text={value} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
