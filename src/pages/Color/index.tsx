import { useState, useMemo, useCallback } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import CopyButton from '@/components/CopyButton'

const TOOL = TOOLS.find((t) => t.path === '/color')!

interface RGB {
  r: number
  g: number
  b: number
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

// #rgb / #rrggbb (with or without leading #) -> RGB. Returns null on invalid input.
function hexToRgb(input: string): RGB | null {
  let hex = input.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: RGB): string {
  const to2 = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`
}

// Parses `rgb(255, 0, 128)` or bare `255,0,128`. Returns null on invalid input.
function parseRgb(input: string): RGB | null {
  const body = input.trim().replace(/^rgba?\((.*)\)$/i, '$1')
  const parts = body.split(',').map((p) => p.trim())
  if (parts.length < 3) return null
  const nums = parts.slice(0, 3).map((p) => {
    if (!/^\d+$/.test(p)) return NaN
    return Number(p)
  })
  if (nums.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null
  return { r: nums[0], g: nums[1], b: nums[2] }
}

// Standard RGB -> HSL. h ∈ [0,360), s/l ∈ [0,100].
function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6
        break
      case gn:
        h = (bn - rn) / delta + 2
        break
      default:
        h = (rn - gn) / delta + 4
        break
    }
    h *= 60
    if (h < 0) h += 360
  }
  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

// Standard HSL -> RGB. h ∈ [0,360), s/l as percentages 0-100.
function hslToRgb(h: number, s: number, l: number): RGB {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0
  let g1 = 0
  let b1 = 0
  if (hp >= 0 && hp < 1) [r1, g1, b1] = [c, x, 0]
  else if (hp < 2) [r1, g1, b1] = [x, c, 0]
  else if (hp < 3) [r1, g1, b1] = [0, c, x]
  else if (hp < 4) [r1, g1, b1] = [0, x, c]
  else if (hp < 5) [r1, g1, b1] = [x, 0, c]
  else [r1, g1, b1] = [c, 0, x]
  const m = ln - c / 2
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

// Parses `hsl(320, 100%, 50%)` or bare `320,100%,50%`. Returns null on invalid input.
function parseHsl(input: string): RGB | null {
  const body = input.trim().replace(/^hsla?\((.*)\)$/i, '$1')
  const parts = body.split(',').map((p) => p.trim())
  if (parts.length < 3) return null
  const h = Number(parts[0].replace(/°$/, ''))
  const s = Number(parts[1].replace(/%$/, ''))
  const l = Number(parts[2].replace(/%$/, ''))
  if (![h, s, l].every((n) => Number.isFinite(n))) return null
  if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) return null
  return hslToRgb(h, s, l)
}

export default function ColorPage() {
  useSeo(TOOL.name, TOOL.description)

  // Canonical internal representation.
  const [rgb, setRgb] = useState<RGB>({ r: 51, g: 102, b: 204 })

  // Raw text of each input field; empty string means "mirror the canonical value".
  const [hexText, setHexText] = useState('')
  const [rgbText, setRgbText] = useState('')
  const [hslText, setHslText] = useState('')

  // Derived canonical strings from the current color.
  const hexValue = useMemo(() => rgbToHex(rgb), [rgb])
  const rgbValue = useMemo(() => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, [rgb])
  const hslValue = useMemo(() => {
    const { h, s, l } = rgbToHsl(rgb)
    return `hsl(${h}, ${s}%, ${l}%)`
  }, [rgb])

  const handleHex = useCallback((value: string) => {
    setHexText(value)
    const parsed = hexToRgb(value)
    if (parsed) {
      setRgb(parsed)
      setRgbText('')
      setHslText('')
    }
  }, [])

  const handleRgb = useCallback((value: string) => {
    setRgbText(value)
    const parsed = parseRgb(value)
    if (parsed) {
      setRgb(parsed)
      setHexText('')
      setHslText('')
    }
  }, [])

  const handleHsl = useCallback((value: string) => {
    setHslText(value)
    const parsed = parseHsl(value)
    if (parsed) {
      setRgb(parsed)
      setHexText('')
      setRgbText('')
    }
  }, [])

  const handlePicker = useCallback((value: string) => {
    const parsed = hexToRgb(value)
    if (parsed) {
      setRgb(parsed)
      // Reset raw text so every field mirrors the picked color.
      setHexText('')
      setRgbText('')
      setHslText('')
    }
  }, [])

  const hexError = hexText.trim() !== '' && hexToRgb(hexText) === null
  const rgbError = rgbText.trim() !== '' && parseRgb(rgbText) === null
  const hslError = hslText.trim() !== '' && parseHsl(hslText) === null

  // Field shows the user's raw text while typing, otherwise the canonical value.
  const hexShown = hexText.trim() === '' ? hexValue : hexText
  const rgbShown = rgbText.trim() === '' ? rgbValue : rgbText
  const hslShown = hslText.trim() === '' ? hslValue : hslText

  return (
    <div className="page color-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <label className="color-picker-label">
            颜色选择器
            <input
              type="color"
              className="color-picker"
              value={hexValue}
              onChange={(e) => handlePicker(e.target.value)}
            />
          </label>
        </div>
      </header>

      <div className="color-body">
        <div
          className="color-preview"
          style={{ backgroundColor: hexValue }}
          aria-label="当前颜色预览"
        >
          <span className="color-swatch-label">{hexValue}</span>
        </div>

        <div className="color-fields">
          <div className="color-field">
            <div className="pane-header">
              <span className="pane-label">HEX</span>
              {hexError && <span className="error-badge">无效 HEX</span>}
            </div>
            <div className="color-field-row">
              <input
                className="color-input"
                value={hexShown}
                onChange={(e) => handleHex(e.target.value)}
                placeholder="#3366cc"
                spellCheck={false}
              />
              <CopyButton text={hexValue} />
            </div>
            {hexError && <p className="error-hint">支持 #rgb 或 #rrggbb</p>}
          </div>

          <div className="color-field">
            <div className="pane-header">
              <span className="pane-label">RGB</span>
              {rgbError && <span className="error-badge">无效 RGB</span>}
            </div>
            <div className="color-field-row">
              <input
                className="color-input"
                value={rgbShown}
                onChange={(e) => handleRgb(e.target.value)}
                placeholder="rgb(51, 102, 204)"
                spellCheck={false}
              />
              <CopyButton text={rgbValue} />
            </div>
            {rgbError && (
              <p className="error-hint">形如 rgb(255, 0, 128) 或 255,0,128，各分量 0-255</p>
            )}
          </div>

          <div className="color-field">
            <div className="pane-header">
              <span className="pane-label">HSL</span>
              {hslError && <span className="error-badge">无效 HSL</span>}
            </div>
            <div className="color-field-row">
              <input
                className="color-input"
                value={hslShown}
                onChange={(e) => handleHsl(e.target.value)}
                placeholder="hsl(320, 100%, 50%)"
                spellCheck={false}
              />
              <CopyButton text={hslValue} />
            </div>
            {hslError && (
              <p className="error-hint">形如 hsl(320, 100%, 50%) 或 320,100%,50%</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
