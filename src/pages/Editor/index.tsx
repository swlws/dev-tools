import { useState, useMemo } from 'react'
import './index.css'
import MarkdownPreview from '@/components/MarkdownPreview'
import { exportSvg, exportPng } from '@/utils/export'
import { DEFAULT_CONTENT } from './defaultContent'
import { useSeo } from '@/hooks/useSeo'
import { TOOLS } from '@/tools'
import Button from '@/components/Button'

const TOOL = TOOLS.find((t) => t.path === '/editor')!

function countMermaidBlocks(content: string): number {
  const matches = content.match(/```mermaid\b/g)
  return matches ? matches.length : 0
}

function getAllMermaidSvgs(): Map<string, string> {
  const map = new Map<string, string>()
  document.querySelectorAll('.mermaid-block svg').forEach((svgEl, index) => {
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svgEl)
    map.set(`chart_${index + 1}`, svgString)
  })
  return map
}

export default function EditorPage() {
  useSeo(TOOL.name, TOOL.description)
  const [content, setContent] = useState(DEFAULT_CONTENT)

  const mermaidCount = useMemo(() => countMermaidBlocks(content), [content])

  const handleExportAllSvg = () => {
    const map = getAllMermaidSvgs()
    map.forEach((svg, id) => {
      exportSvg(svg, `mermaid_${id}`)
    })
  }

  const handleExportAllPng = async () => {
    const map = getAllMermaidSvgs()
    for (const [id, svg] of map) {
      await exportPng(svg, `mermaid_${id}`)
    }
  }

  return (
    <div className="page editor-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <span className="chart-count">
            {mermaidCount > 0 ? `${mermaidCount} 个图表` : '暂无图表'}
          </span>
          <Button onClick={handleExportAllSvg} disabled={mermaidCount === 0}>
            导出全部 SVG
          </Button>
          <Button variant="primary" onClick={handleExportAllPng} disabled={mermaidCount === 0}>
            导出全部 PNG
          </Button>
        </div>
      </header>

      <div className="editor-body">
        <section className="editor-pane">
          <div className="pane-header">
            <span className="pane-label">Markdown</span>
          </div>
          <textarea
            className="editor-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="在此输入 Markdown 内容..."
            spellCheck={false}
          />
        </section>

        <section className="preview-pane">
          <div className="pane-header">
            <span className="pane-label">预览</span>
          </div>
          <div className="preview-scroll">
            <MarkdownPreview source={content} />
          </div>
        </section>
      </div>
    </div>
  )
}
