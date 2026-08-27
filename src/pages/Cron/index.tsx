import { useState, useMemo } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import Button from '@/components/Button'
import CopyButton from '@/components/CopyButton'
import { parseCron, describeCron, nextRuns } from '@/utils/cron'

const TOOL = TOOLS.find((t) => t.path === '/cron')!

interface Sample {
  expr: string
  label: string
}

const SAMPLES: Sample[] = [
  { expr: '*/5 * * * *', label: '每 5 分钟' },
  { expr: '30 9 * * *', label: '每天 09:30' },
  { expr: '0 8 * * 1', label: '每周一 08:00' },
  { expr: '0 0 1 * *', label: '每月 1 日 0 点' },
  { expr: '0 */2 * * *', label: '每 2 小时' },
  { expr: '*/30 * * * * *', label: '每 30 秒（6 段）' },
]

const RUN_COUNT = 5

export default function CronPage() {
  useSeo(TOOL.name, TOOL.description)
  const [input, setInput] = useState('*/5 * * * *')

  const parseResult = useMemo(() => parseCron(input), [input])

  const description = useMemo(
    () => (parseResult.ok && parseResult.parsed ? describeCron(parseResult.parsed) : ''),
    [parseResult],
  )

  const runs = useMemo(
    () => (parseResult.ok && parseResult.parsed ? nextRuns(parseResult.parsed, RUN_COUNT) : null),
    [parseResult],
  )

  const segCount = input.trim() === '' ? 0 : input.trim().split(/\s+/).length

  return (
    <div className="page cron-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          {description && <CopyButton text={description} />}
          <Button onClick={() => setInput('')}>清空</Button>
        </div>
      </header>

      <div className="cron-body">
        {/* 输入 */}
        <section className="cron-card">
          <div className="pane-header">
            <span className="pane-label">Cron 表达式</span>
            {input.trim() !== '' && !parseResult.ok && (
              <span className="error-badge">解析错误</span>
            )}
            {parseResult.ok && (
              <span className="success-badge">{segCount} 段 · 有效</span>
            )}
          </div>
          <div className="cron-card-body">
            <input
              className={`cron-input ${
                input.trim() !== '' && !parseResult.ok ? 'cron-input-error' : ''
              }`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="如：*/5 * * * *（分 时 日 月 周），或 6 段含秒"
              spellCheck={false}
              autoComplete="off"
            />
            {input.trim() !== '' && !parseResult.ok && (
              <p className="error-hint cron-error">{parseResult.error}</p>
            )}
            {input.trim() === '' && (
              <p className="error-hint">
                输入 5 段（分 时 日 月 周）或 6 段（秒 分 时 日 月 周）表达式，自动识别格式。
              </p>
            )}

            <div className="cron-samples">
              <span className="cron-samples-label">常用示例</span>
              <div className="cron-samples-list">
                {SAMPLES.map((s) => (
                  <button
                    key={s.expr}
                    type="button"
                    className="cron-sample"
                    onClick={() => setInput(s.expr)}
                    title={s.expr}
                  >
                    <code className="cron-sample-expr">{s.expr}</code>
                    <span className="cron-sample-label">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 可读描述 */}
        <section className="cron-card">
          <div className="pane-header">
            <span className="pane-label">可读描述</span>
          </div>
          <div className="cron-card-body">
            {description ? (
              <div className="cron-desc-row">
                <span className="cron-desc">{description}</span>
                <CopyButton text={description} />
              </div>
            ) : (
              <p className="error-hint">表达式有效后显示中文描述</p>
            )}
          </div>
        </section>

        {/* 未来执行时间 */}
        <section className="cron-card">
          <div className="pane-header">
            <span className="pane-label">未来 {RUN_COUNT} 次执行时间</span>
            {runs && runs.times.length > 0 && (
              <CopyButton text={runs.times.join('\n')} />
            )}
          </div>
          <div className="cron-card-body">
            {runs && runs.times.length > 0 ? (
              <ol className="cron-runs">
                {runs.times.map((t, i) => (
                  <li key={i} className="cron-run">
                    <span className="cron-run-index">{i + 1}</span>
                    <span className="cron-run-time">{t}</span>
                  </li>
                ))}
              </ol>
            ) : runs ? (
              <p className="error-hint cron-error">
                在未来约 5 年内未找到匹配的执行时间，请检查表达式（如「2 月 30 日」等不存在的组合）。
              </p>
            ) : (
              <p className="error-hint">表达式有效后预测执行时间（基于当前本地时间）</p>
            )}
            {runs && runs.reachedLimit && runs.times.length > 0 && (
              <p className="error-hint">仅找到 {runs.times.length} 次，已达扫描上限。</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
