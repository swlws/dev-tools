import { useState, useMemo, useCallback } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import CopyButton from '@/components/CopyButton'
import Button from '@/components/Button'

const TOOL = TOOLS.find((t) => t.path === '/radix')!

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

// Map a single character to its digit value, or -1 if not a valid digit.
function digitValue(ch: string): number {
  const idx = DIGITS.indexOf(ch.toLowerCase())
  return idx
}

// Parse a string in the given base (2-36) into a BigInt.
// Returns null when the input is empty or contains an out-of-range character.
// Supports an optional leading '-'. Case-insensitive.
function parseBigIntRadix(raw: string, base: number): bigint | null {
  let s = raw.trim()
  if (s === '') return null
  let negative = false
  if (s[0] === '+' || s[0] === '-') {
    negative = s[0] === '-'
    s = s.slice(1)
  }
  if (s === '') return null
  const b = BigInt(base)
  let value = 0n
  for (const ch of s) {
    const d = digitValue(ch)
    if (d < 0 || d >= base) return null
    value = value * b + BigInt(d)
  }
  return negative ? -value : value
}

// Render a BigInt into the given base (2-36) as a string.
function bigIntToRadix(value: bigint, base: number): string {
  if (value === 0n) return '0'
  const negative = value < 0n
  let v = negative ? -value : value
  const b = BigInt(base)
  let out = ''
  while (v > 0n) {
    const rem = Number(v % b)
    out = DIGITS[rem] + out
    v = v / b
  }
  return negative ? '-' + out : out
}

// The four common bases shown in the live-linked section.
const COMMON: { base: number; label: string; placeholder: string }[] = [
  { base: 2, label: '二进制 (BIN)', placeholder: '0 和 1' },
  { base: 8, label: '八进制 (OCT)', placeholder: '0-7' },
  { base: 10, label: '十进制 (DEC)', placeholder: '0-9' },
  { base: 16, label: '十六进制 (HEX)', placeholder: '0-9 a-f' },
]

const BASE_OPTIONS = Array.from({ length: 35 }, (_, i) => i + 2) // 2..36

export default function RadixPage() {
  useSeo(TOOL.name, TOOL.description)

  // The single source of truth for the common-base section: a parsed BigInt
  // plus which base the user last typed in (so we don't reformat their input).
  const [common, setCommon] = useState('')
  const [commonBase, setCommonBase] = useState(10)

  const commonValue = useMemo(
    () => parseBigIntRadix(common, commonBase),
    [common, commonBase],
  )
  const commonError = common.trim() !== '' && commonValue === null

  const handleCommonChange = useCallback((base: number, text: string) => {
    setCommonBase(base)
    setCommon(text)
  }, [])

  const handleClear = useCallback(() => {
    setCommon('')
    setCommonBase(10)
    setCustomInput('')
  }, [])

  // Compute the display value for a given base in the common section.
  const commonDisplay = useCallback(
    (base: number): string => {
      if (base === commonBase) return common
      if (commonValue === null) return ''
      const out = bigIntToRadix(commonValue, base)
      return base === 16 ? out.toUpperCase() : out
    },
    [common, commonBase, commonValue],
  )

  // Custom any-base (2-36) conversion.
  const [customInput, setCustomInput] = useState('')
  const [fromBase, setFromBase] = useState(10)
  const [toBase, setToBase] = useState(2)

  const { customOutput, customError } = useMemo(() => {
    if (customInput.trim() === '') return { customOutput: '', customError: false }
    const v = parseBigIntRadix(customInput, fromBase)
    if (v === null) return { customOutput: '', customError: true }
    return { customOutput: bigIntToRadix(v, toBase).toUpperCase(), customError: false }
  }, [customInput, fromBase, toBase])

  const handleSwapBases = useCallback(() => {
    setFromBase(toBase)
    setToBase(fromBase)
    if (customOutput && !customError) setCustomInput(customOutput)
  }, [fromBase, toBase, customOutput, customError])

  return (
    <div className="page radix-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <Button onClick={handleClear}>清空</Button>
        </div>
      </header>

      <div className="radix-body">
        {/* Common bases — live-linked */}
        <section className="radix-card">
          <div className="pane-header">
            <span className="pane-label">常用进制互转</span>
            {commonError && <span className="error-badge">含非法字符</span>}
          </div>
          <div className="radix-card-body">
            <div className="radix-grid">
              {COMMON.map(({ base, label, placeholder }) => {
                const value = commonDisplay(base)
                const active = base === commonBase
                const invalid = active && commonError
                return (
                  <div className="radix-field" key={base}>
                    <span className="radix-field-label">{label}</span>
                    <div className="radix-field-row">
                      <input
                        className={`radix-input ${invalid ? 'radix-input-error' : ''}`.trim()}
                        value={value}
                        onChange={(e) => handleCommonChange(base, e.target.value)}
                        placeholder={placeholder}
                        spellCheck={false}
                        autoComplete="off"
                      />
                      <CopyButton text={value} disabled={value === ''} />
                    </div>
                  </div>
                )
              })}
            </div>
            {commonError ? (
              <p className="error-hint">
                当前输入含有超出{commonBase}进制字符集的字符,请检查后重新输入。
              </p>
            ) : (
              <p className="error-hint">
                在任意输入框输入,其余进制会实时同步换算(支持大整数与负数)。
              </p>
            )}
          </div>
        </section>

        {/* Custom any-base 2-36 */}
        <section className="radix-card">
          <div className="pane-header">
            <span className="pane-label">自定义进制 (2-36)</span>
            {customError && <span className="error-badge">含非法字符</span>}
          </div>
          <div className="radix-card-body">
            <div className="radix-custom">
              <label className="radix-field">
                <span className="radix-field-label">源进制</span>
                <select
                  className="radix-select"
                  value={fromBase}
                  onChange={(e) => setFromBase(Number(e.target.value))}
                >
                  {BASE_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b} 进制
                    </option>
                  ))}
                </select>
              </label>

              <Button className="radix-swap" onClick={handleSwapBases}>
                ⇄
              </Button>

              <label className="radix-field">
                <span className="radix-field-label">目标进制</span>
                <select
                  className="radix-select"
                  value={toBase}
                  onChange={(e) => setToBase(Number(e.target.value))}
                >
                  {BASE_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b} 进制
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="radix-field">
              <span className="radix-field-label">输入值（{fromBase} 进制）</span>
              <input
                className={`radix-input ${customError ? 'radix-input-error' : ''}`.trim()}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={`输入 ${fromBase} 进制数值`}
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            {customError ? (
              <p className="error-hint">
                输入含有超出{fromBase}进制字符集的字符,请检查后重新输入。
              </p>
            ) : customOutput !== '' ? (
              <div className="radix-field">
                <span className="radix-field-label">结果（{toBase} 进制）</span>
                <div className="radix-field-row">
                  <span className="radix-result">{customOutput}</span>
                  <CopyButton text={customOutput} />
                </div>
              </div>
            ) : (
              <p className="error-hint">选择源/目标进制并输入数值后显示转换结果。</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
