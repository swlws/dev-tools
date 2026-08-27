import { useState, useCallback } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import HomePage from '@/pages/Home'
import EditorPage from '@/pages/Editor'
import JsonToolPage from '@/pages/JsonTool'
import TextDiffPage from '@/pages/TextDiff'
import TimestampPage from '@/pages/Timestamp'
import QrCodePage from '@/pages/QrCode'
import Base64Page from '@/pages/Base64'
import UrlPage from '@/pages/Url'
import JwtPage from '@/pages/Jwt'
import HashPage from '@/pages/Hash'
import UuidPage from '@/pages/Uuid'
import ColorPage from '@/pages/Color'
import RegexPage from '@/pages/Regex'
import RadixPage from '@/pages/Radix'
import CronPage from '@/pages/Cron'
import YamlJsonPage from '@/pages/YamlJson'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import { groupedTools } from '@/tools'
import { recordToolUse } from '@/hooks/useToolUsage'

const GROUPS = groupedTools()

function App() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  // Category whose dropdown is force-collapsed after a selection, until the
  // pointer leaves it (otherwise CSS :hover keeps re-opening the menu).
  const [collapsed, setCollapsed] = useState<string | null>(null)

  const activeCategory = GROUPS.find((g) =>
    g.tools.some((t) => t.path === location.pathname),
  )?.key

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <>
      <nav className="nav-bar">
        <NavLink to="/" className="nav-brand" onClick={closeMobile}>
          <Logo size={22} idSuffix="nav" />
          开发者工具箱
        </NavLink>

        <div className="nav-groups">
          {GROUPS.map((group) => (
            <div
              key={group.key}
              className={`nav-group ${activeCategory === group.key ? 'active' : ''} ${
                collapsed === group.key ? 'collapsed' : ''
              }`}
              onMouseLeave={() => setCollapsed((c) => (c === group.key ? null : c))}
            >
              <button className="nav-group-trigger" type="button">
                {group.label}
                <span className="nav-group-caret">▾</span>
              </button>
              <div className="nav-dropdown">
                {group.tools.map((tool) => (
                  <NavLink
                    key={tool.path}
                    to={tool.path}
                    onClick={() => {
                      recordToolUse(tool.path)
                      setCollapsed(group.key)
                    }}
                    className={({ isActive }) =>
                      `nav-dropdown-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <span className="nav-dropdown-icon">{tool.icon}</span>
                    {tool.navLabel}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <ThemeToggle />

        <button
          className="nav-hamburger"
          type="button"
          aria-label="菜单"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </nav>

      {mobileOpen && (
        <div className="nav-mobile" onClick={closeMobile}>
          {GROUPS.map((group) => (
            <div key={group.key} className="nav-mobile-group">
              <span className="nav-mobile-label">{group.label}</span>
              {group.tools.map((tool) => (
                <NavLink
                  key={tool.path}
                  to={tool.path}
                  onClick={() => recordToolUse(tool.path)}
                  className={({ isActive }) =>
                    `nav-mobile-item ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="nav-dropdown-icon">{tool.icon}</span>
                  {tool.navLabel}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      )}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/json" element={<JsonToolPage />} />
        <Route path="/diff" element={<TextDiffPage />} />
        <Route path="/timestamp" element={<TimestampPage />} />
        <Route path="/qrcode" element={<QrCodePage />} />
        <Route path="/base64" element={<Base64Page />} />
        <Route path="/url" element={<UrlPage />} />
        <Route path="/jwt" element={<JwtPage />} />
        <Route path="/hash" element={<HashPage />} />
        <Route path="/uuid" element={<UuidPage />} />
        <Route path="/color" element={<ColorPage />} />
        <Route path="/regex" element={<RegexPage />} />
        <Route path="/radix" element={<RadixPage />} />
        <Route path="/cron" element={<CronPage />} />
        <Route path="/yaml" element={<YamlJsonPage />} />
      </Routes>
    </>
  )
}

export default App
