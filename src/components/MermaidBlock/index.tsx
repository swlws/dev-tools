import { useEffect, useRef, useId, useCallback } from 'react'
import mermaid from 'mermaid'
import './index.css'

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
})

interface MermaidBlockProps {
  code: string
}

export default function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const uniqueId = useId().replace(/:/g, '_')

  const renderChart = useCallback(async () => {
    if (!containerRef.current || !code.trim()) return

    try {
      const { svg } = await mermaid.render(`mermaid_${uniqueId}`, code.trim())
      containerRef.current.innerHTML = svg
    } catch (err) {
      containerRef.current.innerHTML = `<pre style="color:#dc2626;font-size:13px;padding:12px">Mermaid 渲染错误: ${(err as Error).message}</pre>`
    }
  }, [code, uniqueId])

  useEffect(() => {
    renderChart()
  }, [renderChart])

  return <div ref={containerRef} className="mermaid-block" />
}