import { useState, useMemo } from 'react'
import './index.css'
import { Link } from 'react-router-dom'
import { TOOLS, groupedTools, type Tool } from '@/tools'
import { useSeo } from '@/hooks/useSeo'
import { useToolUsage, recordToolUse } from '@/hooks/useToolUsage'
import Logo from '@/components/Logo'
import BusuanziStats from '@/components/BusuanziStats'

const TOP_COUNT = 4

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Link to={tool.path} className="tool-card" onClick={() => recordToolUse(tool.path)}>
      <span className="tool-card-head">
        <span className="tool-card-icon">{tool.icon}</span>
        <span className="tool-card-name">{tool.name}</span>
      </span>
      <span className="tool-card-desc">{tool.description}</span>
    </Link>
  )
}

export default function HomePage() {
  useSeo('首页', '开发者工具箱:Markdown 编辑器、JSON 可视化、文本对比、时间戳工具、二维码,免费在线使用。')

  const [query, setQuery] = useState('')
  const { counts } = useToolUsage()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return TOOLS
    return TOOLS.filter((t) =>
      [t.name, t.description, ...t.keywords].some((s) => s.toLowerCase().includes(q)),
    )
  }, [query])

  const groups = useMemo(() => groupedTools(filtered), [filtered])
  const searching = query.trim() !== ''

  // Top-N most-opened tools; empty until the user has opened something.
  const topTools = useMemo(() => {
    return TOOLS.filter((t) => (counts[t.path] ?? 0) > 0)
      .sort((a, b) => (counts[b.path] ?? 0) - (counts[a.path] ?? 0))
      .slice(0, TOP_COUNT)
  }, [counts])

  return (
    <div className="page home-page">
      <div className="home-body">
        <header className="home-hero">
          <Logo size={64} idSuffix="hero" className="home-logo" />
          <h1 className="home-title">开发者工具箱</h1>
          <p className="home-subtitle">常用的前端与开发辅助工具,免费、无需登录、本地运行。</p>
          <input
            className="home-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索工具，如 json、markdown、时间戳…"
            spellCheck={false}
          />
        </header>

        {filtered.length === 0 ? (
          <p className="home-empty">没有匹配「{query}」的工具</p>
        ) : searching ? (
          <div className="home-grid">
            {filtered.map((tool) => (
              <ToolCard key={tool.path} tool={tool} />
            ))}
          </div>
        ) : (
          <>
            {topTools.length > 0 && (
              <section className="home-section">
                <h2 className="home-section-title">高频使用</h2>
                <div className="home-grid">
                  {topTools.map((tool) => (
                    <ToolCard key={tool.path} tool={tool} />
                  ))}
                </div>
              </section>
            )}
            {groups.map((group) => (
              <section key={group.key} className="home-section">
                <h2 className="home-section-title">{group.label}</h2>
                <div className="home-grid">
                  {group.tools.map((tool) => (
                    <ToolCard key={tool.path} tool={tool} />
                  ))}
                </div>
              </section>
            ))}
            <BusuanziStats />
          </>
        )}
      </div>
    </div>
  )
}
