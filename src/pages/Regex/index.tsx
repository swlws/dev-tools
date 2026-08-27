import { useState, useMemo, useCallback, Fragment } from 'react'
import './index.css'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import Button from '@/components/Button'
import CopyButton from '@/components/CopyButton'

const TOOL = TOOLS.find((t) => t.path === '/regex')!

// Order matters for the checkbox row; sticky ('y') is intentionally offered too.
const FLAG_OPTIONS: { flag: string; label: string; hint: string }[] = [
  { flag: 'g', label: 'g', hint: '全局匹配' },
  { flag: 'i', label: 'i', hint: '忽略大小写' },
  { flag: 'm', label: 'm', hint: '多行' },
  { flag: 's', label: 's', hint: '. 匹配换行' },
  { flag: 'u', label: 'u', hint: 'Unicode' },
  { flag: 'y', label: 'y', hint: '粘性' },
]

interface GroupInfo {
  name: string | null
  index: number
  value: string | undefined
}

interface MatchInfo {
  match: string
  start: number
  end: number
  groups: GroupInfo[]
}

interface Segment {
  text: string
  matchIndex: number | null
}

interface RegexResult {
  matches: MatchInfo[]
  segments: Segment[]
  error: string
}

const SAMPLE_PATTERN = '(\\w+)@(\\w+)\\.(?<tld>\\w+)'
const SAMPLE_TEXT = '联系我们:alice@example.com 或 bob@test.org,谢谢!'

function computeRegex(
  pattern: string,
  flags: string,
  text: string,
): RegexResult {
  if (pattern === '') {
    return { matches: [], segments: [{ text, matchIndex: null }], error: '' }
  }

  let re: RegExp
  try {
    re = new RegExp(pattern, flags)
  } catch (e) {
    return {
      matches: [],
      segments: [{ text, matchIndex: null }],
      error: e instanceof Error ? e.message : '正则表达式无效',
    }
  }

  const matches: MatchInfo[] = []
  const segments: Segment[] = []
  const global = flags.includes('g') || flags.includes('y')

  let cursor = 0
  let guard = 0
  // Iterate manually so we can capture indices and avoid infinite loops on
  // zero-length matches (e.g. an empty alternative or a lookahead-only pattern).
  while (guard < 1_000_000) {
    guard++
    const m = re.exec(text)
    if (m === null) break

    const start = m.index
    const end = start + m[0].length

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), matchIndex: null })
    }
    const matchIndex = matches.length
    // Keep zero-length matches out of the highlighted output (nothing to show)
    // but still record them so the count reflects reality.
    if (end > start) {
      segments.push({ text: text.slice(start, end), matchIndex })
    }
    cursor = end

    const groups: GroupInfo[] = []
    for (let i = 1; i < m.length; i++) {
      groups.push({ name: null, index: i, value: m[i] })
    }
    if (m.groups) {
      for (const [name, value] of Object.entries(m.groups)) {
        groups.push({ name, index: -1, value })
      }
    }

    matches.push({ match: m[0], start, end, groups })

    if (!global) break
    // Advance past zero-length matches to prevent an infinite loop.
    if (m[0] === '') re.lastIndex++
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matchIndex: null })
  }

  return { matches, segments, error: '' }
}

function computeReplace(
  pattern: string,
  flags: string,
  text: string,
  replacement: string,
): { output: string; error: string } {
  if (pattern === '') return { output: text, error: '' }
  try {
    const re = new RegExp(pattern, flags)
    return { output: text.replace(re, replacement), error: '' }
  } catch (e) {
    return { output: '', error: e instanceof Error ? e.message : '正则表达式无效' }
  }
}

export default function RegexPage() {
  useSeo(TOOL.name, TOOL.description)

  const [pattern, setPattern] = useState(SAMPLE_PATTERN)
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState(SAMPLE_TEXT)
  const [replacement, setReplacement] = useState('$1#$<tld>')

  const result = useMemo(
    () => computeRegex(pattern, flags, text),
    [pattern, flags, text],
  )

  const replaced = useMemo(
    () => computeReplace(pattern, flags, text, replacement),
    [pattern, flags, text, replacement],
  )

  const toggleFlag = useCallback((flag: string) => {
    setFlags((prev) =>
      prev.includes(flag)
        ? prev.replace(flag, '')
        : // Preserve canonical flag order (g i m s u y).
          FLAG_OPTIONS.map((o) => o.flag)
            .filter((f) => (prev + flag).includes(f))
            .join(''),
    )
  }, [])

  const handleClear = useCallback(() => {
    setPattern('')
    setText('')
    setReplacement('')
  }, [])

  const hasError = result.error !== ''
  const isValid = pattern !== '' && !hasError

  return (
    <div className="page regex-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <Button onClick={handleClear}>清空</Button>
        </div>
      </header>

      <div className="regex-body">
        <section className="regex-config">
          <div className="regex-pattern-row">
            <span className="regex-slash">/</span>
            <input
              className="regex-input"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="输入正则表达式,例如 (\w+)@(\w+)"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <span className="regex-slash">/{flags}</span>
            {isValid && <span className="success-badge">有效</span>}
            {hasError && <span className="error-badge">语法错误</span>}
          </div>

          <div className="regex-flags">
            {FLAG_OPTIONS.map((opt) => (
              <label key={opt.flag} className="regex-flag" title={opt.hint}>
                <input
                  type="checkbox"
                  checked={flags.includes(opt.flag)}
                  onChange={() => toggleFlag(opt.flag)}
                />
                <code>{opt.label}</code>
                <span className="regex-flag-hint">{opt.hint}</span>
              </label>
            ))}
          </div>

          {hasError && <p className="regex-error-msg">{result.error}</p>}
        </section>

        <div className="regex-panes">
          <section className="regex-pane">
            <div className="pane-header">
              <span className="pane-label">测试文本</span>
              {isValid && (
                <span className="regex-count">
                  匹配 {result.matches.length} 处
                </span>
              )}
            </div>
            <textarea
              className="regex-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此输入用于测试的文本"
              spellCheck={false}
            />
            <div className="regex-highlight-wrap">
              <div className="pane-sublabel">高亮预览</div>
              <div className="regex-highlight">
                {text === '' ? (
                  <span className="regex-placeholder">匹配将在此高亮显示</span>
                ) : (
                  result.segments.map((seg, i) =>
                    seg.matchIndex === null ? (
                      <Fragment key={i}>{seg.text}</Fragment>
                    ) : (
                      <mark key={i} className="regex-mark">
                        {seg.text}
                      </mark>
                    ),
                  )
                )}
              </div>
            </div>
          </section>

          <section className="regex-pane">
            <div className="pane-header">
              <span className="pane-label">匹配与分组</span>
            </div>
            <div className="regex-matches">
              {!isValid && (
                <p className="error-hint">
                  {hasError ? '请修正正则表达式后再查看匹配结果' : '输入正则表达式以查看匹配'}
                </p>
              )}
              {isValid && result.matches.length === 0 && (
                <p className="error-hint">没有匹配项</p>
              )}
              {isValid &&
                result.matches.map((m, i) => (
                  <div key={i} className="regex-match-card">
                    <div className="regex-match-head">
                      <span className="regex-match-idx">#{i + 1}</span>
                      <code className="regex-match-value">{m.match || '(空匹配)'}</code>
                      <span className="regex-match-pos">
                        [{m.start}, {m.end})
                      </span>
                    </div>
                    {m.groups.length > 0 && (
                      <ul className="regex-group-list">
                        {m.groups.map((g, gi) => (
                          <li key={gi} className="regex-group">
                            <span className="regex-group-name">
                              {g.name !== null ? `<${g.name}>` : `$${g.index}`}
                            </span>
                            <code className="regex-group-value">
                              {g.value === undefined ? '(未匹配)' : g.value || '(空)'}
                            </code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          </section>

          <section className="regex-pane">
            <div className="pane-header">
              <span className="pane-label">替换预览</span>
              {replaced.error === '' && replaced.output !== '' && (
                <CopyButton text={replaced.output} />
              )}
            </div>
            <div className="regex-replace-body">
              <input
                className="regex-input regex-replace-input"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="替换字符串,支持 $1、$<name> 等"
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <div className="pane-sublabel">结果</div>
              <div className="regex-replace-output">
                {replaced.error !== '' ? (
                  <span className="regex-placeholder">正则无效,无法替换</span>
                ) : replaced.output === '' ? (
                  <span className="regex-placeholder">替换结果将在此显示</span>
                ) : (
                  replaced.output
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
