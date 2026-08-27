import { useState, useEffect, useMemo } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import CopyButton from '@/components/CopyButton'
import ToggleGroup from '@/components/ToggleGroup'

const TOOL = TOOLS.find((t) => t.path === '/timestamp')!

type Zone = 'local' | 'utc'

const LOCAL_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

function formatDate(ms: number, zone: Zone): string {
  if (!Number.isFinite(ms)) return ''
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return ''
  if (zone === 'utc') {
    return (
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
      `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}`
    )
  }
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
  )
}

// Parse a Unix timestamp string, auto-detecting seconds (10 digits) vs milliseconds (13 digits).
function parseTimestamp(input: string): number | null {
  const trimmed = input.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const num = Number(trimmed)
  if (!Number.isFinite(num)) return null
  // <= 11 digits treated as seconds, otherwise milliseconds
  return trimmed.length <= 11 ? num * 1000 : num
}

// Interpret a `datetime-local` value (YYYY-MM-DDTHH:mm[:ss]) in the chosen zone → epoch ms.
function parseDateInput(input: string, zone: Zone): number | null {
  const m = input.trim().match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/,
  )
  if (!m) return null
  const [, y, mo, da, h, mi, s] = m
  const parts = [+y, +mo - 1, +da, +h, +mi, s ? +s : 0] as const
  const ms =
    zone === 'utc'
      ? Date.UTC(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5])
      : new Date(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]).getTime()
  return Number.isNaN(ms) ? null : ms
}

export default function TimestampPage() {
  useSeo(TOOL.name, TOOL.description)
  const [zone, setZone] = useState<Zone>('local')
  const [now, setNow] = useState(() => 0)

  useEffect(() => {
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [])

  // Timestamp -> Date
  const [tsInput, setTsInput] = useState('')
  const tsMs = useMemo(() => parseTimestamp(tsInput), [tsInput])
  const tsDate = useMemo(
    () => (tsMs === null ? '' : formatDate(tsMs, zone)),
    [tsMs, zone],
  )

  // Date -> Timestamp
  const [dateInput, setDateInput] = useState('')
  const dateMs = useMemo(() => parseDateInput(dateInput, zone), [dateInput, zone])

  // Diff
  const [diffStart, setDiffStart] = useState('')
  const [diffEnd, setDiffEnd] = useState('')
  const diff = useMemo(() => {
    const a = parseDateInput(diffStart, zone)
    const b = parseDateInput(diffEnd, zone)
    if (a === null || b === null) return null
    const totalMs = Math.abs(b - a)
    const totalSec = Math.floor(totalMs / 1000)
    const days = Math.floor(totalSec / 86400)
    const hours = Math.floor((totalSec % 86400) / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    return { days, hours, minutes, seconds, totalSec }
  }, [diffStart, diffEnd, zone])

  const nowSec = Math.floor(now / 1000)
  const zoneLabel = zone === 'utc' ? 'UTC' : `本地 (${LOCAL_ZONE})`

  return (
    <div className="page ts-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <span className="ts-zone-label">时区</span>
          <ToggleGroup
            value={zone}
            onChange={setZone}
            options={[
              { value: 'local', label: '本地' },
              { value: 'utc', label: 'UTC' },
            ]}
          />
        </div>
      </header>

      <div className="ts-body">
        {/* Current time */}
        <section className="ts-card">
          <div className="pane-header">
            <span className="pane-label">当前时间</span>
            <span className="ts-zone-badge">{zoneLabel}</span>
          </div>
          <div className="ts-card-body">
            <div className="ts-now-grid">
              <div className="ts-field">
                <span className="ts-field-label">秒级时间戳</span>
                <div className="ts-field-row">
                  <span className="ts-value ts-value-lg">{nowSec}</span>
                  <CopyButton text={String(nowSec)} />
                </div>
              </div>
              <div className="ts-field">
                <span className="ts-field-label">毫秒级时间戳</span>
                <div className="ts-field-row">
                  <span className="ts-value ts-value-lg">{now}</span>
                  <CopyButton text={String(now)} />
                </div>
              </div>
              <div className="ts-field ts-field-wide">
                <span className="ts-field-label">格式化日期</span>
                <div className="ts-field-row">
                  <span className="ts-value">{formatDate(now, zone)}</span>
                  <CopyButton text={formatDate(now, zone)} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="ts-row">
          {/* Timestamp -> Date */}
          <section className="ts-card">
            <div className="pane-header">
              <span className="pane-label">时间戳 → 日期</span>
              {tsInput.trim() !== '' && tsMs === null && (
                <span className="error-badge">无效时间戳</span>
              )}
            </div>
            <div className="ts-card-body">
              <input
                className="ts-input"
                value={tsInput}
                onChange={(e) => setTsInput(e.target.value)}
                placeholder="输入 Unix 时间戳（10 位=秒，13 位=毫秒）"
                spellCheck={false}
              />
              {tsDate ? (
                <div className="ts-field">
                  <span className="ts-field-label">日期</span>
                  <div className="ts-field-row">
                    <span className="ts-value">{tsDate}</span>
                    <CopyButton text={tsDate} />
                  </div>
                </div>
              ) : (
                <p className="error-hint">输入时间戳后显示对应日期</p>
              )}
            </div>
          </section>

          {/* Date -> Timestamp */}
          <section className="ts-card">
            <div className="pane-header">
              <span className="pane-label">日期 → 时间戳</span>
            </div>
            <div className="ts-card-body">
              <input
                className="ts-input"
                type="datetime-local"
                step="1"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              />
              {dateMs !== null ? (
                <>
                  <div className="ts-field">
                    <span className="ts-field-label">秒级</span>
                    <div className="ts-field-row">
                      <span className="ts-value">{Math.floor(dateMs / 1000)}</span>
                      <CopyButton text={String(Math.floor(dateMs / 1000))} />
                    </div>
                  </div>
                  <div className="ts-field">
                    <span className="ts-field-label">毫秒级</span>
                    <div className="ts-field-row">
                      <span className="ts-value">{dateMs}</span>
                      <CopyButton text={String(dateMs)} />
                    </div>
                  </div>
                </>
              ) : (
                <p className="error-hint">选择日期后显示对应时间戳</p>
              )}
            </div>
          </section>
        </div>

        {/* Diff */}
        <section className="ts-card">
          <div className="pane-header">
            <span className="pane-label">时间差计算</span>
          </div>
          <div className="ts-card-body">
            <div className="ts-diff-inputs">
              <label className="ts-field">
                <span className="ts-field-label">起始时间</span>
                <input
                  className="ts-input"
                  type="datetime-local"
                  step="1"
                  value={diffStart}
                  onChange={(e) => setDiffStart(e.target.value)}
                />
              </label>
              <label className="ts-field">
                <span className="ts-field-label">结束时间</span>
                <input
                  className="ts-input"
                  type="datetime-local"
                  step="1"
                  value={diffEnd}
                  onChange={(e) => setDiffEnd(e.target.value)}
                />
              </label>
            </div>
            {diff ? (
              <div className="ts-diff-result">
                <span className="ts-value ts-value-lg">
                  {diff.days} 天 {diff.hours} 时 {diff.minutes} 分 {diff.seconds} 秒
                </span>
                <span className="ts-diff-total">共 {diff.totalSec} 秒</span>
              </div>
            ) : (
              <p className="error-hint">选择起止时间后显示差值</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
