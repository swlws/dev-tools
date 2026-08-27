import { useTheme, type ThemePref } from '@/hooks/useTheme'
import './index.css'

const ICON: Record<ThemePref, string> = {
  system: '🌓',
  light: '☀️',
  dark: '🌙',
}

const LABEL: Record<ThemePref, string> = {
  system: '跟随系统',
  light: '浅色',
  dark: '深色',
}

// Cycles system → light → dark. Icon reflects the current preference.
export default function ThemeToggle() {
  const { preference, cycle } = useTheme()
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={cycle}
      title={`主题：${LABEL[preference]}（点击切换）`}
      aria-label={`主题：${LABEL[preference]}，点击切换`}
    >
      <span className="theme-toggle-icon">{ICON[preference]}</span>
    </button>
  )
}
