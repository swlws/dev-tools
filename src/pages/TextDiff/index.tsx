import { useState, useCallback, useRef } from 'react'
import './index.css'
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useSeo } from '@/hooks/useSeo'
import { useTheme } from '@/hooks/useTheme'
import { TOOLS } from '@/tools'
import Button from '@/components/Button'

const TOOL = TOOLS.find((t) => t.path === '/diff')!

const LEFT_DEFAULT = `function greet(name) {
  console.log('Hello, ' + name);
  return true;
}

const items = [1, 2, 3];
for (const item of items) {
  process(item);
}`

const RIGHT_DEFAULT = `function greet(name: string): boolean {
  console.log(\`Hello, \${name}\`);
  return true;
}

const items = [1, 2, 3, 4];
for (const item of items) {
  processItem(item);
}

export default greet;`

export default function TextDiffPage() {
  useSeo(TOOL.name, TOOL.description)
  const { resolved } = useTheme()
  const [original, setOriginal] = useState(LEFT_DEFAULT)
  const [modified, setModified] = useState(RIGHT_DEFAULT)
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)

  const handleEditorMount: DiffOnMount = useCallback((diffEditor) => {
    editorRef.current = diffEditor
    const origEditor = diffEditor.getOriginalEditor()
    const modEditor = diffEditor.getModifiedEditor()

    origEditor.onDidChangeModelContent(() => {
      setOriginal(origEditor.getValue())
    })
    modEditor.onDidChangeModelContent(() => {
      setModified(modEditor.getValue())
    })
  }, [])

  const handleSwap = useCallback(() => {
    const orig = original
    const mod = modified
    setOriginal(mod)
    setModified(orig)
  }, [original, modified])

  const handleClear = useCallback(() => {
    setOriginal('')
    setModified('')
  }, [])

  return (
    <div className="page diff-page">
      <header className="page-header">
        <h1 className="page-title">{TOOL.name}</h1>
        <div className="header-actions">
          <Button onClick={handleSwap}>交换</Button>
          <Button onClick={handleClear}>清空</Button>
        </div>
      </header>

      <div className="diff-editor-wrapper">
        <div className="diff-card">
          <DiffEditor
            original={original}
            modified={modified}
            language="plaintext"
            theme={resolved === 'dark' ? 'vs-dark' : 'vs'}
            onMount={handleEditorMount}
            options={{
              readOnly: false,
              originalEditable: true,
              renderSideBySide: true,
              enableSplitViewResizing: true,
              scrollBeyondLastLine: false,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              folding: true,
              wordWrap: 'on',
              automaticLayout: true,
            }}
            height="100%"
          />
        </div>
      </div>
    </div>
  )
}
